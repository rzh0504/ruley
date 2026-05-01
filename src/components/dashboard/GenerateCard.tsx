import React from "react";
import { toast } from "../Toast";

interface GenerateCardProps {
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasConfig: boolean;
  nodesCount: number;
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
  onGenerate,
  onDownload,
  isGenerating,
  hasConfig,
  nodesCount,
  advancedDns,
  onAdvancedDnsChange,
  onCloudSave,
  isSavingCloud,
  cloudUrl,
  onSaveAsBranch,
  currentConfigName,
  currentConfigId,
}: GenerateCardProps) {
  const resolvedName = currentConfigName?.trim() || "ruley";

  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-1 lg:col-span-2 xl:col-span-3 row-span-2 flex h-[480px] flex-col p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex shrink-0 items-start gap-3">
          <span className="material-symbols-outlined text-[26px] text-[var(--color-primary)]">rocket_launch</span>
          <div>
            <h3 className="whitespace-nowrap text-base font-bold text-slate-900 dark:text-white">
              生成配置
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            节点
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {nodesCount}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            内核
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            Mihomo
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            DNS
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {advancedDns ? "高级" : "标准"}
          </div>
        </div>
      </div>

      {/* Advanced DNS Toggle */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            高级防泄漏 DNS
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            对外解析优先使用更稳妥的防泄漏配置。
          </div>
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
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
              <span>正在编译配置...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">
                play_arrow
              </span>
              <span>{nodesCount === 0 ? "请先添加节点" : "立即生成配置"}</span>
            </>
          )}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onGenerate}
            disabled={nodesCount === 0}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)]">
              update
            </span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              更新订阅
            </span>
          </button>
          <button
            onClick={onDownload}
            disabled={!hasConfig}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)]">
              download
            </span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              导出 YAML
            </span>
          </button>
          <button
            onClick={onCloudSave}
            disabled={isSavingCloud || nodesCount === 0}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${isSavingCloud ? "animate-spin" : ""} text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)]`}
            >
              {isSavingCloud ? "progress_activity" : "cloud_upload"}
            </span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {currentConfigId ? "更新云端" : "托管云端"}
            </span>
          </button>
          <button
            onClick={onSaveAsBranch}
            disabled={!currentConfigId || isSavingCloud}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-[var(--color-primary)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
            title={
              !currentConfigId
                ? "请先保存或加载一个配置"
                : "基于当前配置创建分支"
            }
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-[var(--color-primary)]">
              fork_right
            </span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              新建分支
            </span>
          </button>
        </div>

        {cloudUrl && (
          <div className="mt-3 max-w-full rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 p-3">
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
                <span className="material-symbols-outlined text-[14px]">
                  cloud_done
                </span>{" "}
                专属云端链接已生成
              </span>
              <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                名称：{resolvedName}
              </span>
            </div>
            <div className="flex min-w-0 max-w-full overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <input
                type="text"
                readOnly
                value={cloudUrl}
                className="min-w-0 flex-1 truncate bg-transparent px-2 py-1.5 font-mono text-xs text-slate-600 outline-none dark:text-slate-300"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cloudUrl);
                  toast("success", "云端订阅链接已复制到剪贴板！");
                }}
                className="px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[14px]">
                  content_copy
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
