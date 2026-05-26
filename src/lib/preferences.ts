export type ThemeMode = "system" | "light" | "dark";

export type AdvancedSettings = {
  port: number;
  socksPort: number;
  allowLan: boolean;
  mode: string;
  logLevel: string;
  externalController: string;
  secret: string;
  advancedDns: boolean;
  testUrl: string;
  testInterval: number;
};

export type DuplicateNameStrategy = "append" | "keep" | "skip";
export type DefaultProxyGroupType = "select" | "url-test" | "fallback";

export type ParserPreferences = {
  skipDuplicateNodes: boolean;
  duplicateNameStrategy: DuplicateNameStrategy;
  continueOnParseError: boolean;
};

export type ProxyGroupPreferences = {
  defaultEnabledGroupIds: string[];
  defaultTestUrl: string;
  defaultTestInterval: number;
  defaultProxyGroupType: DefaultProxyGroupType;
};

export type AppearancePreferences = {
  defaultCollapsedYamlSections: string[];
  defaultConfigNamePrefix: string;
};

export const themeStorageKey = "ruley-theme";
export const defaultAdvancedSettingsStorageKey = "ruley-default-advanced-settings";
export const parserPreferencesStorageKey = "ruley-parser-preferences";
export const proxyGroupPreferencesStorageKey = "ruley-proxy-group-preferences";
export const appearancePreferencesStorageKey = "ruley-appearance-preferences";
export const lastDashboardHrefStorageKey = "ruley-last-dashboard-href";

export const defaultEnabledGroupIds = ["1", "2", "3", "6", "25", "23"];
export const defaultTestUrl = "https://www.gstatic.com/generate_204";
export const defaultTestInterval = 300;

export const defaultAdvancedSettings: AdvancedSettings = {
  port: 7897,
  socksPort: 0,
  allowLan: true,
  mode: "rule",
  logLevel: "info",
  externalController: "",
  secret: "set-your-secret",
  advancedDns: true,
  testUrl: defaultTestUrl,
  testInterval: defaultTestInterval,
};

export const defaultParserPreferences: ParserPreferences = {
  skipDuplicateNodes: true,
  duplicateNameStrategy: "append",
  continueOnParseError: true,
};

export const defaultProxyGroupPreferences: ProxyGroupPreferences = {
  defaultEnabledGroupIds,
  defaultTestUrl,
  defaultTestInterval,
  defaultProxyGroupType: "select",
};

export const defaultAppearancePreferences: AppearancePreferences = {
  defaultCollapsedYamlSections: [],
  defaultConfigNamePrefix: "config",
};

export const themeLabels: Record<ThemeMode, string> = {
  system: "跟随设备",
  light: "浅色",
  dark: "深色",
};

export const normalizeAdvancedSettings = (
  settings?: Partial<AdvancedSettings> | null,
): AdvancedSettings => ({
  ...defaultAdvancedSettings,
  ...settings,
  advancedDns:
    typeof settings?.advancedDns === "boolean"
      ? settings.advancedDns
      : defaultAdvancedSettings.advancedDns,
  allowLan:
    typeof settings?.allowLan === "boolean"
      ? settings.allowLan
      : defaultAdvancedSettings.allowLan,
  port: Number(settings?.port || defaultAdvancedSettings.port),
  socksPort: Number(settings?.socksPort || defaultAdvancedSettings.socksPort),
  testUrl: String(settings?.testUrl || defaultAdvancedSettings.testUrl),
  testInterval: Number(settings?.testInterval || defaultAdvancedSettings.testInterval),
});

export const serializeAdvancedSettings = (settings: AdvancedSettings) => ({
  ...settings,
  socksPort: settings.socksPort > 0 ? settings.socksPort : undefined,
});

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle(
    "dark",
    mode === "dark" || (mode === "system" && prefersDark),
  );
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(themeStorageKey);
  return isThemeMode(stored) ? stored : "system";
}

export function setStoredThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(themeStorageKey, mode);
  applyTheme(mode);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function getStoredDefaultAdvancedSettings(): AdvancedSettings {
  if (typeof window === "undefined") return defaultAdvancedSettings;
  const stored = localStorage.getItem(defaultAdvancedSettingsStorageKey);
  if (!stored) return defaultAdvancedSettings;
  try {
    return normalizeAdvancedSettings(JSON.parse(stored));
  } catch {
    return defaultAdvancedSettings;
  }
}

export function setStoredDefaultAdvancedSettings(settings: AdvancedSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    defaultAdvancedSettingsStorageKey,
    JSON.stringify(serializeAdvancedSettings(settings)),
  );
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function resetStoredDefaultAdvancedSettings() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(defaultAdvancedSettingsStorageKey);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function normalizeParserPreferences(
  preferences?: Partial<ParserPreferences> | null,
): ParserPreferences {
  const duplicateNameStrategy = preferences?.duplicateNameStrategy;
  return {
    ...defaultParserPreferences,
    ...preferences,
    skipDuplicateNodes:
      typeof preferences?.skipDuplicateNodes === "boolean"
        ? preferences.skipDuplicateNodes
        : defaultParserPreferences.skipDuplicateNodes,
    continueOnParseError:
      typeof preferences?.continueOnParseError === "boolean"
        ? preferences.continueOnParseError
        : defaultParserPreferences.continueOnParseError,
    duplicateNameStrategy:
      duplicateNameStrategy === "append" || duplicateNameStrategy === "keep" || duplicateNameStrategy === "skip"
        ? duplicateNameStrategy
        : defaultParserPreferences.duplicateNameStrategy,
  };
}

