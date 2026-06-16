import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover shrink-0', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full shrink-0 flex items-center justify-center font-semibold text-white',
        'bg-gradient-to-br from-[#25D366] to-[#075E54]',
        sizeClass,
        className
      )}
      aria-label={name || 'Avatar'}
    >
      {getInitials(name)}
    </div>
  );
}
