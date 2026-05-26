"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { LogOutIcon, PanelsTopLeftIcon, ServerCogIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: PanelsTopLeftIcon },
  { href: "/configs", label: "配置管理", icon: ServerCogIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toastManager.add({ type: "success", title: "已退出登录" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--background),var(--muted))]">
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
            <Badge variant="success">Vercel Ready</Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOutIcon aria-hidden="true" />
              退出
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
