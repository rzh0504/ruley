"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CopyIcon, DownloadIcon, GitForkIcon, PlayIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { ProxyGroupManager, StringSelect } from "@/components/dashboard/proxy-group-manager";
import { PROXY_GROUP_TEMPLATES, getDefaultRuleLinks, type ProxyGroupTemplate } from "@/lib/config/proxy-templates";

type RuleItem = { id: string; type: string; value: string; policy: string };
type ConfigRecord = {
  id: number;
  name: string;
  urls: string;
  advancedDns: boolean;
  proxyGroups: ProxyGroupTemplate[];
  rules: RuleItem[];
  parsedNodes?: Record<string, unknown>[] | null;
};

const defaultGroups = () =>
  PROXY_GROUP_TEMPLATES.filter((template) => ["1", "2", "3", "6", "25", "23"].includes(template.id)).map((template) => ({
    ...template,
    ruleLinks: getDefaultRuleLinks(template),
  }));

const ruleTypes = ["DOMAIN-SUFFIX", "DOMAIN", "DOMAIN-KEYWORD", "IP-CIDR", "GEOIP", "MATCH"];

export function DashboardWorkspace() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("ruley");
  const [urls, setUrls] = useState("");
  const [nodes, setNodes] = useState<Record<string, unknown>[]>([]);
  const [groups, setGroups] = useState<ProxyGroupTemplate[]>(defaultGroups);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [advancedDns, setAdvancedDns] = useState(true);
  const [generatedConfig, setGeneratedConfig] = useState("");
  const [cloudUrl, setCloudUrl] = useState("");
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);

  const policies = useMemo(() => [
    ...groups.map((group) => `${group.icon} ${group.name}`),
    "DIRECT",
    "REJECT",
  ], [groups]);

  useEffect(() => {
    const id = searchParams.get("configId");
    if (!id) return;
    startTransition(async () => {
      const response = await fetch(`/api/configs/${id}`);
      const data = await response.json();
      if (!data.success) return;
      const config = data.config as ConfigRecord;
      setCurrentConfigId(config.id);
      setName(config.name || "ruley");
      setUrls(config.urls || "");
      setAdvancedDns(Boolean(config.advancedDns));
      setGroups(config.proxyGroups?.length ? config.proxyGroups : defaultGroups());
      setRules(config.rules || []);
      setNodes(config.parsedNodes || []);
      setGeneratedConfig("");
      setCloudUrl("");
      toastManager.add({ type: "success", title: "配置已加载", description: config.name });
    });
  }, [searchParams]);

  const parseNodes = () => startTransition(async () => {
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    const data = await response.json();
    if (!data.success) {
      toastManager.add({ type: "error", title: "解析失败", description: data.error });
      return;
    }
    setNodes(data.proxies || []);
    toastManager.add({ type: "success", title: "解析完成", description: `共 ${data.nodesCount} 个节点` });
  });

  const generate = () => startTransition(async () => {
    if (nodes.length === 0) {
      toastManager.add({ type: "warning", title: "请先解析节点" });
      return;
    }
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxies: nodes, proxyGroups: groups, rules, settings: { advancedDns } }),
    });
    const data = await response.json();
    if (!data.success) {
      toastManager.add({ type: "error", title: "生成失败", description: data.error });
      return;
    }
    setGeneratedConfig(data.config);
    toastManager.add({ type: "success", title: "YAML 已生成" });
  });

  const saveCloud = (parentId?: number) => startTransition(async () => {
    if (!urls.trim()) {
      toastManager.add({ type: "warning", title: "请先填写订阅来源" });
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
        advancedDns,
        parsedNodes: nodes,
        generatedConfig,
      }),
    });
    const data = await response.json();
    if (!data.success) {
      toastManager.add({ type: "error", title: "保存失败", description: data.error });
      return;
    }
    setCurrentConfigId(Number(data.configId));
    setCloudUrl(window.location.origin + data.subUrl);
    toastManager.add({ type: "success", title: parentId ? "分支已创建" : "配置已托管" });
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
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <Badge variant="info" className="w-fit">Next.js + Coss UI + Neon</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">订阅配置工作台</h1>
            <p className="text-muted-foreground">导入订阅、整理代理组与规则，并发布 Vercel 云端订阅链接。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} loading={isPending}>
              <PlayIcon aria-hidden="true" />
              生成 YAML
            </Button>
            <Button variant="outline" onClick={downloadYaml} disabled={!generatedConfig}>
              <DownloadIcon aria-hidden="true" />
              下载
            </Button>
            <Button variant="secondary" onClick={() => saveCloud()} loading={isPending}>
              <SaveIcon aria-hidden="true" />
              {currentConfigId ? "更新托管" : "保存托管"}
            </Button>
            <Button variant="outline" onClick={() => currentConfigId && saveCloud(currentConfigId)} disabled={!currentConfigId}>
              <GitForkIcon aria-hidden="true" />
              创建分支
            </Button>
          </div>
        </section>

        <div className="grid items-stretch gap-6 xl:grid-cols-[1.05fr_1fr]">
          <Card className="h-[32rem] min-h-0">
            <CardHeader>
              <CardTitle>订阅来源</CardTitle>
              <CardDescription>支持订阅链接、Base64、YAML 或节点 URI。云部署默认仅允许 HTTPS 订阅。</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                配置名称
                <Input nativeInput value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                订阅来源输入
                <Textarea value={urls} onChange={(event) => setUrls(event.target.value)} placeholder="每行一个订阅链接，或粘贴 YAML / 节点 URI" className="min-h-40" />
              </label>
              <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">高级防泄漏 DNS</span>
                  <span className="text-muted-foreground text-sm">生成配置时启用更稳妥的 DNS fallback。</span>
                </div>
                <Switch checked={advancedDns} onCheckedChange={setAdvancedDns} />
              </div>
              <Button variant="outline" onClick={parseNodes} loading={isPending}>
                <RefreshCwIcon aria-hidden="true" />
                解析节点
              </Button>
            </CardContent>
          </Card>

          <div className="min-h-0">
            <Card className="h-[32rem] min-h-0">
              <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-1">
                  <CardTitle>YAML 预览</CardTitle>
                  <CardDescription>生成后可下载或保存为云端托管配置。</CardDescription>
                </div>
                <div className="flex max-w-xl flex-wrap justify-start gap-1.5 md:justify-end">
                  <Badge variant="info">节点 {nodes.length}</Badge>
                  <Badge variant="success">代理组 {groups.length}</Badge>
                  <Badge variant="warning">规则 {rules.length}</Badge>
                  {nodes.slice(0, 3).map((node, index) => (
                    <Badge key={`${String(node.name)}-${index}`} variant="outline">
                      {String(node.name || "Unnamed")}
                    </Badge>
                  ))}
                  {nodes.length > 3 && <Badge variant="outline">+{nodes.length - 3}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 flex flex-col gap-3 overflow-hidden">
                {cloudUrl && (
                  <div className="flex shrink-0 gap-2 rounded-xl border bg-background p-2">
                    <Input nativeInput readOnly value={cloudUrl} />
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(cloudUrl);
                      toastManager.add({ type: "success", title: "已复制" });
                    }}>
                      <CopyIcon aria-hidden="true" />
                    </Button>
                  </div>
                )}
                <pre className="min-h-0 flex-1 overflow-auto rounded-xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
                  {generatedConfig || "尚未生成配置。"}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>

        <ProxyGroupManager groups={groups} onGroupsChange={setGroups} />

        <div className="grid gap-6">
          <Card className="h-[30rem] min-h-0">
            <CardHeader>
              <CardTitle>自定义规则</CardTitle>
              <CardDescription>添加优先级高于兜底规则的手动分流项。</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto flex flex-col gap-3">
              {rules.map((rule, index) => (
                <div key={rule.id} className="grid gap-2 rounded-xl border p-3 lg:grid-cols-[1fr_1.4fr_1.4fr_auto]">
                  <StringSelect items={ruleTypes.map((type) => ({ label: type, value: type }))} value={rule.type} onChange={(value) => {
                    const next = [...rules];
                    next[index] = { ...rule, type: value };
                    setRules(next);
                  }} />
                  <Input nativeInput value={rule.value} disabled={rule.type === "MATCH"} onChange={(event) => {
                    const next = [...rules];
                    next[index] = { ...rule, value: event.target.value };
                    setRules(next);
                  }} placeholder="example.com" />
                  <StringSelect items={policies.map((policy) => ({ label: policy, value: policy }))} value={rule.policy} onChange={(value) => {
                    const next = [...rules];
                    next[index] = { ...rule, policy: value };
                    setRules(next);
                  }} />
                  <Button variant="ghost" onClick={() => setRules(rules.filter((_, itemIndex) => itemIndex !== index))}>删除</Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => setRules([...rules, { id: crypto.randomUUID(), type: "DOMAIN-SUFFIX", value: "", policy: policies[0] || "DIRECT" }])}>添加规则</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
