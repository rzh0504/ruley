import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 py-6 px-8 text-center text-sm text-slate-400">
      <div className="flex justify-center gap-6 mb-4">
        <a className="hover:text-[var(--color-primary)]" href="#">
          文档
        </a>
        <a className="hover:text-[var(--color-primary)]" href="#">
          API 参考
        </a>
        <a className="hover:text-[var(--color-primary)]" href="#">
          支持
        </a>
      </div>
      <p>© 2025 Ruley. 保留所有权利。</p>
    </footer>
  );
}
