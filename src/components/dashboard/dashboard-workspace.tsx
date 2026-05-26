"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import yamlLanguage from "highlight.js/lib/languages/yaml";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  GitForkIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import {
  ProxyGroupManager,
  StringSelect,
} from "@/components/dashboard/proxy-group-manager";
import {
  PROXY_GROUP_TEMPLATES,
  getDefaultRuleLinks,
  type ProxyGroupTemplate,
} from "@/lib/config/proxy-templates";
import {
  parseSubscriptionSources,
  serializeSubscriptionSources,
  type SubscriptionSource,
} from "@/lib/subscription-sources";

hljs.registerLanguage("yaml", yamlLanguage);

type RuleItem = { id: string; type: string; value: string; policy: string };
type ParseErrorRecord = { url?: string; input?: string; error?: string };
type ParseDiagnostic = {
  type: "duplicate" | "renamed" | "skipped";
  message: string;
};
type ValidationIssue = {
  severity: "error" | "warning";
  message: string;
};
type SourcePreviewState = {
  sourceId: string;
  cacheKey: string;
  loading: boolean;
  nodes: Record<string, unknown>[];
  errors: ParseErrorRecord[];
  diagnostics: ParseDiagnostic[];
  cached: boolean;
};
type YamlBlock = {
  key: string;
  label: string;
  content: string;
  startLine: number;
  count: number;
  foldable: boolean;
};
type ConfigRecord = {
  id: number;
  publicId: string;
  name: string;
  urls: string;
  settings?: Partial<AdvancedSettings> | null;
  proxyGroups: ProxyGroupTemplate[];
  rules: RuleItem[];
  parsedNodes?: Record<string, unknown>[] | null;
  generatedConfig?: string | null;
  cloudUrl?: string | null;
};

type AdvancedSettings = {
  port: number;
  socksPort: number;
  allowLan: boolean;
  mode: string;
  logLevel: string;
  externalController: string;
  secret: string;
  advancedDns: boolean;
};

const defaultGroups = () =>
  PROXY_GROUP_TEMPLATES.filter((template) =>
    ["1", "2", "3", "6", "25", "23"].includes(template.id),
  ).map((template) => ({
    ...template,
    ruleLinks: getDefaultRuleLinks(template),
  }));

const ruleTypes = [
  "DOMAIN-SUFFIX",
  "DOMAIN",
  "DOMAIN-KEYWORD",
  "DOMAIN-REGEX",
  "IP-CIDR",
  "IP-CIDR6",
  "GEOIP",
  "PROCESS-NAME",
  "PROCESS-PATH",
  "SRC-IP-CIDR",
  "DST-PORT",
  "SRC-PORT",
  "MATCH",
];

const yamlFoldableSections = new Map([
  ["proxies", "proxies"],
  ["proxy-groups", "proxy-groups"],
  ["rule-providers", "rule-providers"],
  ["rules", "rules"],
]);

const defaultAdvancedSettings: AdvancedSettings = {
  port: 7897,
  socksPort: 0,
  allowLan: true,
  mode: "rule",
  logLevel: "info",
  externalController: "",
  secret: "set-your-secret",
  advancedDns: true,
};

const initialVisibleRuleCount = 50;
const visibleRuleStep = 50;

const normalizeAdvancedSettings = (
  settings?: Partial<AdvancedSettings> | null,
): AdvancedSettings => ({
  ...defaultAdvancedSettings,
  ...settings,
  advancedDns: typeof settings?.advancedDns === "boolean" ? settings.advancedDns : defaultAdvancedSettings.advancedDns,
  port: Number(settings?.port || defaultAdvancedSettings.port),
  socksPort: Number(settings?.socksPort || defaultAdvancedSettings.socksPort),
});

const serializeAdvancedSettings = (settings: AdvancedSettings) => ({
  ...settings,
  socksPort: settings.socksPort > 0 ? settings.socksPort : undefined,
});

const getWorkspaceSignature = ({
  nodes,
  groups,
  rules,
  settings,
}: {
  nodes: Record<string, unknown>[];
  groups: ProxyGroupTemplate[];
  rules: RuleItem[];
  settings: AdvancedSettings;
}) => JSON.stringify({ nodes, groups, rules, settings: serializeAdvancedSettings(settings) });

