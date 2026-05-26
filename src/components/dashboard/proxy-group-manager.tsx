"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GitBranchIcon,
  LibraryIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROXY_GROUP_TEMPLATES,
  getDefaultPolicyOptions,
  getDefaultRuleLinks,
  type ProxyGroupPolicyOption,
  type ProxyGroupType,
  type ProxyGroupTemplate,
} from "@/lib/config/proxy-templates";

type PolicyOption = ProxyGroupPolicyOption;

const commonFilters = [
  { label: "全部", value: "^(.*)$" },
  { label: "香港", value: "(香港|HK|Hong)" },
  { label: "台湾", value: "(台湾|TW|Taiwan|新北)" },
  { label: "新加坡", value: "(新加坡|狮城|SG|Singapore)" },
  { label: "日本", value: "(日本|东京|大阪|JP|Japan)" },
  { label: "美国", value: "(美国|洛杉矶|西雅图|芝加哥|US|United States)" },
  { label: "韩国", value: "(韩国|首尔|KR|Korea)" },
  { label: "家宽", value: "(家电|家宽|ISP|住宅)" },
  { label: "专线", value: "(专线|IPLC|BGP|IEPL|Premium)" },
  { label: "低倍率", value: "(0\\.\\d|\\b1\\.0\\b|低倍)" },
];

const groupModes: {
  value: ProxyGroupType;
  label: string;
  description: string;
}[] = [
  { value: "select", label: "select", description: "手动选择组内策略或节点" },
  { value: "url-test", label: "url-test", description: "在组内自动测速选择" },
  { value: "fallback", label: "fallback", description: "按组内顺序故障转移" },
];

const policyOptionDefinitions: {
  value: PolicyOption;
  label: string;
  description: string;
}[] = [
  {
    value: "main",
    label: "节点选择组",
    description: "加入入口策略组，通常是 🚀 节点选择",
  },
  { value: "auto", label: "自动选择组", description: "加入自动选择代理组" },
  { value: "direct", label: "DIRECT", description: "允许直连" },
  { value: "reject", label: "REJECT", description: "允许拒绝" },
  {
    value: "matched",
    label: "匹配节点",
    description: "加入正则匹配到的真实节点",
  },
];

const colorVariants: Record<
  ProxyGroupTemplate["color"],
  "default" | "info" | "success" | "warning" | "error"
> = {
  blue: "info",
  green: "success",
  purple: "default",
  red: "error",
  yellow: "warning",
};

const createTemplateGroup = (
  template: ProxyGroupTemplate,
): ProxyGroupTemplate => ({
  ...template,
  ruleLinks: getDefaultRuleLinks(template),
});

const isCustomGroup = (group: ProxyGroupTemplate) =>
  group.id.startsWith("custom-");

const getPreset = (group: ProxyGroupTemplate) =>
  PROXY_GROUP_TEMPLATES.find((template) => template.id === group.id);

const normalizeIdPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_\u4e00-\u9fa5]/g, "");

