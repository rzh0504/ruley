import React, { useState } from 'react';

export default function SubscriptionCard({ onNodesParsed }: { onNodesParsed?: (nodes: any[]) => void }) {
  const [urls, setUrls] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    if (!urls.trim()) return;
    setIsValidating(true);
    
    try {
      const res = await fetch('http://127.0.0.1:4000/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`成功解析！共提取到 ${data.nodesCount} 个节点。\n(其中遇到 ${data.errors?.length || 0} 个错误)`);
        console.log("解析到的节点集:", data.proxies);
        if (onNodesParsed) onNodesParsed(data.proxies);
      } else {
        alert(`解析失败: ${data.error}`);
      }
    } catch (err: any) {
      alert(`无法连接到本地解析服务: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };
  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-3 lg:col-span-4 xl:col-span-5 row-span-2 flex flex-col max-h-[420px]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">link</span>
          订阅来源输入
        </h3>
        <button className="text-slate-500 hover:text-[var(--color-primary)] text-xs font-bold transition-colors cursor-pointer">
          管理 API 密钥
        </button>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <label className="sr-only">订阅链接</label>
        <textarea
          className="flex-1 w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent mb-3 transition-shadow"
          placeholder={`https://example.com/sub/123\nhttps://another-sub.net/rss/feed`}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
        ></textarea>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(204,255,0,0.6)]"></span>
            <span className="text-xs font-medium text-slate-500">自动解析已激活</span>
          </div>
          <div className="flex gap-2">
            {urls.trim() && (
              <button 
                onClick={() => setUrls('')}
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
