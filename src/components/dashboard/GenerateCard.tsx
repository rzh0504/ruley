import React from 'react';
import { toast } from '../Toast';

interface GenerateCardProps {
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasConfig: boolean;
  nodesCount: number;
  platform: 'clash' | 'mihomo';
  onPlatformChange: (platform: 'clash' | 'mihomo') => void;
  advancedDns: boolean;
  onAdvancedDnsChange: (enabled: boolean) => void;
  onCloudSave: () => void;
  isSavingCloud: boolean;
  cloudUrl: string;
  onSaveAsBranch?: () => void;
  currentConfigName?: string;
  currentConfigId?: number | null;
}

export default function GenerateCard({
  onGenerate, onDownload, isGenerating, hasConfig, nodesCount, platform, onPlatformChange, advancedDns, onAdvancedDnsChange,
  onCloudSave, isSavingCloud, cloudUrl, onSaveAsBranch, currentConfigName, currentConfigId
}: GenerateCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-1 lg:col-span-2 xl:col-span-3 row-span-2 flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-[var(--color-primary)]">
            <span className="material-symbols-outlined">rocket_launch</span>
          </div>
          {currentConfigId && currentConfigName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 dark:bg-[var(--color-primary)] rounded-lg">
              <span className="material-symbols-outlined text-[13px] text-white dark:text-black">edit_document</span>
              <span className="text-[11px] font-bold text-white dark:text-black truncate max-w-[120px]">{currentConfigName}</span>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">一键生成</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">编译当前配置并推送更新至客户端。</p>

      {nodesCount > 0 && (
        <p className="text-xs text-[var(--color-primary)] font-bold mb-4 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          已加载 {nodesCount} 个节点
        </p>
      )}

      {/* Platform Selector */}
      <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 flex border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => onPlatformChange('clash')}
          className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${
            platform === 'clash'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          Clash Premium
        </button>
        <button
          onClick={() => onPlatformChange('mihomo')}
          className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${
            platform === 'mihomo'
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          Mihomo (Meta)
        </button>
      </div>

      {/* Advanced DNS Toggle */}
      <div className="mb-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-slate-400">dns</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">高级防泄漏 DNS</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={advancedDns} 
            onChange={(e) => onAdvancedDnsChange(e.target.checked)} 
          />
          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-[var(--color-primary)]"></div>
        </label>
      </div>

      <div className="space-y-3">
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
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={onGenerate}
            disabled={nodesCount === 0}
            className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)] mb-0.5">
              update
            </span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">更新订阅</span>
          </button>
          <button
            onClick={onDownload}
            disabled={!hasConfig}
            className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)] mb-0.5">
              download
            </span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">导出 YAML</span>
          </button>
          <button
            onClick={onCloudSave}
            disabled={isSavingCloud || nodesCount === 0}
            className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSavingCloud ? 'animate-spin' : ''} text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)] mb-0.5`}>
              {isSavingCloud ? 'progress_activity' : 'cloud_upload'}
            </span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{currentConfigId ? '更新云端' : '托管云端'}</span>
          </button>
          <button
            onClick={onSaveAsBranch}
            disabled={!currentConfigId || isSavingCloud}
            className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={!currentConfigId ? '请先保存或加载一个配置' : '基于当前配置创建分支'}
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)] mb-0.5">
              fork_right
            </span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">新建分支</span>
          </button>
        </div>
        
        {cloudUrl && (
          <div className="mt-3 p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg flex flex-col gap-2">
            <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">cloud_done</span> 专属云端链接已生成
            </span>
            <div className="flex bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
              <input 
                type="text" 
                readOnly 
                value={cloudUrl} 
                className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 px-2 py-1.5 outline-none font-mono"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(cloudUrl);
                  toast('success', '云端订阅链接已复制到剪贴板！');
                }}
                className="px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
