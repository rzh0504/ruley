import React, { useState, useCallback } from 'react';

interface ConfigPreviewProps {
  config: string;
}

export default function ConfigPreview({ config }: ConfigPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!config) return;
    navigator.clipboard.writeText(config).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [config]);

  // Simple YAML syntax highlighting
  const highlightYaml = (text: string): React.ReactNode => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      let highlighted: React.ReactNode;

      if (line.trimStart().startsWith('#')) {
        // Comment
        highlighted = <span className="text-slate-400 dark:text-slate-500">{line}</span>;
      } else if (line.includes(':')) {
        const colonIdx = line.indexOf(':');
        const key = line.substring(0, colonIdx);
        const value = line.substring(colonIdx);
        highlighted = (
          <>
            <span className="text-purple-700 dark:text-purple-400">{key}</span>
            <span className="text-slate-700 dark:text-slate-300">{value}</span>
          </>
        );
      } else if (line.trimStart().startsWith('- ')) {
        const indent = line.match(/^(\s*)/)?.[1] || '';
        const rest = line.trimStart().substring(2);
        highlighted = (
          <>
            <span className="text-slate-500">{indent}- </span>
            <span className="text-green-600 dark:text-green-300">{rest}</span>
          </>
        );
      } else {
        highlighted = <span className="text-slate-700 dark:text-slate-300">{line}</span>;
      }

      return (
        <div key={i} className="leading-relaxed">
          {highlighted}
        </div>
      );
    });
  };

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 md:col-span-4 lg:col-span-6 xl:col-span-4 row-span-2 flex flex-col overflow-hidden shadow-sm max-h-[600px]">
      <div className="p-3 flex justify-between items-center bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-green-600 dark:text-green-400">code</span>
          配置预览
          {config && (
            <span className="text-[10px] font-mono text-slate-400 ml-1">
              ({config.split('\n').length} 行)
            </span>
          )}
        </h3>
        <button
          onClick={handleCopy}
          disabled={!config}
          className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto styled-scrollbar bg-white dark:bg-[#0f172a] font-mono text-xs relative">
        {config ? (
          <pre className="text-slate-700 dark:text-slate-300">
            <code className="block">
              {highlightYaml(config)}
            </code>
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <span className="material-symbols-outlined text-3xl opacity-20">code_off</span>
            <p className="text-sm">暂无配置</p>
            <p className="text-[10px] text-center">添加节点并点击"立即生成配置"<br/>即可在此预览完整的 Clash 配置文件</p>
          </div>
        )}
      </div>
    </div>
  );
}