const getDisplayCloudUrl = (cloudUrl?: string | null) => {
  if (!cloudUrl) return "";
  if (/^https?:\/\//.test(cloudUrl) || typeof window === "undefined") return cloudUrl;
  return window.location.origin + cloudUrl;
};

const getInitialWorkspaceState = (config?: ConfigRecord | null) => {
  const urls = config?.urls || "";

  return {
    currentConfigId: config?.id ?? null,
    name: config?.name || "ruley",
    urls,
    sources: parseSubscriptionSources(urls),
    nodes: config?.parsedNodes || [],
    groups: config?.proxyGroups?.length ? config.proxyGroups : defaultGroups(),
    rules: config?.rules || [],
    advancedSettings: normalizeAdvancedSettings(config?.settings),
    generatedConfig: config?.generatedConfig || "",
    cloudUrl: getDisplayCloudUrl(config?.cloudUrl),
  };
};

const isComplexRegex = (value: string) =>
  value.length > 120 || /\([^)]*[+*][^)]*\)[+*?{]/.test(value);

const matchNodesByFilter = (
  nodes: Record<string, unknown>[],
  filter: string,
) => {
  if (!filter || nodes.length === 0) return [];
  if (isComplexRegex(filter)) {
    const lower = filter.toLowerCase();
    return nodes.filter((node) =>
      String(node.name || "")
        .toLowerCase()
        .includes(lower),
    );
  }
  try {
    const regex = new RegExp(filter, "i");
    return nodes.filter((node) => regex.test(String(node.name || "")));
  } catch {
    return null;
  }
};

const isBuiltInPolicyFilter = (filter: string) => {
  const normalized = filter.replace(/\s/g, "").toUpperCase();
  return normalized === "DIRECT" || normalized === "REJECT" || normalized === "(REJECT|DIRECT)" || normalized === "(DIRECT|REJECT)";
};

const validateWorkspace = ({
  nodes,
  groups,
  rules,
}: {
  nodes: Record<string, unknown>[];
  groups: ProxyGroupTemplate[];
  rules: RuleItem[];
}): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const policies = new Set([
    ...groups.map((group) => `${group.icon} ${group.name}`),
    "DIRECT",
    "REJECT",
  ]);

  if (nodes.length === 0) {
    issues.push({ severity: "error", message: "请先解析出至少 1 个节点" });
  }
  if (groups.length === 0) {
    issues.push({ severity: "error", message: "至少需要保留 1 个代理组" });
  }

  for (const group of groups) {
    const groupName = `${group.icon} ${group.name}`;
    if (!group.name.trim()) {
      issues.push({ severity: "error", message: "代理组名称不能为空" });
    }
    const matched = matchNodesByFilter(nodes, group.filter || "");
    if (matched === null) {
      issues.push({
        severity: "error",
        message: `${groupName} 的节点筛选正则无效`,
      });
    } else if (
      nodes.length > 0 &&
      (group.policyOptions || []).includes("matched") &&
      !isBuiltInPolicyFilter(group.filter || "") &&
      matched.length === 0
    ) {
      issues.push({
        severity: "warning",
        message: `${groupName} 未匹配到任何真实节点，将回退到其他策略`,
      });
    }
  }

  for (const rule of rules) {
    if (rule.type !== "MATCH" && !rule.value.trim()) {
      issues.push({
        severity: "error",
        message: `${rule.type} 规则的匹配值不能为空`,
      });
    }
    if (!policies.has(rule.policy)) {
      issues.push({
        severity: "error",
        message: `规则引用了不存在的策略：${rule.policy}`,
      });
    }
  }

  return issues;
};

const getYamlBlocks = (yamlText: string): YamlBlock[] => {
  const lines = yamlText.split("\n");
  const blocks: YamlBlock[] = [];
  let currentKey = "root";
  let currentLines: string[] = [];
  let currentStartLine = 1;

  const pushCurrent = () => {
    if (currentLines.length === 0) return;
    const foldable = yamlFoldableSections.has(currentKey);
    blocks.push({
      key: currentKey,
      label: yamlFoldableSections.get(currentKey) || currentKey,
      content: currentLines.join("\n"),
      startLine: currentStartLine,
      count: currentLines.filter((line) => /^\s*-\s/.test(line)).length,
      foldable,
    });
  };

  for (const [index, line] of lines.entries()) {
    const topLevel = line.match(/^([A-Za-z0-9_-]+):/);
    if (topLevel) {
      pushCurrent();
      currentKey = topLevel[1];
      currentLines = [line];
      currentStartLine = index + 1;
    } else {
      currentLines.push(line);
    }
  }
  pushCurrent();

  return blocks.filter((block) => block.content.trim());
};

const parseRuleLine = (
  line: string,
  fallbackPolicy: string,
): RuleItem | null => {
  const parts = line
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const [type, valueOrPolicy, policy] = parts;
  if (!ruleTypes.includes(type)) return null;
  if (type === "MATCH") {
    return {
      id: crypto.randomUUID(),
      type,
      value: "",
      policy: valueOrPolicy || fallbackPolicy,
    };
  }
  if (!valueOrPolicy) return null;
  return {
    id: crypto.randomUUID(),
    type,
    value: valueOrPolicy,
    policy: policy || fallbackPolicy,
  };
};

