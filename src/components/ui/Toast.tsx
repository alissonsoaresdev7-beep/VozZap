import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastMessage } from '@/types';

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: <CheckCircle size={18} className="text-[#25D366] shrink-0" />,
    error:   <XCircle size={18} className="text-red-500 shrink-0" />,
    info:    <Info size={18} className="text-blue-500 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-yellow-500 shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-l-[#25D366]',
    error:   'border-l-4 border-l-red-500',
    info:    'border-l-4 border-l-blue-500',
    warning: 'border-l-4 border-l-yellow-500',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg bg-card text-card-foreground border border-border',
        'animate-slide-in min-w-[300px] max-w-[400px]',
        borders[toast.type]
      )}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
