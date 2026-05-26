"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
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
import { Switch } from "@/components/ui/switch";
import { toastManager } from "@/components/ui/toast";
import { PROXY_GROUP_TEMPLATES, type ProxyGroupType } from "@/lib/config/proxy-templates";
import {
  defaultAdvancedSettings,
  defaultParserPreferences,
  defaultProxyGroupPreferences,
  getStoredDefaultAdvancedSettings,
  getStoredParserPreferences,
  getStoredProxyGroupPreferences,
  getStoredThemeMode,
  resetStoredDefaultAdvancedSettings,
  resetStoredParserPreferences,
  resetStoredProxyGroupPreferences,
  setStoredDefaultAdvancedSettings,
  setStoredParserPreferences,
  setStoredProxyGroupPreferences,
  setStoredThemeMode,
  themeLabels,
  type AdvancedSettings,
  type DuplicateNameStrategy,
  type ParserPreferences,
  type ProxyGroupPreferences,
  type ThemeMode,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

const modeOptions = ["rule", "global", "direct"];
const logLevelOptions = ["silent", "error", "warning", "info", "debug"];
const themeOptions: ThemeMode[] = ["system", "light", "dark"];
const duplicateNameOptions: { value: DuplicateNameStrategy; label: string }[] = [
  { value: "append", label: "自动追加序号" },
  { value: "keep", label: "保留原名" },
  { value: "skip", label: "跳过同名节点" },
];
const groupTypeOptions: ProxyGroupType[] = ["select", "url-test", "fallback"];
const settingsSections = [
  { id: "appearance", label: "界面偏好", description: "主题与显示" },
  { id: "parser", label: "解析行为", description: "订阅解析策略" },
  { id: "defaults", label: "新配置默认值", description: "生成参数与代理组" },
  { id: "account", label: "账号", description: "会话操作" },
] as const;

type SettingsSectionId = (typeof settingsSections)[number]["id"];
type SelectOption = { value: string; label: string };

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <span className="min-h-4 text-muted-foreground font-normal text-xs">
        {description || "\u00a0"}
      </span>
      {children}
    </label>
  );
}

function NativeSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { value: string; label: string }[] | string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  const selected = normalizedOptions.find((option) => option.value === value) || null;

  return (
    <Select
      itemToStringValue={(item: SelectOption | null) => item?.value || ""}
      items={normalizedOptions}
      onValueChange={(item: SelectOption | null) => onChange(item?.value || "")}
      value={selected}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="请选择">{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {normalizedOptions.map((option) => (
          <SelectItem key={option.value} value={option}>
            {option.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

function SettingsInput(props: React.ComponentProps<typeof Input>) {
  return <Input nativeInput {...props} />;
}

function SettingsNumberInput(props: Omit<React.ComponentProps<typeof Input>, "type" | "inputMode">) {
  return (
    <Input
      nativeInput
      inputMode="numeric"
      type="text"
      {...props}
    />
  );
}

function PreferenceSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
      <div className="grid gap-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CompactSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-muted-foreground text-xs">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SettingsClient() {
  const router = useRouter();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [settings, setSettings] = useState<AdvancedSettings>(defaultAdvancedSettings);
  const [parserPreferences, setParserPreferences] = useState<ParserPreferences>(defaultParserPreferences);
  const [proxyGroupPreferences, setProxyGroupPreferences] = useState<ProxyGroupPreferences>(defaultProxyGroupPreferences);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("defaults");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setThemeMode(getStoredThemeMode());
    setSettings(getStoredDefaultAdvancedSettings());
    setParserPreferences(getStoredParserPreferences());
    setProxyGroupPreferences(getStoredProxyGroupPreferences());
  }, []);

  const updateSettings = (updates: Partial<AdvancedSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    setStoredDefaultAdvancedSettings(next);
  };

  const updateParserPreferences = (updates: Partial<ParserPreferences>) => {
    const next = { ...parserPreferences, ...updates };
    setParserPreferences(next);
    setStoredParserPreferences(next);
  };

  const updateProxyGroupPreferences = (updates: Partial<ProxyGroupPreferences>) => {
    const next = { ...proxyGroupPreferences, ...updates };
    setProxyGroupPreferences(next);
    setStoredProxyGroupPreferences(next);
    if (updates.defaultTestUrl || updates.defaultTestInterval) {
      const nextSettings = {
        ...settings,
        testUrl: next.defaultTestUrl,
        testInterval: next.defaultTestInterval,
      };
      setSettings(nextSettings);
      setStoredDefaultAdvancedSettings(nextSettings);
    }
  };

  const updateTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setStoredThemeMode(mode);
  };

  const toggleDefaultGroup = (id: string, enabled: boolean) => {
    const ids = enabled
      ? [...proxyGroupPreferences.defaultEnabledGroupIds, id]
      : proxyGroupPreferences.defaultEnabledGroupIds.filter((item) => item !== id);
    updateProxyGroupPreferences({ defaultEnabledGroupIds: [...new Set(ids)] });
  };

  const resetAllDefaults = () => {
    resetStoredDefaultAdvancedSettings();
    resetStoredParserPreferences();
    resetStoredProxyGroupPreferences();
    setSettings(defaultAdvancedSettings);
    setParserPreferences(defaultParserPreferences);
    setProxyGroupPreferences(defaultProxyGroupPreferences);
    toastManager.add({ type: "success", title: "已恢复默认设置" });
  };

  const logout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    toastManager.add({ type: "success", title: "已退出登录" });
    router.replace("/login");
    router.refresh();
  };

  const activeSectionMeta = settingsSections.find((section) => section.id === activeSection) || settingsSections[0];

  return (
    <AppShell>
      <div className="grid gap-5">
        <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border bg-card p-2">
            <nav className="flex gap-2 overflow-x-auto lg:grid lg:overflow-visible">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={cn(
                    "grid min-w-40 gap-0.5 rounded-xl px-3 py-2 text-left transition-colors lg:min-w-0",
                    activeSection === section.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="font-medium text-sm">{section.label}</span>
                  <span className="text-xs opacity-75">{section.description}</span>
                </button>
              ))}
              <button
                type="button"
                className="flex min-w-40 items-center gap-2 rounded-xl px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground lg:min-w-0"
                onClick={resetAllDefaults}
              >
                <RotateCcwIcon aria-hidden="true" className="size-4" />
                <span className="font-medium text-sm">恢复默认</span>
              </button>
            </nav>
          </aside>

          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                {activeSection === "defaults" && <SlidersHorizontalIcon aria-hidden="true" className="size-5" />}
                {activeSectionMeta.label}
              </CardTitle>
              <CardDescription>{activeSectionMeta.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {activeSection === "appearance" && (
                <div className="grid gap-3">
                  <div className="text-sm font-medium">主题模式</div>
                  <div className="flex w-fit rounded-lg border bg-muted/40 p-1">
                    {themeOptions.map((mode) => (
                      <Button key={mode} variant={themeMode === mode ? "secondary" : "ghost"} size="xs" onClick={() => updateTheme(mode)}>
                        {themeLabels[mode]}
                      </Button>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">顶部主题按钮与这里保持同步</p>
                </div>
              )}

              {activeSection === "parser" && (
                <div className="grid gap-1 divide-y">
                  <CompactSwitch title="跳过重复节点" description="按协议、服务器、端口和凭据识别重复节点" checked={parserPreferences.skipDuplicateNodes} onChange={(skipDuplicateNodes) => updateParserPreferences({ skipDuplicateNodes })} />
                  <CompactSwitch title="解析失败继续" description="某个订阅源失败时继续处理其他来源" checked={parserPreferences.continueOnParseError} onChange={(continueOnParseError) => updateParserPreferences({ continueOnParseError })} />
                  <div className="grid gap-2 py-2">
                    <div>
                      <div className="text-sm font-medium">节点重名策略</div>
                      <div className="text-muted-foreground text-xs">处理不同节点但名称相同的情况</div>
                    </div>
                    <NativeSelect value={parserPreferences.duplicateNameStrategy} options={duplicateNameOptions} onChange={(duplicateNameStrategy) => updateParserPreferences({ duplicateNameStrategy: duplicateNameStrategy as DuplicateNameStrategy })} />
                  </div>
                </div>
              )}

              {activeSection === "defaults" && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <PreferenceSwitch title="高级防泄漏 DNS" description="启用更稳妥的 DNS fallback 与过滤配置" checked={settings.advancedDns} onChange={(advancedDns) => updateSettings({ advancedDns })} />
                    <PreferenceSwitch title="Allow LAN" description="允许局域网设备连接本机代理端口" checked={settings.allowLan} onChange={(allowLan) => updateSettings({ allowLan })} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Mixed Port" description="Mihomo HTTP 与 SOCKS 混合代理端口"><SettingsNumberInput value={settings.port} onChange={(event) => updateSettings({ port: Number(event.target.value || defaultAdvancedSettings.port) })} /></Field>
                    <Field label="Socks Port" description="0 表示生成时不写入"><SettingsNumberInput value={settings.socksPort} onChange={(event) => updateSettings({ socksPort: Number(event.target.value || 0) })} /></Field>
                    <Field label="Mode" description="Mihomo 默认代理模式"><NativeSelect value={settings.mode} options={modeOptions} onChange={(mode) => updateSettings({ mode })} /></Field>
                    <Field label="Log Level" description="生成配置中的日志输出级别"><NativeSelect value={settings.logLevel} options={logLevelOptions} onChange={(logLevel) => updateSettings({ logLevel })} /></Field>
                    <Field label="默认策略组模式" description="新建代理组模板时默认使用的组类型"><NativeSelect value={proxyGroupPreferences.defaultProxyGroupType} options={groupTypeOptions} onChange={(defaultProxyGroupType) => updateProxyGroupPreferences({ defaultProxyGroupType: defaultProxyGroupType as ProxyGroupType })} /></Field>
                    <Field label="默认测速间隔" description="用于 url-test/fallback 代理组"><SettingsNumberInput value={proxyGroupPreferences.defaultTestInterval} onChange={(event) => updateProxyGroupPreferences({ defaultTestInterval: Number(event.target.value || defaultProxyGroupPreferences.defaultTestInterval) })} /></Field>
                  </div>

                  <Field label="默认测速 URL" description="用于 url-test/fallback 代理组"><SettingsInput value={proxyGroupPreferences.defaultTestUrl} onChange={(event) => updateProxyGroupPreferences({ defaultTestUrl: event.target.value })} placeholder={defaultProxyGroupPreferences.defaultTestUrl} /></Field>

                  <div className="grid gap-3">
                    <div>
                      <div className="text-sm font-medium">默认启用代理组</div>
                      <div className="text-muted-foreground text-xs">新建空白配置时自动加入这些模板</div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {PROXY_GROUP_TEMPLATES.map((template) => (
                        <label key={template.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                          <span className="truncate">{template.icon} {template.name}</span>
                          <Switch checked={proxyGroupPreferences.defaultEnabledGroupIds.includes(template.id)} onCheckedChange={(checked) => toggleDefaultGroup(template.id, checked)} />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="External Controller" description="例如 127.0.0.1:9090"><SettingsInput value={settings.externalController} onChange={(event) => updateSettings({ externalController: event.target.value })} placeholder="127.0.0.1:9090" /></Field>
                    <Field label="Secret" description="External Controller 访问密钥"><SettingsInput value={settings.secret} onChange={(event) => updateSettings({ secret: event.target.value })} placeholder="set-your-secret" /></Field>
                  </div>
                </>
              )}

              {activeSection === "account" && (
                <div className="grid gap-3">
                  <p className="text-muted-foreground text-sm">结束当前会话后需要重新登录才能访问工作台</p>
                  <Button className="w-fit" variant="outline" onClick={logout} loading={isLoggingOut}>
                    <LogOutIcon aria-hidden="true" />
                    退出登录
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