function HighlightedYaml({
  content,
  startLine = 1,
  compact = false,
}: {
  content: string;
  startLine?: number;
  compact?: boolean;
}) {
  const highlighted = hljs.highlight(content, {
    language: "yaml",
    ignoreIllegals: true,
  }).value;
  const highlightedLines = highlighted.split("\n");

  return (
    <pre
      className={`yaml-highlight overflow-auto font-mono ${compact ? "max-h-96 py-3 pr-3 pl-1" : "py-0 pr-2 pl-1"}`}
    >
      <code>
        {highlightedLines.map((line, index) => (
          <span className="yaml-highlight-line" key={`${startLine + index}-${line}`}>
            <span className="yaml-highlight-line-number">{startLine + index}</span>
            <span
              className="yaml-highlight-line-code"
              dangerouslySetInnerHTML={{ __html: line || " " }}
            />
          </span>
        ))}
      </code>
    </pre>
  );
}

function AdvancedSettingsDialog({
  settings,
  onChange,
}: {
  settings: AdvancedSettings;
  onChange: (updates: Partial<AdvancedSettings>) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <SettingsIcon aria-hidden="true" />
        高级配置
      </DialogTrigger>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>高级配置</DialogTitle>
          <DialogDescription>
            这些设置会写入生成的 Mihomo YAML，并随配置一起保存。
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">高级防泄漏 DNS</span>
                <span className="text-muted-foreground text-sm">
                  启用更稳妥的 DNS fallback 与过滤配置
                </span>
              </div>
              <Switch
                checked={settings.advancedDns}
                onCheckedChange={(advancedDns) => onChange({ advancedDns })}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Mixed Port
                <Input
                  nativeInput
                  type="number"
                  value={settings.port}
                  onChange={(event) =>
                    onChange({
                      port: Number(event.target.value || defaultAdvancedSettings.port),
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Socks Port
                <Input
                  nativeInput
                  type="number"
                  value={settings.socksPort}
                  onChange={(event) =>
                    onChange({ socksPort: Number(event.target.value || 0) })
                  }
                  placeholder="0 表示不写入"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Mode
                <StringSelect
                  items={[
                    { label: "rule", value: "rule" },
                    { label: "global", value: "global" },
                    { label: "direct", value: "direct" },
                  ]}
                  value={settings.mode}
                  onChange={(mode) => onChange({ mode })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Log Level
                <StringSelect
                  items={[
                    { label: "silent", value: "silent" },
                    { label: "error", value: "error" },
                    { label: "warning", value: "warning" },
                    { label: "info", value: "info" },
                    { label: "debug", value: "debug" },
                  ]}
                  value={settings.logLevel}
                  onChange={(logLevel) => onChange({ logLevel })}
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Allow LAN</span>
                <span className="text-muted-foreground text-sm">
                  允许局域网设备连接本机代理端口
                </span>
              </div>
              <Switch
                checked={settings.allowLan}
                onCheckedChange={(allowLan) => onChange({ allowLan })}
              />
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              External Controller
              <Input
                nativeInput
                value={settings.externalController}
                onChange={(event) =>
                  onChange({ externalController: event.target.value })
                }
                placeholder="127.0.0.1:9090"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Secret
              <Input
                nativeInput
                value={settings.secret}
                onChange={(event) => onChange({ secret: event.target.value })}
                placeholder="set-your-secret"
              />
            </label>
          </div>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button />}>完成</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export function DashboardWorkspace({ initialConfig }: { initialConfig?: ConfigRecord | null }) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const initialState = getInitialWorkspaceState(initialConfig);
  const [name, setName] = useState(initialState.name);
  const [urls, setUrls] = useState(initialState.urls);
  const [sources, setSources] = useState<SubscriptionSource[]>(initialState.sources);
  const [nodes, setNodes] = useState<Record<string, unknown>[]>(initialState.nodes);
  const [groups, setGroups] = useState<ProxyGroupTemplate[]>(initialState.groups);
  const [rules, setRules] = useState<RuleItem[]>(initialState.rules);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(initialState.advancedSettings);
  const [generatedConfig, setGeneratedConfig] = useState(initialState.generatedConfig);
  const [generatedConfigSignature, setGeneratedConfigSignature] = useState(
    initialState.generatedConfig
      ? getWorkspaceSignature({
          nodes: initialState.nodes,
          groups: initialState.groups,
          rules: initialState.rules,
          settings: initialState.advancedSettings,
        })
      : "",
  );
  const [cloudUrl, setCloudUrl] = useState(initialState.cloudUrl);
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(initialState.currentConfigId);
  const [visibleRuleCount, setVisibleRuleCount] = useState(initialVisibleRuleCount);
  const [parseErrors, setParseErrors] = useState<ParseErrorRecord[]>([]);
  const [parseDiagnostics, setParseDiagnostics] = useState<ParseDiagnostic[]>(
    [],
  );
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>(
    [],
  );
  const [collapsedYamlSections, setCollapsedYamlSections] = useState<
    Set<string>
  >(new Set());
  const [bulkRulesText, setBulkRulesText] = useState("");
  const [sourcePreview, setSourcePreview] = useState<SourcePreviewState | null>(
    null,
  );
  const [sourcePreviewCache, setSourcePreviewCache] = useState<
    Record<string, SourcePreviewState>
  >({});

  const policies = useMemo(
    () => [
      ...groups.map((group) => `${group.icon} ${group.name}`),
      "DIRECT",
      "REJECT",
    ],
    [groups],
  );

  const workspaceSignature = useMemo(
    () => getWorkspaceSignature({ nodes, groups, rules, settings: advancedSettings }),
    [nodes, groups, rules, advancedSettings],
  );
  const isGeneratedConfigCurrent = Boolean(generatedConfig && generatedConfigSignature === workspaceSignature);
  const yamlStatus = !generatedConfig ? "未生成" : isGeneratedConfigCurrent ? "已同步" : "需重新生成";
  const yamlStatusVariant: "outline" | "success" | "warning" = !generatedConfig ? "outline" : isGeneratedConfigCurrent ? "success" : "warning";

  const syncSources = (nextSources: SubscriptionSource[]) => {
    setSources(nextSources);
    setUrls(serializeSubscriptionSources(nextSources));
  };

  const applyConfig = (config: ConfigRecord) => {
    const nextState = getInitialWorkspaceState(config);
    setCurrentConfigId(nextState.currentConfigId);
    setName(nextState.name);
    setUrls(nextState.urls);
    setSources(nextState.sources);
    setAdvancedSettings(nextState.advancedSettings);
    setGroups(nextState.groups);
    setRules(nextState.rules);
    setNodes(nextState.nodes);
    setGeneratedConfig(nextState.generatedConfig);
    setGeneratedConfigSignature(
      nextState.generatedConfig
        ? getWorkspaceSignature({
            nodes: nextState.nodes,
            groups: nextState.groups,
            rules: nextState.rules,
            settings: nextState.advancedSettings,
          })
        : "",
    );
    setCloudUrl(nextState.cloudUrl);
    setVisibleRuleCount(initialVisibleRuleCount);
    setParseErrors([]);
    setParseDiagnostics([]);
    setValidationIssues([]);
  };

  const updateSource = (id: string, updates: Partial<SubscriptionSource>) => {
    syncSources(
      sources.map((source) =>
        source.id === id ? { ...source, ...updates } : source,
      ),
    );
  };

  const addSource = () => {
    const nextIndex = sources.length + 1;
    syncSources([
      ...sources,
      {
        id: crypto.randomUUID(),
        name: `订阅源 ${nextIndex}`,
        url: "",
        enabled: true,
      },
    ]);
  };

  const removeSource = (id: string) => {
    syncSources(sources.filter((source) => source.id !== id));
  };

  const updateAdvancedSettings = (updates: Partial<AdvancedSettings>) => {
    setAdvancedSettings((current) => ({ ...current, ...updates }));
  };

  const previewSourceNodes = async (
    source: SubscriptionSource,
    force = false,
  ) => {
    const cacheKey = `${source.id}:${source.url.trim()}`;
    const cachedPreview = sourcePreviewCache[cacheKey];
    if (!force && cachedPreview) {
      setSourcePreview({ ...cachedPreview, cached: true });
      return;
    }
    if (force) {
      setSourcePreviewCache((cache) => {
        const next = { ...cache };
        delete next[cacheKey];
        return next;
      });
    }

    if (!source.url.trim()) {
      setSourcePreview({
        sourceId: source.id,
        cacheKey,
        loading: false,
        nodes: [],
        errors: [{ error: "订阅源 URL 不能为空" }],
        diagnostics: [],
        cached: false,
      });
      return;
    }

    setSourcePreview({
      sourceId: source.id,
      cacheKey,
      loading: true,
      nodes: [],
      errors: [],
      diagnostics: [],
      cached: false,
    });

    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: serializeSubscriptionSources([{ ...source, enabled: true }]),
      }),
    });
    const data = await response.json();
    if (!data.success) {
      setSourcePreview({
        sourceId: source.id,
        cacheKey,
        loading: false,
        nodes: [],
        errors: [{ error: data.error || "解析失败" }],
        diagnostics: [],
        cached: false,
      });
      return;
    }

    const nextPreview = {
      sourceId: source.id,
      cacheKey,
      loading: false,
      nodes: data.proxies || [],
      errors: data.errors || [],
      diagnostics: data.diagnostics || [],
      cached: false,
    };
    setSourcePreview(nextPreview);
    setSourcePreviewCache((cache) => ({ ...cache, [cacheKey]: nextPreview }));
  };

  const deferredGeneratedConfig = useDeferredValue(generatedConfig);
  const yamlBlocks = useMemo(
    () => getYamlBlocks(deferredGeneratedConfig),
    [deferredGeneratedConfig],
  );
  const displayedRules = useMemo(
    () => rules.slice(0, visibleRuleCount),
    [rules, visibleRuleCount],
  );

  const toggleYamlSection = (key: string) => {
    const next = new Set(collapsedYamlSections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCollapsedYamlSections(next);
  };

  const moveRule = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= rules.length) return;
    const next = [...rules];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setRules(next);
  };

  const importBulkRules = () => {
    const imported = bulkRulesText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseRuleLine(line, policies[0] || "DIRECT"))
      .filter((rule): rule is RuleItem => Boolean(rule));

    if (imported.length === 0) {
      toastManager.add({ type: "warning", title: "没有可导入的规则" });
      return;
    }
    setRules([...rules, ...imported]);
    setBulkRulesText("");
    toastManager.add({
      type: "success",
      title: "规则已导入",
      description: `新增 ${imported.length} 条规则`,
    });
  };

  useEffect(() => {
    const id = searchParams.get("configId");
    if (!id) return;
    if (initialConfig?.publicId === id) {
      applyConfig(initialConfig);
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/configs/${id}`);
      const data = await response.json();
      if (!data.success) return;
      const config = data.config as ConfigRecord;
      applyConfig(config);
      toastManager.add({
        type: "success",
        title: "配置已加载",
        description: config.name,
      });
    });
  }, [searchParams, initialConfig?.publicId]);

  const parseNodes = () =>
    startTransition(async () => {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await response.json();
      if (!data.success) {
        setParseErrors([{ error: data.error || "解析失败" }]);
        setParseDiagnostics([]);
        toastManager.add({
          type: "error",
          title: "解析失败",
          description: data.error,
        });
        return;
      }
      setNodes(data.proxies || []);
      setParseErrors(data.errors || []);
      setParseDiagnostics(data.diagnostics || []);
      setValidationIssues([]);
      toastManager.add({
        type: "success",
        title: "解析完成",
        description: `共 ${data.nodesCount} 个节点`,
      });
    });

  const generate = () =>
    startTransition(async () => {
      const issues = validateWorkspace({ nodes, groups, rules });
      setValidationIssues(issues);
      const blockingIssues = issues.filter(
        (issue) => issue.severity === "error",
      );
      if (blockingIssues.length > 0) {
        toastManager.add({
          type: "warning",
          title: "生成前校验未通过",
          description: blockingIssues[0]?.message,
        });
        return;
      }
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proxies: nodes,
          proxyGroups: groups,
          rules,
          settings: serializeAdvancedSettings(advancedSettings),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        toastManager.add({
          type: "error",
          title: "生成失败",
          description: data.error,
        });
        return;
      }
      setGeneratedConfig(data.config);
      setGeneratedConfigSignature(workspaceSignature);
      toastManager.add({ type: "success", title: "YAML 已生成" });
    });

  const saveCloud = (parentId?: number) =>
    startTransition(async () => {
      if (!urls.trim()) {
        toastManager.add({ type: "warning", title: "请先填写订阅来源" });
        return;
      }
      const issues = validateWorkspace({ nodes, groups, rules });
      setValidationIssues(issues);
      const blockingIssues = issues.filter(
        (issue) => issue.severity === "error",
      );
      if (blockingIssues.length > 0) {
        toastManager.add({
          type: "warning",
          title: "保存前校验未通过",
          description: blockingIssues[0]?.message,
        });
        return;
      }
      const response = await fetch("/api/cloud-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls,
          configId: parentId ? undefined : currentConfigId,
          parentId,
          name: parentId ? `${name} 分支` : name,
          proxyGroups: groups,
          rules,
          settings: serializeAdvancedSettings(advancedSettings),
          parsedNodes: nodes,
          generatedConfig: isGeneratedConfigCurrent ? generatedConfig : undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        toastManager.add({
          type: "error",
          title: "保存失败",
          description: data.error,
        });
        return;
      }
      setCurrentConfigId(Number(data.configId));
      setCloudUrl(window.location.origin + data.subUrl);
      toastManager.add({
        type: "success",
        title: parentId ? "分支已创建" : "配置已托管",
      });
    });

  const downloadYaml = () => {
    if (!generatedConfig) return;
    const blob = new Blob([generatedConfig], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name || "ruley"}.yaml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="sticky top-[4.25rem] z-30 flex flex-col gap-3 rounded-xl border bg-background/95 p-3 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              配置工作台
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} loading={isPending}>
              <PlayIcon aria-hidden="true" />
              生成 YAML
            </Button>
            <Button
              variant="outline"
              onClick={downloadYaml}
              disabled={!generatedConfig}
            >
              <DownloadIcon aria-hidden="true" />
              下载
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveCloud()}
              loading={isPending}
            >
              <SaveIcon aria-hidden="true" />
              {currentConfigId ? "更新托管" : "保存托管"}
            </Button>
            <Button
              variant="outline"
              onClick={() => currentConfigId && saveCloud(currentConfigId)}
              disabled={!currentConfigId}
            >
              <GitForkIcon aria-hidden="true" />
              创建分支
            </Button>
          </div>
        </section>

        <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <Card className="min-h-128">
            <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-1">
                <CardTitle>订阅来源</CardTitle>
                <CardDescription>
                  支持订阅链接、Base64、YAML 或节点 URI
                </CardDescription>
              </div>
              <AdvancedSettingsDialog
                settings={advancedSettings}
                onChange={updateAdvancedSettings}
              />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                配置名称
                <Input
                  nativeInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">订阅源</div>
                  <Button variant="outline" size="sm" onClick={addSource}>
                    <PlusIcon aria-hidden="true" />
                    添加
                  </Button>
                </div>
                {sources.length === 0 ? (
                  <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                    暂无订阅源，点击添加后输入订阅链接、节点 URI、Base64 或
                    YAML。
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {sources.map((source, index) => (
                      <div key={source.id} className="rounded-xl border p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={(enabled) =>
                              updateSource(source.id, { enabled })
                            }
                          />
                          <Input
                            nativeInput
                            value={source.name}
                            onChange={(event) =>
                              updateSource(source.id, {
                                name: event.target.value,
                              })
                            }
                            aria-label={`订阅源 ${index + 1} 名称`}
                          />
                          <Button
                            variant="destructive-outline"
                            size="icon"
                            onClick={() => removeSource(source.id)}
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            nativeInput
                            value={source.url}
                            onChange={(event) =>
                              updateSource(source.id, {
                                url: event.target.value,
                              })
                            }
                            placeholder="订阅链接、节点 URI 或 Base64"
                            className="font-mono text-xs"
                          />
                          <Dialog>
                            <DialogTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewSourceNodes(source)}
                                />
                              }
                            >
                              预览
                            </DialogTrigger>
                            <DialogPopup>
                              <DialogHeader>
                                <div className="flex items-start justify-between gap-3 pr-8">
                                  <div className="flex flex-col gap-2">
                                    <DialogTitle>节点预览</DialogTitle>
                                    <DialogDescription>
                                      {source.name}
                                    </DialogDescription>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      previewSourceNodes(source, true)
                                    }
                                  >
                                    <RefreshCwIcon aria-hidden="true" />
                                    刷新
                                  </Button>
                                </div>
                              </DialogHeader>
                              <DialogPanel>
                                {sourcePreview?.sourceId === source.id &&
                                sourcePreview.loading ? (
                                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                                    正在解析订阅源...
                                  </div>
                                ) : sourcePreview?.sourceId === source.id ? (
                                  <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="info">
                                        节点 {sourcePreview.nodes.length}
                                      </Badge>
                                      {sourcePreview.cached && (
                                        <Badge variant="success">缓存</Badge>
                                      )}
                                      {sourcePreview.errors.length > 0 && (
                                        <Badge variant="error">
                                          错误 {sourcePreview.errors.length}
                                        </Badge>
                                      )}
                                    </div>
                                    {sourcePreview.diagnostics.length > 0 && (
                                      <div className="grid gap-2">
                                        {sourcePreview.diagnostics.map(
                                          (diagnostic, diagnosticIndex) => (
                                            <div
                                              key={`source-diagnostic-${diagnosticIndex}`}
                                              className="flex items-start gap-2 rounded-md border bg-background p-2 text-sm"
                                            >
                                              <Badge
                                                variant={
                                                  diagnostic.type ===
                                                  "duplicate"
                                                    ? "warning"
                                                    : "outline"
                                                }
                                              >
                                                {diagnostic.type === "duplicate"
                                                  ? "去重"
                                                  : diagnostic.type ===
                                                      "renamed"
                                                    ? "重命名"
                                                    : "跳过"}
                                              </Badge>
                                              <span className="text-muted-foreground">
                                                {diagnostic.message}
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                    {sourcePreview.errors.length > 0 && (
                                      <div className="grid gap-2">
                                        {sourcePreview.errors.map(
                                          (error, errorIndex) => (
                                            <div
                                              key={`source-error-${errorIndex}`}
                                              className="rounded-lg border border-destructive/30 bg-destructive/8 p-2 text-sm"
                                            >
                                              {error.error || "解析失败"}
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                    {sourcePreview.nodes.length > 0 ? (
                                      <div className="max-h-96 overflow-auto rounded-lg border">
                                        {sourcePreview.nodes.map(
                                          (node, nodeIndex) => (
                                            <div
                                              key={`${String(node.name)}-${nodeIndex}`}
                                              className="grid gap-1 border-b p-2 text-sm last:border-b-0"
                                            >
                                              <div className="font-medium">
                                                {String(node.name || "Unnamed")}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {String(node.type || "unknown")}{" "}
                                                · {String(node.server || "-")}:
                                                {String(node.port || "-")}
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                                        暂无可预览节点
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                                    点击预览后显示节点
                                  </div>
                                )}
                              </DialogPanel>
                            </DialogPopup>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={parseNodes}
                loading={isPending}
              >
                <RefreshCwIcon aria-hidden="true" />
                解析节点
              </Button>
              {(parseErrors.length > 0 ||
                parseDiagnostics.length > 0 ||
                validationIssues.length > 0) && (
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangleIcon className="size-4" aria-hidden="true" />
                    诊断与校验
                  </div>
                  {validationIssues.length > 0 && (
                    <div className="flex flex-col gap-0">
                      <div className="text-muted-foreground text-xs">
                        生成前校验
                      </div>
                      {validationIssues.map((issue, index) => (
                        <div
                          key={`validation-${index}`}
                          className="flex items-start gap-2 rounded-lg border bg-background p-2 text-sm"
                        >
                          <Badge
                            variant={
                              issue.severity === "error" ? "error" : "warning"
                            }
                          >
                            {issue.severity === "error" ? "错误" : "警告"}
                          </Badge>
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {parseErrors.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>解析错误</span>
                        <Badge variant="error">{parseErrors.length}</Badge>
                      </div>
                      {parseErrors.map((error, index) => (
                        <div
                          key={`parse-error-${index}`}
                          className="grid gap-1 rounded-lg border border-destructive/30 bg-destructive/8 p-2 text-sm"
                        >
                          {(error.url || error.input) && (
                            <code className="break-all text-xs text-muted-foreground">
                              {error.url || error.input}
                            </code>
                          )}
                          <span>{error.error || "解析失败"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {parseDiagnostics.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>解析处理</span>
                        <Badge variant="outline">
                          {parseDiagnostics.length}
                        </Badge>
                      </div>
                      {parseDiagnostics.map((diagnostic, index) => (
                        <div
                          key={`parse-diagnostic-${index}`}
                          className="flex items-start gap-2 rounded-lg border bg-background p-2 text-sm text-muted-foreground"
                        >
                          <Badge
                            variant={
                              diagnostic.type === "duplicate"
                                ? "warning"
                                : "outline"
                            }
                          >
                            {diagnostic.type === "duplicate"
                              ? "去重"
                              : diagnostic.type === "renamed"
                                ? "重命名"
                                : "跳过"}
                          </Badge>
                          {diagnostic.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="min-h-0 min-w-0">
            <Card className="h-128 min-h-0">
              <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-1">
                  <CardTitle>YAML 预览</CardTitle>
                  <CardDescription>
                    生成后可下载或保存为云端托管配置
                  </CardDescription>
                </div>
                <div className="flex max-w-xl flex-wrap justify-start gap-1.5 md:justify-end">
                  <Badge variant={yamlStatusVariant}>{yamlStatus}</Badge>
                  <Badge variant="info">节点 {nodes.length}</Badge>
                  <Badge variant="success">代理组 {groups.length}</Badge>
                  <Badge variant="warning">规则 {rules.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 flex flex-col gap-3 overflow-hidden">
                {cloudUrl && (
                  <div className="flex shrink-0 gap-2">
                    <Input nativeInput readOnly value={cloudUrl} />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(cloudUrl);
                        toastManager.add({ type: "success", title: "已复制" });
                      }}
                    >
                      <CopyIcon aria-hidden="true" />
                    </Button>
                  </div>
                )}
                <div className="min-h-0 max-h-full flex-1 overflow-auto rounded-xl bg-muted p-3 text-xs leading-relaxed">
                  {generatedConfig ? (
                    <div className="flex flex-col gap-2">
                      {yamlBlocks.map((block) => {
                        const collapsed = collapsedYamlSections.has(block.key);
                        if (!block.foldable) {
                          return (
                            <HighlightedYaml
                              key={block.key}
                              content={block.content}
                              startLine={block.startLine}
                            />
                          );
                        }

                        return (
                          <section
                            key={block.key}
                            className="my-1 rounded-lg border bg-background/72 first:mt-0 last:mb-0"
                          >
                            <button
                              type="button"
                              onClick={() => toggleYamlSection(block.key)}
                              className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left"
                            >
                              <span className="flex items-center gap-2 font-medium">
                                {collapsed ? (
                                  <ChevronRightIcon
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ChevronDownIcon
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                )}
                                {block.label}
                              </span>
                              <Badge variant="outline">{block.count}</Badge>
                            </button>
                            {!collapsed && (
                              <div className="yaml-collapse">
                                <div className="min-h-0 overflow-hidden">
                                  <HighlightedYaml
                                    content={block.content}
                                    startLine={block.startLine}
                                    compact={block.foldable}
                                  />
                                </div>
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">尚未生成配置</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ProxyGroupManager groups={groups} onGroupsChange={setGroups} />

        <div className="grid gap-6">
          <Card className="min-h-88">
            <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-1">
                <CardTitle>自定义规则</CardTitle>
                <CardDescription>
                  添加优先级高于兜底规则的手动分流项
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  批量导入
                </DialogTrigger>
                <DialogPopup>
                  <DialogHeader>
                    <DialogTitle>批量导入规则</DialogTitle>
                    <DialogDescription>
                      每行一条规则，格式为 TYPE,value,policy；MATCH 使用
                      MATCH,policy。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogPanel>
                    <Textarea
                      value={bulkRulesText}
                      onChange={(event) => setBulkRulesText(event.target.value)}
                      placeholder="DOMAIN-SUFFIX,example.com,DIRECT&#10;DOMAIN-KEYWORD,openai,🚀 节点选择&#10;MATCH,🐟 漏网之鱼"
                      className="min-h-48 font-mono text-xs"
                    />
                  </DialogPanel>
                  <DialogFooter>
                    <DialogClose render={<Button variant="ghost" />}>
                      取消
                    </DialogClose>
                    <DialogClose
                      render={
                        <Button
                          disabled={!bulkRulesText.trim()}
                          onClick={importBulkRules}
                        />
                      }
                    >
                      导入规则
                    </DialogClose>
                  </DialogFooter>
                </DialogPopup>
              </Dialog>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {displayedRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="grid items-start gap-2 rounded-xl border p-3 lg:grid-cols-[auto_1fr_1.4fr_1.4fr_auto]"
                >
                  <div className="flex gap-1 pt-0.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => moveRule(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUpIcon aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => moveRule(index, 1)}
                      disabled={index === rules.length - 1}
                    >
                      <ArrowDownIcon aria-hidden="true" />
                    </Button>
                  </div>
                  <StringSelect
                    items={ruleTypes.map((type) => ({
                      label: type,
                      value: type,
                    }))}
                    value={rule.type}
                    onChange={(value) => {
                      const next = [...rules];
                      next[index] = { ...rule, type: value };
                      setRules(next);
                    }}
                  />
                  <Input
                    nativeInput
                    value={rule.value}
                    disabled={rule.type === "MATCH"}
                    onChange={(event) => {
                      const next = [...rules];
                      next[index] = { ...rule, value: event.target.value };
                      setRules(next);
                    }}
                    placeholder="example.com"
                  />
                  <StringSelect
                    items={policies.map((policy) => ({
                      label: policy,
                      value: policy,
                    }))}
                    value={rule.policy}
                    onChange={(value) => {
                      const next = [...rules];
                      next[index] = { ...rule, policy: value };
                      setRules(next);
                    }}
                  />
                  <Button
                    variant="destructive-outline"
                    size="icon-sm"
                    onClick={() =>
                      setRules(
                        rules.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {visibleRuleCount < rules.length && (
                <Button
                  variant="outline"
                  onClick={() => setVisibleRuleCount((count) => Math.min(count + visibleRuleStep, rules.length))}
                >
                  加载更多规则（{visibleRuleCount}/{rules.length}）
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  setRules([
                    ...rules,
                    {
                      id: crypto.randomUUID(),
                      type: "DOMAIN-SUFFIX",
                      value: "",
                      policy: policies[0] || "DIRECT",
                    },
                  ])
                }
              >
                添加规则
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
