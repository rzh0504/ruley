"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { LaptopIcon, MoonIcon, PanelsTopLeftIcon, ServerCogIcon, SettingsIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  getStoredThemeMode,
  setStoredThemeMode,
  themeLabels,
  themeStorageKey,
  type ThemeMode,
} from "@/lib/preferences";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: PanelsTopLeftIcon },
  { href: "/configs", label: "配置管理", icon: ServerCogIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  useEffect(() => {
    const initial = getStoredThemeMode();
    setThemeMode(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if ((localStorage.getItem(themeStorageKey) || "system") === "system") applyTheme("system");
    };
    const handlePreferencesChange = () => setThemeMode(getStoredThemeMode());
    media.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("ruley-preferences-change", handlePreferencesChange);
    return () => {
      media.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("ruley-preferences-change", handlePreferencesChange);
    };
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setStoredThemeMode(mode);
    setThemeMenuOpen(false);
  };

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,var(--background),var(--muted))] dark:bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">R</div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold">Ruley</span>
              <span className="text-muted-foreground text-xs">Mihomo config workspace</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Button key={item.href} render={<Link href={item.href} />} variant={active ? "secondary" : "ghost"} size="sm">
                  <Icon aria-hidden="true" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Menu modal={false} open={themeMenuOpen} onOpenChange={setThemeMenuOpen}>
              <MenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`当前主题：${themeLabels[themeMode]}`} title={`当前主题：${themeLabels[themeMode]}`} />}>
                {themeMode === "system" ? <LaptopIcon aria-hidden="true" /> : themeMode === "dark" ? <MoonIcon aria-hidden="true" /> : <SunIcon aria-hidden="true" />}
              </MenuTrigger>
              <MenuPopup align="end" className="min-w-36">
                <MenuRadioGroup value={themeMode} onValueChange={(value) => setTheme(value as ThemeMode)}>
                  <MenuRadioItem value="system" className="whitespace-nowrap"><LaptopIcon aria-hidden="true" />跟随设备</MenuRadioItem>
                  <MenuRadioItem value="light" className="whitespace-nowrap"><SunIcon aria-hidden="true" />浅色</MenuRadioItem>
                  <MenuRadioItem value="dark" className="whitespace-nowrap"><MoonIcon aria-hidden="true" />深色</MenuRadioItem>
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
            <Button render={<Link href="/settings" />} variant={pathname === "/settings" ? "secondary" : "outline"} size="sm">
              <SettingsIcon aria-hidden="true" />
              设置
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 px-4 pb-3 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm", pathname === item.href ? "bg-secondary" : "text-muted-foreground")}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</main>
    </div>
  );
}
