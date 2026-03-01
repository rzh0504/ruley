import React, { useState } from 'react';
import { toast } from './Toast';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('ruley_token', data.token);
        toast('success', '登录成功');
        onLogin(data.token);
      } else {
        toast('error', data.error || '登录失败');
      }
    } catch {
      toast('error', '无法连接到后端服务');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-xl bg-slate-900 dark:bg-[var(--color-primary)] text-[var(--color-primary)] dark:text-black mb-4 shadow-lg">
            <span className="material-symbols-outlined text-[28px]">bolt</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ruley <span className="text-slate-400 dark:text-[var(--color-primary)] font-normal">Pro</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            请输入管理密码以继续
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-slate-400">
              lock
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理密码"
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] outline-none transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3 bg-slate-900 dark:bg-[var(--color-primary)] text-white dark:text-black font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-[var(--color-primary-dark)] transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                验证中...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                登录
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          密码在服务端 <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> 文件中配置
        </p>
      </div>
    </div>
  );
}
