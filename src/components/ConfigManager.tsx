import React, { useState, useEffect, useCallback } from 'react';
import { toast } from './Toast';

interface ConfigRecord {
  id: number;
  name: string;
  urls: string;
  platform: string;
  advanced_dns: number;
  node_count: number;
  cloud_token: string | null;
  cloud_url: string | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('ruley_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

function buildCloudSubUrl(token: string, name?: string): string {
  return `${window.location.origin}/api/sub/${token}/${encodeURIComponent(name?.trim() || 'ruley')}`;
}

interface ConfigManagerProps {
  onLoadConfig?: (config: any) => void;
}

export default function ConfigManager({ onLoadConfig }: ConfigManagerProps) {
  const [configs, setConfigs] = useState<ConfigRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/configs', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        // Sort: roots by updated_at desc, then interleave branches under their parent
        const roots = (data.configs as ConfigRecord[]).filter(c => !c.parent_id)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const branches = (data.configs as ConfigRecord[]).filter(c => c.parent_id);
        const sorted: ConfigRecord[] = [];
        for (const root of roots) {
          sorted.push(root);
          sorted.push(...branches.filter(b => b.parent_id === root.id));
        }
        // orphan branches (parent deleted)
        sorted.push(...branches.filter(b => !roots.some(r => r.id === b.parent_id)));
        setConfigs(sorted);
      }
    } catch {
      toast('error', '无法加载配置列表');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/configs/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast('success', '备注已更新');
        setEditingId(null);
        fetchConfigs();
      }
    } catch {
      toast('error', '更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/configs/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast('success', '配置已删除');
        setShowDeleteConfirm(null);
        fetchConfigs();
      }
    } catch {
      toast('error', '删除失败');
    }
  };

  const handleGenerateCloud = async (id: number) => {
    try {
      const res = await fetch(`/api/configs/${id}/cloud`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const fullUrl = window.location.origin + data.subUrl;
        await navigator.clipboard.writeText(fullUrl);
        toast('success', '云端链接已生成并复制到剪贴板');
        fetchConfigs();
      }
    } catch {
      toast('error', '生成云端链接失败');
    }
  };

  const handleLoadConfig = async (id: number) => {
    try {
      const res = await fetch(`/api/configs/${id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success && onLoadConfig) {
        onLoadConfig(data.config);
        toast('success', '配置已加载到仪表盘');
      }
    } catch {
      toast('error', '加载失败');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px]">folder_managed</span>
            配置管理
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            查看、管理和复用您保存的所有订阅配置。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            共 {configs.length} 条记录
          </span>
          <button
            onClick={fetchConfigs}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            刷新
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">progress_activity</span>
          加载中...
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] border border-slate-200 dark:border-slate-700 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">inbox</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">暂无保存的配置</p>
          <p className="text-xs text-slate-400 mt-1">在仪表盘中使用「托管云端」功能后，配置将自动保存到此处</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs
            .filter(config => {
              // Hide branches unless their parent is expanded
              if (config.parent_id && !expandedParents.has(config.parent_id)) return false;
              return true;
            })
            .map((config) => {
            const branchCount = configs.filter(c => c.parent_id === config.id).length;
            const isExpanded = expandedParents.has(config.id);
            const toggleExpand = () => {
              setExpandedParents(prev => {
                const next = new Set(prev);
                if (next.has(config.id)) next.delete(config.id);
                else next.add(config.id);
                return next;
              });
            };
            return (
            <div
              key={config.id}
              className={`group rounded-xl bg-white dark:bg-[var(--color-card-dark)] border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm ${config.parent_id ? 'ml-6 border-l-2 border-l-[var(--color-primary)]/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {editingId === config.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(config.id)}
                          autoFocus
                          className="flex-1 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                        <button
                          onClick={() => handleRename(config.id)}
                          className="text-xs text-[var(--color-primary)] font-bold cursor-pointer hover:underline"
                        >保存</button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400 font-bold cursor-pointer hover:underline"
                        >取消</button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {config.name}
                        </h3>
                        {config.parent_id ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                            <span className="material-symbols-outlined text-[10px]">fork_right</span>分支
                          </span>
                        ) : (
                          branchCount > 0 && (
                            <button
                              onClick={toggleExpand}
                              className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <span className={`material-symbols-outlined text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
                              {branchCount} 个分支
                            </button>
                          )
                        )}
                        <button
                          onClick={() => { setEditingId(config.id); setEditName(config.name); }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">dns</span>
                      {config.node_count} 节点
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">devices</span>
                      {config.platform === 'mihomo' ? 'Mihomo' : 'Clash'}
                    </span>
                    {config.cloud_token && (
                      <span className="flex items-center gap-1 text-[var(--color-primary)]">
                        <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                        已托管
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {timeAgo(config.updated_at)}
                    </span>
                  </div>
                  {config.cloud_token && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[400px]">
                        {buildCloudSubUrl(config.cloud_token, config.name)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(buildCloudSubUrl(config.cloud_token, config.name));
                          toast('success', '链接已复制');
                        }}
                        className="text-slate-400 hover:text-[var(--color-primary)] cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleLoadConfig(config.id)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="加载到仪表盘"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    加载
                  </button>
                  <button
                    onClick={() => handleGenerateCloud(config.id)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    title={config.cloud_token ? '复制云端链接' : '生成云端链接'}
                  >
                    <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                    {config.cloud_token ? '云端' : '托管'}
                  </button>

                  {showDeleteConfirm === config.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-200 dark:border-red-800"
                      >确认</button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="text-xs font-bold text-slate-500 px-2 py-1.5 cursor-pointer"
                      >取消</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(config.id)}
                      className="flex items-center justify-center text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="删除"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