export function normalizeProxyGroupPreferences(
  preferences?: Partial<ProxyGroupPreferences> | null,
): ProxyGroupPreferences {
  const defaultProxyGroupType = preferences?.defaultProxyGroupType;
  return {
    ...defaultProxyGroupPreferences,
    ...preferences,
    defaultEnabledGroupIds: Array.isArray(preferences?.defaultEnabledGroupIds)
      ? preferences.defaultEnabledGroupIds.map(String)
      : defaultProxyGroupPreferences.defaultEnabledGroupIds,
    defaultTestUrl: String(preferences?.defaultTestUrl || defaultProxyGroupPreferences.defaultTestUrl),
    defaultTestInterval: Number(preferences?.defaultTestInterval || defaultProxyGroupPreferences.defaultTestInterval),
    defaultProxyGroupType:
      defaultProxyGroupType === "select" || defaultProxyGroupType === "url-test" || defaultProxyGroupType === "fallback"
        ? defaultProxyGroupType
        : defaultProxyGroupPreferences.defaultProxyGroupType,
  };
}

export function normalizeAppearancePreferences(
  preferences?: Partial<AppearancePreferences> | null,
): AppearancePreferences {
  return {
    ...defaultAppearancePreferences,
    ...preferences,
    defaultCollapsedYamlSections: Array.isArray(preferences?.defaultCollapsedYamlSections)
      ? preferences.defaultCollapsedYamlSections.map(String)
      : defaultAppearancePreferences.defaultCollapsedYamlSections,
    defaultConfigNamePrefix: String(
      preferences?.defaultConfigNamePrefix || defaultAppearancePreferences.defaultConfigNamePrefix,
    ).trim() || defaultAppearancePreferences.defaultConfigNamePrefix,
  };
}

export function getStoredParserPreferences(): ParserPreferences {
  if (typeof window === "undefined") return defaultParserPreferences;
  const stored = localStorage.getItem(parserPreferencesStorageKey);
  if (!stored) return defaultParserPreferences;
  try {
    return normalizeParserPreferences(JSON.parse(stored));
  } catch {
    return defaultParserPreferences;
  }
}

export function setStoredParserPreferences(preferences: ParserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(parserPreferencesStorageKey, JSON.stringify(normalizeParserPreferences(preferences)));
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function getStoredProxyGroupPreferences(): ProxyGroupPreferences {
  if (typeof window === "undefined") return defaultProxyGroupPreferences;
  const stored = localStorage.getItem(proxyGroupPreferencesStorageKey);
  if (!stored) return defaultProxyGroupPreferences;
  try {
    return normalizeProxyGroupPreferences(JSON.parse(stored));
  } catch {
    return defaultProxyGroupPreferences;
  }
}

export function setStoredProxyGroupPreferences(preferences: ProxyGroupPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(proxyGroupPreferencesStorageKey, JSON.stringify(normalizeProxyGroupPreferences(preferences)));
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function getStoredAppearancePreferences(): AppearancePreferences {
  if (typeof window === "undefined") return defaultAppearancePreferences;
  const stored = localStorage.getItem(appearancePreferencesStorageKey);
  if (!stored) return defaultAppearancePreferences;
  try {
    return normalizeAppearancePreferences(JSON.parse(stored));
  } catch {
    return defaultAppearancePreferences;
  }
}

export function setStoredAppearancePreferences(preferences: AppearancePreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(appearancePreferencesStorageKey, JSON.stringify(normalizeAppearancePreferences(preferences)));
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function resetStoredParserPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(parserPreferencesStorageKey);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function resetStoredProxyGroupPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(proxyGroupPreferencesStorageKey);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function resetStoredAppearancePreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(appearancePreferencesStorageKey);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function createNextConfigName(prefix: string, existingNames: string[]): string {
  const normalizedPrefix = prefix.trim() || defaultAppearancePreferences.defaultConfigNamePrefix;
  const escapedPrefix = normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}(?:_(\\d+))?$`);
  const usedNumbers = existingNames.reduce((numbers, name) => {
    const match = name.match(pattern);
    if (!match) return numbers;
    numbers.add(match[1] ? Number(match[1]) : 1);
    return numbers;
  }, new Set<number>());

  let next = 1;
  while (usedNumbers.has(next)) next += 1;
  return `${normalizedPrefix}_${next}`;
}

export function getStoredDashboardHref(): string {
  if (typeof window === "undefined") return "/dashboard";
  const stored = localStorage.getItem(lastDashboardHrefStorageKey);
  return stored?.startsWith("/dashboard") ? stored : "/dashboard";
}

export function setStoredDashboardHref(href: string) {
  if (typeof window === "undefined") return;
  if (!href.startsWith("/dashboard")) return;
  localStorage.setItem(lastDashboardHrefStorageKey, href);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}

export function clearStoredDashboardHref() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(lastDashboardHrefStorageKey);
  window.dispatchEvent(new Event("ruley-preferences-change"));
}
