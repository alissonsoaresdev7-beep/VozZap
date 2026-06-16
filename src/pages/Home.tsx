import { useState } from 'react';
import { Mic, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { useFeed } from '@/hooks/useFeed';
import { useToast } from '@/hooks/useToast';
import type { Post } from '@/types';

const CATEGORIES = ['Todas', 'Música', 'Podcast', 'Humor', 'Notícias', 'Educação', 'Outros'];

export function Home() {
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const toast = useToast();

  const category = selectedCategory === 'Todas' ? undefined : selectedCategory;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useFeed(category);

  const allPosts = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Layout>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Filtros de categoria */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-[#25D366] text-white shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:border-[#25D366]/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 bg-muted rounded w-32" />
                  <div className="h-2 bg-muted rounded w-24" />
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-3" />
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground text-sm">Erro ao carregar o feed</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw size={14} />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Feed vazio */}
      {!isLoading && !error && allPosts.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center">
            <Mic size={28} className="text-[#25D366]" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Nenhum áudio ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedCategory !== 'Todas'
                ? `Nenhum post na categoria "${selectedCategory}"`
                : 'Seja o primeiro a publicar um áudio!'}
            </p>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {allPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post as Post}
            onToast={(type, title, desc) => {
              if (type === 'success') toast.success(title, desc);
              else toast.error(title, desc);
            }}
          />
        ))}
      </div>

      {/* Carregar mais */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </Layout>
  );
}
