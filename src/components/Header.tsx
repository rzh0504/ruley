import React, { useEffect, useState } from 'react';
import SettingsModal from './SettingsModal';

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Check system preference or localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#121920]/80 backdrop-blur-md px-6 py-3 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-8 rounded bg-slate-900 dark:bg-[var(--color-primary)] text-[var(--color-primary)] dark:text-black transition-colors">
          <span className="material-symbols-outlined text-[20px]">bolt</span>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">
          SubBoost <span className="text-slate-500 dark:text-[var(--color-primary)] font-normal">Pro</span>
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-6 items-center">
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
          <span className="flex items-center gap-1">
            <span className="block w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span> API 在线
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1">v2.4.1 (CN)</span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center overflow-hidden rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button className="flex items-center justify-center overflow-hidden rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[var(--color-primary)] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center overflow-hidden rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-9 ring-2 ring-slate-100 dark:ring-slate-800"
            data-alt="User profile avatar"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8H1yfqFVditmx45e39tcViM5FmjAMZlq1COpxegVaY08XYEaHwcH1fpoMwaK1y8OCcBKWpa_o3uohtPQows-GHt9zZFLl6nrD-i_Jcz48LKR5ujiG84fxhNjC0LoTHXLSeDuqB9kdssE_TmayJhZuQL9-2qlkytDhGYdJakcdewl6cbTiNG91pc4Y8YbNHflJQuNxvA24kU64upqymixFsMA7iRk4-f5D3oQ5Kx4C9BFSKF1puStzWkCDn-r7qcnVKg3nyKZ7r_WU")',
            }}
          ></div>
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
