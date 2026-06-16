import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { to: '/',          icon: Home,          label: 'Início' },
  { to: '/explorar',  icon: Search,        label: 'Explorar' },
  { to: '/publicar',  icon: PlusCircle,    label: 'Publicar', requiresAuth: true },
  { to: '/mensagens', icon: MessageCircle, label: 'Mensagens', requiresAuth: true },
  { to: '/perfil',    icon: User,          label: 'Perfil' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();

  const getTo = (item: NavItem) => {
    if (item.to === '/perfil') {
      return user && profile ? `/perfil/${profile.username}` : '/login';
    }
    if (item.requiresAuth && !user) return '/login';
    return item.to;
  };

  const isActive = (item: NavItem) => {
    if (item.to === '/') return pathname === '/';
    if (item.to === '/perfil') return pathname.startsWith('/perfil');
    return pathname.startsWith(item.to);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const to = getTo(item);
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={to}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                active
                  ? 'text-[#25D366]'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {item.to === '/publicar' ? (
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center -mt-4 shadow-lg',
                  'bg-[#25D366] text-white'
                )}>
                  <Icon size={22} />
                </div>
              ) : (
                <>
                  <Icon
                    size={22}
                    className={cn(active && 'scale-110 transition-transform')}
                  />
                  <span className={cn('text-[10px]', active && 'font-semibold')}>{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
