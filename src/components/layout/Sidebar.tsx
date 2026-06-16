import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { to: '/',          icon: Home,          label: 'Início' },
    { to: '/explorar',  icon: Search,        label: 'Explorar' },
    { to: '/publicar',  icon: PlusCircle,    label: 'Publicar', requiresAuth: true },
    { to: '/mensagens', icon: MessageCircle, label: 'Mensagens', requiresAuth: true },
    {
      to: user && profile ? `/perfil/${profile.username}` : '/login',
      icon: User,
      label: 'Perfil',
    },
  ];

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to.split('?')[0]);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-card border-r border-border z-40 p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
          <span className="text-white font-bold text-lg">🎙</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-[#25D366]">VozZap</span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-[#25D366] text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="space-y-2 pt-4 border-t border-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Tema claro' : 'Tema escuro'}
        </button>

        {user ? (
          <>
            {/* Perfil resumido */}
            <Link
              to={profile ? `/perfil/${profile.username}` : '/login'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-all"
            >
              <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || profile?.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
              </div>
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <LogOut size={18} />
              Sair
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:bg-[#1db954] transition-all"
          >
            Entrar
          </Link>
        )}
      </div>
    </aside>
  );
}
