"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudIcon, ExternalLinkIcon, GitBranchIcon, RefreshCwIcon, SearchIcon, Trash2Icon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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

type ConfigFilter = "all" | "branches";
type ConfigSort = "updated" | "name" | "nodes";

const configFilters: { value: ConfigFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "branches", label: "分支" },
];

const configSorts: { value: ConfigSort; label: string }[] = [
  { value: "updated", label: "最近更新" },
  { value: "name", label: "名称" },
  { value: "nodes", label: "节点数" },
];

const selectedToggleClassName = "border-primary/60 bg-primary/12 text-foreground ring-1 ring-primary/24 dark:border-primary/80 dark:bg-primary/18 dark:ring-primary/36";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  }
}

export function ConfigsClient({ initialConfigs }: { initialConfigs: ConfigRecord[] }) {
  const queryClient = useQueryClient();
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConfigFilter>("all");
  const [sort, setSort] = useState<ConfigSort>("updated");
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
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
    const copied = await copyText(payload.cloudUrl);
    toastManager.add({
      type: copied ? "success" : "warning",
      title: copied ? "云端链接已复制" : "复制失败，请手动复制链接",
      description: copied ? undefined : payload.cloudUrl,
    });
    queryClient.invalidateQueries({ queryKey: ["configs"] });
  };

  const submitSearch = () => setQuery(queryInput.trim());
  const toggleParentBranches = (id: number) => {
    setExpandedParents((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const configs = data || [];
  const hostedConfigs = useMemo(
    () => configs.filter((config) => Boolean(config.cloudToken)),
    [configs],
  );
  const compareConfigs = (a: ConfigRecord, b: ConfigRecord) => {
    if (sort === "name") return a.name.localeCompare(b.name, "zh-CN");
    if (sort === "nodes") return (b.nodeCount || 0) - (a.nodeCount || 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  };
  const filteredConfigs = useMemo(
    () => {
      const matched = hostedConfigs.filter((config) => {
        const matchesQuery = !deferredQuery || config.name.toLowerCase().includes(deferredQuery);
        const matchesFilter =
          filter === "all" ||
          (filter === "branches" && Boolean(config.parentId));

        return matchesQuery && matchesFilter;
      });

      if (filter === "branches") return matched.sort(compareConfigs);

      const branchesByParent = new Map<number, ConfigRecord[]>();
      const parents = matched.filter((config) => !config.parentId).sort(compareConfigs);
      const orphans: ConfigRecord[] = [];

      for (const config of matched) {
        if (!config.parentId) continue;
        if (!matched.some((item) => item.id === config.parentId)) {
          orphans.push(config);
          continue;
        }
        const branches = branchesByParent.get(config.parentId) || [];
        branches.push(config);
        branchesByParent.set(config.parentId, branches);
      }

      return [
        ...parents.flatMap((parent) => [
          parent,
          ...(branchesByParent.get(parent.id) || []).sort(compareConfigs),
        ]),
        ...orphans.sort(compareConfigs),
      ];
    },
    [hostedConfigs, deferredQuery, filter, sort],
  );
  const groupedConfigs = useMemo(() => {
    const matched = hostedConfigs.filter((config) => {
      const matchesQuery = !deferredQuery || config.name.toLowerCase().includes(deferredQuery);
      return matchesQuery && filter === "all";
    });
    const branchesByParent = new Map<number, ConfigRecord[]>();
    const parents = matched.filter((config) => !config.parentId).sort(compareConfigs);
    const orphans: ConfigRecord[] = [];

    for (const config of matched) {
      if (!config.parentId) continue;
      if (!matched.some((item) => item.id === config.parentId)) {
        orphans.push(config);
        continue;
      }
      const branches = branchesByParent.get(config.parentId) || [];
      branches.push(config);
      branchesByParent.set(config.parentId, branches);
    }

    for (const [parentId, branches] of branchesByParent) {
      branchesByParent.set(parentId, branches.sort(compareConfigs));
    }

    return { parents, branchesByParent, orphans: orphans.sort(compareConfigs) };
  }, [hostedConfigs, deferredQuery, filter, sort]);

  const renderConfigCard = (config: ConfigRecord, branchCount = 0) => (
    <Card key={config.publicId} className={config.parentId ? "ml-6 border-l-4 bg-muted/30 shadow-none before:hidden" : undefined}>
      <CardHeader className={cn("gap-3 md:grid-cols-[1fr_auto]", config.parentId && "p-4")}>
        <div className="flex flex-col gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle className={config.parentId ? "text-base" : undefined}>{config.name}</CardTitle>
            {branchCount > 0 && !config.parentId && (
              <Badge
                render={<button type="button" onClick={() => toggleParentBranches(config.id)} />}
                variant="warning"
              >
                <GitBranchIcon aria-hidden="true" />
                {branchCount} 个分支
              </Badge>
            )}
            {config.parentId && <Badge variant="warning"><GitBranchIcon aria-hidden="true" />分支</Badge>}
            {config.cloudToken && <Badge variant="success"><CloudIcon aria-hidden="true" />已托管</Badge>}
          </div>
          <CardDescription>{config.nodeCount || 0} 个节点，更新于 {new Date(config.updatedAt).toLocaleString("zh-CN")}</CardDescription>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button render={<Link href={`/dashboard?configId=${config.publicId}`} />} variant="secondary" size={config.parentId ? "xs" : "sm"} className="w-full sm:w-auto">
            <ExternalLinkIcon aria-hidden="true" />
            加载
          </Button>
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Button variant="outline" size={config.parentId ? "xs" : "sm"} onClick={() => generateCloud(config)} className="w-full sm:w-auto">
              <CloudIcon aria-hidden="true" />
              链接
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive-outline" size={config.parentId ? "xs" : "sm"} className="w-full sm:w-auto" />}>
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
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">配置管理</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-64">
              <Input
                nativeInput
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch();
                }}
                placeholder="搜索配置名称"
                className="[&_input]:pr-9"
              />
              <button
                type="button"
                className="absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="搜索"
                title="搜索"
                onClick={submitSearch}
              >
                <SearchIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCwIcon aria-hidden="true" />
              刷新
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border bg-card p-3">
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
        ) : hostedConfigs.length === 0 ? (
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
        ) : filter === "branches" ? (
          <div className="grid gap-4">
            {filteredConfigs.map((config) => renderConfigCard(config))}
          </div>
        ) : (
          <div className="grid gap-4">
            {groupedConfigs.parents.map((parent) => {
              const branches = groupedConfigs.branchesByParent.get(parent.id) || [];
              const expanded = expandedParents.has(parent.id);
              return (
                <div key={parent.publicId} className="grid gap-2">
                  {renderConfigCard(parent, branches.length)}
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                      expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="grid gap-2 pt-1">
                        {branches.map((branch) => renderConfigCard(branch))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {groupedConfigs.orphans.map((config) => renderConfigCard(config))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
