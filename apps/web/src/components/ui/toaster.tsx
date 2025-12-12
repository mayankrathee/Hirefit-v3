'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let toasts: Toast[] = [];

export function toast(options: Omit<Toast, 'id'>) {
  const id = String(++toastId);
  const newToast: Toast = { ...options, id };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));

  const duration = options.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      listeners.forEach((listener) => listener(toasts));
    }, duration);
  }

  return id;
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setCurrentToasts);
    return () => {
      listeners.delete(setCurrentToasts);
    };
  }, []);

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toasts));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'min-w-[300px] rounded-lg border bg-card p-4 shadow-lg animate-slide-in-from-bottom',
            t.type === 'success' && 'border-green-500 bg-green-50 dark:bg-green-950',
            t.type === 'error' && 'border-red-500 bg-red-50 dark:bg-red-950',
            t.type === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium">{t.title}</div>
              {t.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

