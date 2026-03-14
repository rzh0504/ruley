import React, { useState } from 'react';
import { toast } from '../Toast';

export default function SubscriptionCard({ 
  subscriptionName,
  onSubscriptionNameChange,
  urls, 
  onUrlsChange, 
  onNodesParsed 
}: { 
  subscriptionName: string;
  onSubscriptionNameChange: (name: string) => void;
  urls: string;
  onUrlsChange: (urls: string) => void;
  onNodesParsed?: (nodes: any[]) => void 
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [enableRename, setEnableRename] = useState(false);
  const resolvedSubscriptionName = subscriptionName.trim() || 'ruley';
  const subscriptionCount = urls.split('\n').map(line => line.trim()).filter(Boolean).length;

  const cleanNodeName = (name: string) => {
    if (!name) return name;
    return name
      // Remove common airport prefixes/tags like [VIP1], x2.0, 倍率, 不限速, emoji, | etc
      .replace(/(?:\b(x[0-9.]+|[0-9.]+x|倍率)|不限速|\[V[A-Z0-9]+\]|vip\d*|v\d+)/gi, '') 
      .replace(/[\|\|丨|\[\]【】()（）-]/g, ' ')
      .replace(/<[^>]+>/g, '') // some names have weird html
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleValidate = async () => {
    if (!urls.trim()) return;
    setIsValidating(true);
    
    try {
      const token = localStorage.getItem('ruley_token');
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ urls })
      });
      const data = await res.json();
      
      if (data.success) {
        let finalProxies = data.proxies;
        if (enableRename && finalProxies && Array.isArray(finalProxies)) {
           finalProxies = finalProxies.map((p: any) => ({
              ...p,
              name: p.name ? cleanNodeName(p.name) : (p.name || `Unnamed Node`)
           }));
        }

        let errorText = '';
        if (data.errors && data.errors.length > 0) {
          errorText = `\n\n[报错提示]:\n- ${data.errors.map((e: any) => e.error).join('\n- ')}`;
        }
        toast('success', `成功解析！共提取到 ${data.nodesCount} 个节点。${errorText}`);
        console.log("解析到的节点集:", finalProxies);
        if (onNodesParsed) onNodesParsed(finalProxies);
      } else {
        toast('error', `解析失败: ${data.error}`);
      }
    } catch (err: any) {
      toast('error', `无法连接到本地解析服务: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };
  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-3 lg:col-span-4 xl:col-span-5 row-span-2 flex h-[480px] flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">link</span>
            订阅来源输入
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">填写订阅名称与订阅链接，解析后直接生成配置或托管云端。</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined text-[14px]">sell</span>
          {resolvedSubscriptionName}
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px] gap-3 mb-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">订阅名称</label>
            <input
              className="w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-shadow"
              placeholder="ruley"
              type="text"
              value={subscriptionName}
              onChange={(e) => onSubscriptionNameChange(e.target.value)}
            />
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">链接数</div>
            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{subscriptionCount}</div>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            订阅链接
          </div>
          <label className="sr-only">订阅链接</label>
          <textarea
            className="h-full w-full bg-transparent p-3 text-sm font-mono text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none focus:outline-none"
            placeholder={`https://example.com/sub/123\nhttps://another-sub.net/rss/feed`}
            value={urls}
            onChange={(e) => onUrlsChange(e.target.value)}
          ></textarea>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">自动解析已激活</span>
            </div>
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 cursor-pointer group/toggle">
              <input
                type="checkbox"
                checked={enableRename}
                onChange={(e) => setEnableRename(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)] dark:bg-slate-800"
              />
              <span className="text-xs font-bold text-slate-500 group-hover/toggle:text-slate-700 dark:text-slate-400 dark:group-hover/toggle:text-slate-300 transition-colors">节点精简重命名</span>
            </label>
          </div>
          <div className="flex items-center gap-2 justify-end">
            {urls.trim() && (
              <button 
                onClick={() => onUrlsChange('')}
                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer px-2 py-1"
              >
                清空
              </button>
            )}
            <button 
              onClick={handleValidate}
              disabled={isValidating || !urls.trim()}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
            >
              {isValidating ? (
                <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> 验证中...</>
              ) : '验证链接'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
