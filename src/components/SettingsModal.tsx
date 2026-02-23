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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#121920]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)] dark:text-[var(--color-primary-dark)]">settings</span>
            全局设置
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] styled-scrollbar">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 border-l-4 border-[var(--color-primary)] pl-2">
                API 接口配置
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Subconverter API URL</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] outline-none"
                    placeholder="例如: https://sub.my-domain.com"
                    defaultValue="http://127.0.0.1:25500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">用于解析复杂订阅链接的开源后端地址</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">管理密码 (API Token)</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] outline-none"
                    placeholder="用于向本地后端提交保存的密钥"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 border-l-4 border-slate-400 dark:border-slate-600 pl-2">
                客户端测试配置
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">保存自动测试</div>
                    <div className="text-[10px] text-slate-500">保存配置后立刻下发给内核测试规则准确性</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)]/50 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-[#121920]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-[var(--color-primary)] hover:bg-slate-800 dark:hover:bg-[var(--color-primary-dark)] text-white dark:text-black text-sm font-bold rounded shadow-md transition-colors cursor-pointer"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
