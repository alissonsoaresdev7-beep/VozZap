import { Link } from 'react-router-dom';
import { Sun, Moon, Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';

export function Header() {
  const { user, profile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-[#075E54] text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
            <span className="text-white font-bold text-sm">🎙</span>
          </div>
          <span className="font-bold text-lg tracking-tight">VozZap</span>
        </Link>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <Link
            to="/explorar"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Buscar"
          >
            <Search size={20} />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user && (
            <Link
              to={`/perfil/${profile?.username || ''}`}
              className="ml-1"
              aria-label="Meu perfil"
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name || profile?.username}
                size="sm"
                className="ring-2 ring-white/30 hover:ring-[#25D366] transition-all"
              />
            </Link>
          )}

          {!user && (
            <Link
              to="/login"
              className="ml-2 px-3 py-1.5 bg-[#25D366] text-white text-sm font-medium rounded-full hover:bg-[#1db954] transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

// Componente separado para notificação de badge
export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}

// Workaround para uso do Bell com badge
export { Bell };
