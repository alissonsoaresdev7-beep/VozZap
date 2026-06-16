// ====================================================
// VozZap - Hook para sistema de toasts
// ====================================================

import { useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from '@/types';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = String(++toastId);
      const toast: ToastMessage = { id, type, title, description };
      setToasts((prev) => [...prev, toast]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => addToast('success', title, description),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) => addToast('error', title, description),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) => addToast('info', title, description),
    [addToast]
  );
  const warning = useCallback(
    (title: string, description?: string) => addToast('warning', title, description),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, info, warning };
}
