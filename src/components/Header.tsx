import React, { useState } from 'react';
import SettingsModal from './SettingsModal';

interface HeaderProps {
  onLogout?: () => void;
  activeView?: 'dashboard' | 'manager';
  onViewChange?: (view: 'dashboard' | 'manager') => void;
}

export default function Header({ onLogout, activeView = 'dashboard', onViewChange }: HeaderProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navBtnClass = (view: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
      activeView === view
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
    }`;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#121920]/80 backdrop-blur-md px-6 py-3 transition-colors duration-300">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded bg-slate-900 dark:bg-[var(--color-primary)] text-[var(--color-primary)] dark:text-black transition-colors">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">
            Ruley
          </h2>
        </div>

        {/* Navigation */}
        {onViewChange && (
          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => onViewChange('dashboard')} className={navBtnClass('dashboard')}>
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              控制台
            </button>
            <button onClick={() => onViewChange('manager')} className={navBtnClass('manager')}>
              <span className="material-symbols-outlined text-[18px]">folder_managed</span>
              配置管理
            </button>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 mr-2">
          <span className="flex items-center gap-1">
            <span className="block w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span> API 在线
          </span>
        </div>
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          title={isDark ? "切换亮色" : "切换暗色"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center justify-center rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          title="设置"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center justify-center rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            title="退出登录"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        )}
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
