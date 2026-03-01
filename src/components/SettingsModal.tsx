import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleClearData = () => {
    if (!confirm('确定要清除所有本地数据并退出登录吗？')) return;
    localStorage.clear();
    window.location.reload();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#121920]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)]">settings</span>
            设置
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* About */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 border-l-4 border-[var(--color-primary)] pl-2">
              关于
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>版本</span>
                <span className="font-mono text-slate-500">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>认证方式</span>
                <span className="font-mono text-slate-500">JWT (.env 密码)</span>
              </div>
              <div className="flex justify-between">
                <span>数据存储</span>
                <span className="font-mono text-slate-500">SQLite (data/ruley.db)</span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div>
            <h3 className="text-sm font-bold text-red-500 mb-3 border-l-4 border-red-400 pl-2">
              危险操作
            </h3>
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              清除所有本地数据并退出
            </button>
            <p className="text-[10px] text-slate-400 mt-2">此操作将清除本地缓存的认证令牌和主题偏好，数据库数据不受影响。</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-[#121920]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
