"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudIcon, ExternalLinkIcon, GitBranchIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";

type ConfigRecord = {
  id: number;
  publicId: string;
  name: string;
  nodeCount: number;
  cloudToken: string | null;
  cloudUrl: string | null;
  parentId: number | null;
  updatedAt: string;
};

type ConfigFilter = "all" | "hosted" | "branches";
type ConfigSort = "updated" | "name" | "nodes";

const configFilters: { value: ConfigFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "hosted", label: "已托管" },
  { value: "branches", label: "分支" },
];

const configSorts: { value: ConfigSort; label: string }[] = [
  { value: "updated", label: "最近更新" },
  { value: "name", label: "名称" },
  { value: "nodes", label: "节点数" },
];

const selectedToggleClassName = "border-primary/60 bg-primary/12 text-foreground ring-1 ring-primary/24 dark:border-primary/80 dark:bg-primary/18 dark:ring-primary/36";

export function ConfigsClient({ initialConfigs }: { initialConfigs: ConfigRecord[] }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConfigFilter>("all");
  const [sort, setSort] = useState<ConfigSort>("updated");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["configs"],
    initialData: initialConfigs,
    staleTime: 30_000,
    queryFn: async () => {
      const response = await fetch("/api/configs");
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "配置加载失败");
      return payload.configs as ConfigRecord[];
    },
  });

  const deleteConfig = async (publicId: string) => {
    const response = await fetch(`/api/configs/${publicId}`, { method: "DELETE" });
    const payload = await response.json();
    if (!payload.success) {
      toastManager.add({ type: "error", title: "删除失败", description: payload.error });
      return;
    }
    toastManager.add({ type: "success", title: "配置已删除" });
    queryClient.invalidateQueries({ queryKey: ["configs"] });
  };

  const generateCloud = async (config: ConfigRecord) => {
    const response = await fetch(`/api/configs/${config.publicId}/cloud`, { method: "POST" });
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
  const filteredConfigs = useMemo(
    () => configs
      .filter((config) => {
        const matchesQuery = !deferredQuery || config.name.toLowerCase().includes(deferredQuery);
        const matchesFilter =
          filter === "all" ||
          (filter === "hosted" && Boolean(config.cloudToken)) ||
          (filter === "branches" && Boolean(config.parentId));

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "zh-CN");
        if (sort === "nodes") return (b.nodeCount || 0) - (a.nodeCount || 0);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [configs, deferredQuery, filter, sort],
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">配置管理</h1>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCwIcon aria-hidden="true" />
            刷新
          </Button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border bg-card p-3">
          <Input
            nativeInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索配置名称"
            className="md:max-w-sm"
          />
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {configFilters.map((item) => (
                <Button
                  key={item.value}
                  variant={filter === item.value ? "secondary" : "outline"}
                  size="sm"
                  className={filter === item.value ? selectedToggleClassName : undefined}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {configSorts.map((item) => (
                <Button
                  key={item.value}
                  variant={sort === item.value ? "secondary" : "outline"}
                  size="sm"
                  className={sort === item.value ? selectedToggleClassName : undefined}
                  onClick={() => setSort(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {isLoading ? (
          <Card><CardContent className="p-8 text-muted-foreground">加载中...</CardContent></Card>
        ) : configs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-8 text-muted-foreground">
              <span>暂无配置，请先在工作台保存托管</span>
              <Button render={<Link href="/dashboard" />} variant="secondary">
                去工作台创建配置
              </Button>
            </CardContent>
          </Card>
        ) : filteredConfigs.length === 0 ? (
          <Card><CardContent className="p-8 text-muted-foreground">没有匹配的配置</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filteredConfigs.map((config) => (
              <Card key={config.publicId} className={config.parentId ? "ml-6 border-l-4" : undefined}>
                <CardHeader className="gap-3 md:grid-cols-[1fr_auto]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <CardTitle>{config.name}</CardTitle>
                      {config.parentId && <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><GitBranchIcon aria-hidden="true" className="size-3.5" />分支</span>}
                      {config.cloudToken && <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><CloudIcon aria-hidden="true" className="size-3.5" />已托管</span>}
                    </div>
                    <CardDescription>{config.nodeCount || 0} 个节点，更新于 {new Date(config.updatedAt).toLocaleString("zh-CN")}</CardDescription>
                  </div>
                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <Button render={<Link href={`/dashboard?configId=${config.publicId}`} />} variant="secondary" size="sm" className="w-full sm:w-auto">
                      <ExternalLinkIcon aria-hidden="true" />
                      加载
                    </Button>
                    <div className="grid grid-cols-2 gap-2 sm:contents">
                      <Button variant="outline" size="sm" onClick={() => generateCloud(config)} className="w-full sm:w-auto">
                        <CloudIcon aria-hidden="true" />
                        链接
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="destructive-outline" size="sm" className="w-full sm:w-auto" />}>
                          <Trash2Icon aria-hidden="true" />
                          删除
                        </AlertDialogTrigger>
                        <AlertDialogPopup>
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除配置</AlertDialogTitle>
                            <AlertDialogDescription>
                              将删除“{config.name}”。如果它有分支，关联分支也会一起删除。此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogClose render={<Button variant="ghost" />}>取消</AlertDialogClose>
                            <AlertDialogClose render={<Button variant="destructive" onClick={() => deleteConfig(config.publicId)} />}>
                              删除
                            </AlertDialogClose>
                          </AlertDialogFooter>
                        </AlertDialogPopup>
                      </AlertDialog>
                    </div>
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
