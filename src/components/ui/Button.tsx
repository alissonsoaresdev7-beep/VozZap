import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:     'bg-[#25D366] text-white hover:bg-[#1db954] active:scale-95 focus-visible:ring-[#25D366]',
      secondary:   'bg-[#075E54] text-white hover:bg-[#064d44] active:scale-95 focus-visible:ring-[#075E54]',
      ghost:       'bg-transparent text-foreground hover:bg-[#25D366]/10 active:scale-95 focus-visible:ring-[#25D366]',
      destructive: 'bg-red-500 text-white hover:bg-red-600 active:scale-95 focus-visible:ring-red-500',
      outline:     'border-2 border-[#25D366] text-[#25D366] bg-transparent hover:bg-[#25D366]/10 active:scale-95 focus-visible:ring-[#25D366]',
    };

    const sizes = {
      sm:   'px-3 py-1.5 text-sm gap-1.5 h-8',
      md:   'px-4 py-2 text-sm gap-2 h-10',
      lg:   'px-6 py-3 text-base gap-2 h-12',
      icon: 'p-2 h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
