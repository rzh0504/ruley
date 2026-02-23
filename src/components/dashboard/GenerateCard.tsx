import React from 'react';

interface GenerateCardProps {
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasConfig: boolean;
  nodesCount: number;
}

export default function GenerateCard({ onGenerate, onDownload, isGenerating, hasConfig, nodesCount }: GenerateCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-1 lg:col-span-2 xl:col-span-3 row-span-2 flex flex-col p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-[var(--color-primary)]">
          <span className="material-symbols-outlined">rocket_launch</span>
        </div>
        <span className="text-xs font-mono text-slate-400">#快捷操作</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">一键生成</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">编译当前配置并推送更新至客户端。</p>
      {nodesCount > 0 && (
        <p className="text-xs text-[var(--color-primary)] font-bold mb-4">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1">check_circle</span>
          已加载 {nodesCount} 个节点
        </p>
      )}
      <div className="space-y-3 mt-auto">
        <button
          onClick={onGenerate}
          disabled={isGenerating || nodesCount === 0}
          className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-slate-900 dark:bg-[var(--color-primary)] hover:bg-slate-800 dark:hover:bg-[var(--color-primary-dark)] text-white dark:text-black text-sm font-bold rounded-lg transition-all shadow-lg shadow-slate-900/10 dark:shadow-[var(--color-primary)]/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              <span>正在编译配置...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>{nodesCount === 0 ? '请先添加节点' : '立即生成配置'}</span>
            </>
          )}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onGenerate}
            disabled={nodesCount === 0}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)] mb-1">
              update
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">更新订阅</span>
          </button>
          <button
            onClick={onDownload}
            disabled={!hasConfig}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)] mb-1">
              download
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">导出 YAML</span>
          </button>
        </div>
      </div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
