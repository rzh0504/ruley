import React, { useState } from 'react';
import { toast } from '../Toast';

export default function SubscriptionCard({ 
  urls, 
  onUrlsChange, 
  onNodesParsed 
}: { 
  urls: string;
  onUrlsChange: (urls: string) => void;
  onNodesParsed?: (nodes: any[]) => void 
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [enableRename, setEnableRename] = useState(false);

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
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-3 lg:col-span-4 xl:col-span-5 row-span-2 flex flex-col max-h-[480px]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">link</span>
          订阅来源输入
        </h3>
        <button className="text-slate-500 hover:text-[var(--color-primary)] text-xs font-bold transition-colors cursor-pointer">
          管理 API 密钥
        </button>
      </div>
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        <label className="sr-only">订阅链接</label>
        <textarea
          className="flex-1 w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent mb-3 transition-shadow"
          placeholder={`https://example.com/sub/123\nhttps://another-sub.net/rss/feed`}
          value={urls}
          onChange={(e) => onUrlsChange(e.target.value)}
        ></textarea>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(204,255,0,0.6)]"></span>
              <span className="text-xs font-medium text-slate-500">自动解析已激活</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer group/toggle">
              <input 
                type="checkbox" 
                checked={enableRename}
                onChange={(e) => setEnableRename(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)] dark:bg-slate-800"
              />
              <span className="text-xs font-bold text-slate-500 group-hover/toggle:text-slate-700 dark:text-slate-400 dark:group-hover/toggle:text-slate-300 transition-colors">开启节点精简重命名</span>
            </label>
          </div>
          <div className="flex gap-2">
            {urls.trim() && (
              <button 
                onClick={() => onUrlsChange('')}
                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer px-2"
              >
                清空
              </button>
            )}
            <button 
              onClick={handleValidate}
              disabled={isValidating || !urls.trim()}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
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
