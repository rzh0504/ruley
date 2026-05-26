"use client";

import { useState, useTransition } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.error || "登录失败");
        toastManager.add({ type: "error", title: "登录失败", description: data.error || "请检查管理员密码" });
        return;
      }
      toastManager.add({ type: "success", title: "已登录", description: "欢迎回到 Ruley" });
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,--alpha(var(--color-primary)/16%),transparent_32rem),linear-gradient(180deg,var(--background),var(--muted))] p-6">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader className="gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LockKeyholeIcon aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>登录 Ruley</CardTitle>
            <CardDescription>输入管理员密码以管理订阅配置和云端链接</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              管理员密码
              <Input
                autoFocus
                nativeInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入 ADMIN_PASSWORD"
                aria-invalid={!!error}
              />
            </label>
            {error && <p className="text-destructive-foreground text-sm">{error}</p>}
            <Button loading={isPending} type="submit" size="lg">
              进入控制台
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