export function ProxyGroupManager({
  groups,
  onGroupsChange,
}: {
  groups: ProxyGroupTemplate[];
  onGroupsChange: (groups: ProxyGroupTemplate[]) => void;
}) {
  const [selectedId, setSelectedId] = useState(groups[0]?.id || "");
  const [mode, setMode] = useState<"edit" | "presets" | "custom">("edit");
  const [customDraft, setCustomDraft] = useState({
    icon: "🌐",
    name: "",
    type: "select" as ProxyGroupType,
    policyOptions: getDefaultPolicyOptions({
      id: "custom-draft",
      type: "select",
    }),
    filter: "^(.*)$",
    ruleLinks: "",
    dialerProxy: "",
  });

  useEffect(() => {
    if (!groups.some((group) => group.id === selectedId)) {
      setSelectedId(groups[0]?.id || "");
    }
  }, [groups, selectedId]);

  const selectedGroup =
    groups.find((group) => group.id === selectedId) || groups[0] || null;
  const activeIds = useMemo(
    () => new Set(groups.map((group) => group.id)),
    [groups],
  );

  const updateGroup = (
    groupId: string,
    updates: Partial<ProxyGroupTemplate>,
  ) => {
    onGroupsChange(
      groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group,
      ),
    );
  };

  const removeGroup = (groupId: string) => {
    if (groups.length <= 1) return;
    onGroupsChange(groups.filter((group) => group.id !== groupId));
  };

  const togglePreset = (template: ProxyGroupTemplate) => {
    if (activeIds.has(template.id)) {
      if (groups.length <= 1) return;
      onGroupsChange(groups.filter((group) => group.id !== template.id));
      return;
    }

    const nextGroups = [...groups, createTemplateGroup(template)].sort(
      (a, b) => {
        const left = Number.parseInt(a.id, 10);
        const right = Number.parseInt(b.id, 10);
        if (Number.isNaN(left) || Number.isNaN(right))
          return a.id.localeCompare(b.id);
        return left - right;
      },
    );
    onGroupsChange(nextGroups);
    setSelectedId(template.id);
  };

  const resetPreset = (group: ProxyGroupTemplate) => {
    const preset = getPreset(group);
    if (!preset) return;
    updateGroup(group.id, createTemplateGroup(preset));
  };

  const createCustomGroup = () => {
    const name = customDraft.name.trim();
    if (!name) return;
    const idBase = normalizeIdPart(name) || crypto.randomUUID();
    let id = `custom-${idBase}`;
    if (activeIds.has(id))
      id = `custom-${idBase}-${crypto.randomUUID().slice(0, 8)}`;
    const customGroup: ProxyGroupTemplate = {
      id,
      icon: customDraft.icon.trim() || "🌐",
      name,
      type: customDraft.type,
      policyOptions: customDraft.policyOptions,
      desc: "用户自定义策略组",
      color: "purple",
      filter: customDraft.filter.trim() || "^(.*)$",
      ruleLinks: customDraft.ruleLinks,
      dialerProxy: customDraft.dialerProxy || undefined,
    };
    onGroupsChange([...groups, customGroup]);
    setSelectedId(customGroup.id);
    setMode("edit");
    setCustomDraft({
      icon: "🌐",
      name: "",
      type: "select",
      policyOptions: getDefaultPolicyOptions({
        id: "custom-draft",
        type: "select",
      }),
      filter: "^(.*)$",
      ruleLinks: "",
      dialerProxy: "",
    });
  };

  return (
    <Card className="h-176 min-h-0">
      <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <CardTitle>代理组管理</CardTitle>
          <CardDescription>
            启用预设策略组，添加自定义分流组，并配置节点匹配、规则链接和链式代理
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "presets" && (
            <Button variant="ghost" onClick={() => setMode("edit")}>
              完成
            </Button>
          )}
          <Button
            variant={mode === "presets" ? "secondary" : "outline"}
            onClick={() => setMode(mode === "presets" ? "edit" : "presets")}
          >
            <LibraryIcon aria-hidden="true" />
            预设
          </Button>
          <Button
            variant={mode === "custom" ? "secondary" : "outline"}
            onClick={() => setMode(mode === "custom" ? "edit" : "custom")}
          >
            <PlusIcon aria-hidden="true" />
            自定义
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 grid gap-4 overflow-hidden lg:grid-cols-[18rem_1fr]">
        <aside className="min-h-0 h-full overflow-auto flex flex-col gap-2 rounded-xl border bg-muted/40 p-2">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => {
                setSelectedId(group.id);
                setMode("edit");
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${selectedGroup?.id === group.id ? "border-primary bg-background" : "border-transparent hover:bg-background/72"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-lg" aria-hidden="true">
                    {group.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {group.name}
                    </div>
                    <div className="truncate text-muted-foreground text-xs">
                      {group.filter || "无节点筛选"}
                    </div>
                  </div>
                </div>
                <Badge variant={colorVariants[group.color]}>
                  {isCustomGroup(group) ? "自定义" : group.type}
                </Badge>
              </div>
            </button>
          ))}
        </aside>

        {mode === "presets" ? (
          <PresetPicker activeIds={activeIds} onToggle={togglePreset} />
        ) : mode === "custom" ? (
          <CustomGroupForm
            draft={customDraft}
            groups={groups}
            onChange={setCustomDraft}
            onCancel={() => setMode("edit")}
            onCreate={createCustomGroup}
          />
        ) : selectedGroup ? (
          <GroupEditor
            group={selectedGroup}
            groups={groups}
            onUpdate={(updates) => updateGroup(selectedGroup.id, updates)}
            onRemove={() => removeGroup(selectedGroup.id)}
            onReset={() => resetPreset(selectedGroup)}
          />
        ) : (
          <div className="flex h-full min-h-0 items-center justify-center rounded-xl border text-muted-foreground">
            请选择或添加代理组
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PresetPicker({
  activeIds,
  onToggle,
}: {
  activeIds: Set<string>;
  onToggle: (template: ProxyGroupTemplate) => void;
}) {
  return (
    <section className="h-full min-h-0 overflow-auto grid content-start gap-3 pr-1 md:grid-cols-2">
      {PROXY_GROUP_TEMPLATES.map((template) => {
        const active = activeIds.has(template.id);
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onToggle(template)}
            className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors ${active ? "border-primary bg-primary/8" : "hover:bg-muted/64"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                <span aria-hidden="true">{template.icon}</span> {template.name}
              </span>
              <Badge variant={active ? "success" : "outline"}>
                {active ? "已启用" : "未启用"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{template.desc}</p>
          </button>
        );
      })}
    </section>
  );
}

function CustomGroupForm({
  draft,
  groups,
  onChange,
  onCancel,
  onCreate,
}: {
  draft: {
    icon: string;
    name: string;
    type: ProxyGroupType;
    policyOptions: PolicyOption[];
    filter: string;
    ruleLinks: string;
    dialerProxy: string;
  };
  groups: ProxyGroupTemplate[];
  onChange: (draft: {
    icon: string;
    name: string;
    type: ProxyGroupType;
    policyOptions: PolicyOption[];
    filter: string;
    ruleLinks: string;
    dialerProxy: string;
  }) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <section className="h-full min-h-0 overflow-auto flex flex-col gap-4 rounded-xl border p-4">
      <div className="grid gap-3 md:grid-cols-[5rem_1fr]">
        <label className="flex flex-col gap-2 text-sm font-medium">
          图标
          <Input
            nativeInput
            value={draft.icon}
            onChange={(event) =>
              onChange({ ...draft, icon: event.target.value })
            }
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          组名称
          <Input
            nativeInput
            value={draft.name}
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
            placeholder="例如 Netflix"
          />
        </label>
      </div>
      <GroupModePicker
        value={draft.type}
        onChange={(type) =>
          onChange({
            ...draft,
            type,
            policyOptions: getDefaultPolicyOptions({
              id: "custom-draft",
              type,
            }),
          })
        }
      />
      <PolicyOptionsPicker
        value={draft.policyOptions}
        groupId="custom-draft"
        groupType={draft.type}
        onChange={(policyOptions) => onChange({ ...draft, policyOptions })}
      />
      <FilterPicker
        value={draft.filter}
        onChange={(filter) => onChange({ ...draft, filter })}
      />
      <label className="flex flex-col gap-2 text-sm font-medium">
        链式代理
        <StringSelect
          items={[
            { label: "不使用链式代理", value: "" },
            ...groups.map((group) => ({
              label: `${group.icon} ${group.name}`,
              value: group.id,
            })),
          ]}
          value={draft.dialerProxy}
          onChange={(value) => onChange({ ...draft, dialerProxy: value })}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        外部规则链接
        <Textarea
          value={draft.ruleLinks}
          onChange={(event) =>
            onChange({ ...draft, ruleLinks: event.target.value })
          }
          placeholder="每行一个 .mrs/.yaml 规则链接，可追加 ,no-resolve"
          className="min-h-28"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={onCreate} disabled={!draft.name.trim()}>
          创建策略组
        </Button>
      </div>
    </section>
  );
}

function GroupEditor({
  group,
  groups,
  onUpdate,
  onRemove,
  onReset,
}: {
  group: ProxyGroupTemplate;
  groups: ProxyGroupTemplate[];
  onUpdate: (updates: Partial<ProxyGroupTemplate>) => void;
  onRemove: () => void;
  onReset: () => void;
}) {
  const preset = getPreset(group);
  const ruleLinks = group.ruleLinks ?? getDefaultRuleLinks(group);
  const lockedType = group.id === "1" || group.id === "2" || group.id === "24";
  const showRuleLinks = !preset || Boolean(preset.ruleSets?.length);

  return (
    <section className="h-full min-h-0 overflow-auto flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant={preset ? "info" : "default"}>
              {preset ? "预设" : "自定义"}
            </Badge>
            {group.dialerProxy && (
              <Badge variant="warning">
                <GitBranchIcon aria-hidden="true" />
                链式代理
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{group.desc}</p>
        </div>
        <div className="flex gap-2">
          {preset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcwIcon aria-hidden="true" />
              重置
            </Button>
          )}
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={onRemove}
            disabled={groups.length <= 1}
          >
            <Trash2Icon aria-hidden="true" />
            移除
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[5rem_1fr]">
        <label className="flex flex-col gap-2 text-sm font-medium">
          图标
          <Input
            nativeInput
            value={group.icon}
            onChange={(event) => onUpdate({ icon: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          组名称
          <Input
            nativeInput
            value={group.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </label>
      </div>

      {lockedType ? (
        <div className="rounded-xl border bg-muted/50 p-3 text-sm text-muted-foreground">
          该基础策略组的代理组模式已锁定为 <strong>{group.type}</strong>
          ，避免生成无效配置
        </div>
      ) : (
        <GroupModePicker
          value={group.type}
          onChange={(type) =>
            onUpdate({
              type,
              policyOptions: getDefaultPolicyOptions({ id: group.id, type }),
            })
          }
        />
      )}

      <PolicyOptionsPicker
        value={group.policyOptions ?? getDefaultPolicyOptions(group)}
        groupId={group.id}
        groupType={group.type}
        onChange={(policyOptions) => onUpdate({ policyOptions })}
      />

      <label className="flex flex-col gap-2 text-sm font-medium">
        链式代理
        <StringSelect
          items={[
            { label: "不使用链式代理", value: "" },
            ...groups
              .filter((item) => item.id !== group.id)
              .map((item) => ({
                label: `${item.icon} ${item.name}`,
                value: item.id,
              })),
          ]}
          value={group.dialerProxy || ""}
          onChange={(value) => onUpdate({ dialerProxy: value || undefined })}
        />
      </label>

      <FilterPicker
        value={group.filter}
        onChange={(filter) => onUpdate({ filter })}
      />

      {showRuleLinks && (
        <label className="flex flex-col gap-2 text-sm font-medium">
          外部规则链接
          <Textarea
            value={ruleLinks}
            onChange={(event) => onUpdate({ ruleLinks: event.target.value })}
            placeholder="每行一个 .mrs/.yaml 规则链接，可追加 ,no-resolve"
            className="min-h-32 font-mono text-xs"
          />
        </label>
      )}
    </section>
  );
}

function GroupModePicker({
  value,
  onChange,
}: {
  value: ProxyGroupType;
  onChange: (value: ProxyGroupType) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">代理组模式</span>
        <span className="text-muted-foreground text-xs">
          对应 Mihomo <code>proxy-groups[].type</code>
          ，每个代理组只能有一种模式
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {groupModes.map((strategy) => (
          <button
            key={strategy.value}
            type="button"
            onClick={() => onChange(strategy.value)}
            className={`rounded-xl border p-3 text-left transition-colors ${value === strategy.value ? "border-primary bg-primary/8" : "hover:bg-muted/64"}`}
          >
            <div className="text-sm font-medium">{strategy.label}</div>
            <div className="text-muted-foreground text-xs">
              {strategy.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PolicyOptionsPicker({
  value,
  groupId,
  groupType,
  onChange,
}: {
  value: PolicyOption[];
  groupId: string;
  groupType: ProxyGroupType;
  onChange: (value: PolicyOption[]) => void;
}) {
  const selected = new Set(
    value.length > 0
      ? value
      : getDefaultPolicyOptions({ id: groupId, type: groupType }),
  );

  const toggle = (option: PolicyOption) => {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    if (next.size === 0) next.add("direct");
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">组内可选策略</span>
        <span className="text-muted-foreground text-xs">
          对应 Mihomo <code>proxy-groups[].proxies</code>
          ，可多选匹配节点会根据下方正则动态加入真实节点
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {policyOptionDefinitions.map((option) => {
          const active = selected.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-success bg-primary/8" : "hover:bg-background/72"}`}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-muted-foreground text-xs">
                {option.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const toggleFilter = (filter: string) => {
    if (filter === "^(.*)$") {
      onChange(filter);
      return;
    }
    if (!value || value === "^(.*)$" || value === "(REJECT|DIRECT)") {
      onChange(filter);
      return;
    }
    const active = new Set(
      commonFilters
        .filter((item) => item.value !== "^(.*)$" && value.includes(item.value))
        .map((item) => item.value),
    );
    if (active.has(filter)) active.delete(filter);
    else active.add(filter);
    onChange(active.size === 0 ? "^(.*)$" : Array.from(active).join("|"));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
      <div className="flex flex-wrap gap-2">
        {commonFilters.map((filter) => {
          const active =
            filter.value === "^(.*)$"
              ? value === "^(.*)$"
              : value.includes(filter.value);
          return (
            <Button
              key={filter.label}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(filter.value)}
            >
              {filter.label}
            </Button>
          );
        })}
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium">
        进阶正则匹配
        <Input
          nativeInput
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono"
        />
      </label>
    </div>
  );
}

export type StringSelectItem = { label: string; value: string };

export function StringSelect({
  items,
  value,
  onChange,
  placeholder = "请选择",
}: {
  items: StringSelectItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = items.find((item) => item.value === value) || null;

  return (
    <Select
      itemToStringValue={(item: StringSelectItem | null) => item?.value || ""}
      items={items}
      onValueChange={(item: StringSelectItem | null) =>
        onChange(item?.value || "")
      }
      value={selected}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value || "__empty"} value={item}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
