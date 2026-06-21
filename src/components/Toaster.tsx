"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Bell, X } from "lucide-react";

interface ToastItem {
  id: number;
  title: string;
  body?: string;
}

type ToastFn = (t: { title: string; body?: string }) => void;

const ToastContext = createContext<ToastFn>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    ({ title, body }) => {
      if (!title && !body) return;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, body }]);
      setTimeout(() => dismiss(id), 6000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Top-anchored, full-width on phones, below the safe area. */}
      <div className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto w-full max-w-sm bg-card border border-border shadow-lg rounded-2xl p-3 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              {t.title && <div className="font-semibold text-sm leading-tight">{t.title}</div>}
              {t.body && <div className="text-xs text-muted-foreground mt-0.5">{t.body}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Close" className="p-1 rounded-md hover:bg-muted shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
