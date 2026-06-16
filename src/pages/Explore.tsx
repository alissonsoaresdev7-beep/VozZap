import { useState, useCallback } from 'react';
import { Search, X, Mic, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/feed/PostCard';
import { ToastContainer } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import type { Post, Profile } from '@/types';
import { Button } from '@/components/ui/Button';

const CATEGORIES = ['Música', 'Podcast', 'Humor', 'Notícias', 'Educação', 'Outros'];

export function Explore() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query, selectedCategory],
    queryFn: async () => {
      if (!query && !selectedCategory) return { posts: [], profiles: [] };

      const [postsRes, profilesRes] = await Promise.all([
        // Busca posts com filtros específicos
        supabase
          .from('posts')
          .select(`*, profiles (id, username, full_name, avatar_url, bio)`)
          .eq('visibility', 'public')
          .ilike('title', `%${query}%`)
          .eq(selectedCategory ? 'category' : 'visibility', selectedCategory || 'public')
          .order('created_at', { ascending: false })
          .limit(20),
        // Busca perfis com limite
        query && query.trim()
          ? supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
              .limit(8)
          : Promise.resolve({ data: [], error: null }),
      ]);

      return {
        posts: (postsRes.data as Post[]) || [],
        profiles: (profilesRes.data as Profile[]) || [],
      };
    },
    enabled: !!query || !!selectedCategory,
    staleTime: 30000, // Cache por 30 segundos
  });

  const handleCategoryClick = useCallback((cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? '' : cat));
  }, []);

  const hasResults = results && (results.posts.length > 0 || results.profiles.length > 0);

  return (
    <Layout>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="space-y-4">
        {/* Barra de busca */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar posts, usuários…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all"
            aria-label="Campo de busca"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros de categoria */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categorias</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#25D366] text-white shadow-sm'
                    : 'bg-card text-muted-foreground border border-border hover:border-[#25D366]/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Estado inicial */}
        {!query && !selectedCategory && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <Search size={28} className="text-[#25D366]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Explore o VozZap</p>
              <p className="text-sm text-muted-foreground mt-1">
                Busque por posts ou filtre por categoria
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Sem resultados */}
        {!isLoading && (query || selectedCategory) && !hasResults && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Mic size={32} className="text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Nenhum resultado encontrado</p>
          </div>
        )}

        {/* Perfis encontrados */}
        {results?.profiles && results.profiles.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Usuários
            </p>
            <div className="space-y-2">
              {results.profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border hover:border-[#25D366]/50 transition-all"
                >
                  <Link
                    to={`/perfil/${profile.username}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar src={profile.avatar_url} name={profile.full_name || profile.username} size="md" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {profile.full_name || profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                  </Link>
                  {user?.id !== profile.id && (
                    <Button
                      onClick={() => navigate(`/mensagens/${profile.username}`)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 flex-shrink-0"
                    >
                      <Mail size={16} />
                      <span className="hidden sm:inline">Mensagem</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts encontrados */}
        {results?.posts && results.posts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Posts ({results.posts.length})
            </p>
            <div className="space-y-4">
              {results.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToast={(type, title, desc) => {
                    if (type === 'success') toast.success(title, desc);
                    else toast.error(title, desc);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
