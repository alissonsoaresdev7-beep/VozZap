import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'destructive';
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary:     'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30',
    secondary:   'bg-[#075E54]/20 text-[#075E54] dark:text-[#25D366] border border-[#075E54]/30',
    muted:       'bg-muted text-muted-foreground border border-border',
    success:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
