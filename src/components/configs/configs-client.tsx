"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudIcon, ExternalLinkIcon, GitBranchIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";

type ConfigRecord = {
  id: number;
  name: string;
  urls: string;
  nodeCount: number;
  cloudToken: string | null;
  cloudUrl: string | null;
  parentId: number | null;
  updatedAt: string;
};

export function ConfigsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["configs"],
    queryFn: async () => {
      const response = await fetch("/api/configs");
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "配置加载失败");
      return payload.configs as ConfigRecord[];
    },
  });

  const deleteConfig = async (id: number) => {
    if (!confirm("确定删除这个配置吗？")) return;
    const response = await fetch(`/api/configs/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!payload.success) {
      toastManager.add({ type: "error", title: "删除失败", description: payload.error });
      return;
    }
    toastManager.add({ type: "success", title: "配置已删除" });
    queryClient.invalidateQueries({ queryKey: ["configs"] });
  };

  const generateCloud = async (config: ConfigRecord) => {
    const response = await fetch(`/api/configs/${config.id}/cloud`, { method: "POST" });
    const payload = await response.json();
    if (!payload.success) {
      toastManager.add({ type: "error", title: "生成失败", description: payload.error });
      return;
    }
    await navigator.clipboard.writeText(payload.cloudUrl);
    toastManager.add({ type: "success", title: "云端链接已复制" });
    queryClient.invalidateQueries({ queryKey: ["configs"] });
  };

  const configs = data || [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <Badge variant="info" className="w-fit">Neon Postgres</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">配置管理</h1>
            <p className="text-muted-foreground">查看、加载、删除和生成云端订阅链接</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCwIcon aria-hidden="true" />
            刷新
          </Button>
        </section>

        {isLoading ? (
          <Card><CardContent className="p-8 text-muted-foreground">加载中...</CardContent></Card>
        ) : configs.length === 0 ? (
          <Card><CardContent className="p-8 text-muted-foreground">暂无配置，请先在工作台保存托管</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id} className={config.parentId ? "ml-6 border-l-4" : undefined}>
                <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{config.name}</CardTitle>
                      {config.parentId && <Badge variant="info"><GitBranchIcon aria-hidden="true" />分支</Badge>}
                      {config.cloudToken && <Badge variant="success"><CloudIcon aria-hidden="true" />已托管</Badge>}
                    </div>
                    <CardDescription>{config.nodeCount || 0} 个节点，更新于 {new Date(config.updatedAt).toLocaleString("zh-CN")}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button render={<Link href={`/dashboard?configId=${config.id}`} />} variant="secondary" size="sm">
                      <ExternalLinkIcon aria-hidden="true" />
                      加载
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => generateCloud(config)}>
                      <CloudIcon aria-hidden="true" />
                      链接
                    </Button>
                    <Button variant="destructive-outline" size="sm" onClick={() => deleteConfig(config.id)}>
                      <Trash2Icon aria-hidden="true" />
                      删除
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
