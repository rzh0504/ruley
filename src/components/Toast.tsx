import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const ICONS: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

const TEXT_COLORS: Record<ToastType, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(item.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-w-[300px] max-w-[420px] transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className={`mt-0.5 w-1 h-full min-h-[20px] rounded-full ${COLORS[item.type]}`} />
      <span className={`material-symbols-outlined text-[20px] mt-0.5 ${TEXT_COLORS[item.type]}`}>
        {ICONS[item.type]}
      </span>
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
        {item.message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(item.id), 300);
        }}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer mt-0.5"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

// --- Hook ---

let globalAddToast: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  if (globalAddToast) {
    globalAddToast(type, message);
  } else {
    // Fallback if provider isn't mounted yet
    console.warn('[Toast fallback]', type, message);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register globally
  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto animate-in slide-in-from-right duration-300">
              <ToastMessage item={item} onDismiss={dismissToast} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
