import React from 'react';

// React Error Boundaries require class components.
// We use `declare` for fields to work with useDefineForClassFields:false in tsconfig.
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  declare state: { hasError: boolean; error: Error | null };
  declare props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] p-8">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <span className="material-symbols-outlined text-3xl text-red-500">error</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              出现了一个错误
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              应用遇到了意外问题，请尝试刷新页面。
            </p>
            <p className="text-xs font-mono text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-6 break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-slate-900 dark:bg-[var(--color-primary)] text-white dark:text-black font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg cursor-pointer"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
