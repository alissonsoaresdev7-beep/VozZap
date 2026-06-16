import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MoreVertical, Trash2, Edit, Share2, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useLike } from '@/hooks/useLike';
import { useDeletePost } from '@/hooks/useFeed';
import { useAuth } from '@/hooks/useAuth';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onToast?: (type: 'success' | 'error', title: string, desc?: string) => void;
}

export function PostCard({ post, onToast }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Usa novo hook de like
  const { liked, count, toggleLike, isLoading: isTogglingLike } = useLike(post.id);

  const deleteMutation = useDeletePost();

  const isOwner = user?.id === post.user_id;
  const profile = post.profiles;

  const handleLike = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await toggleLike();
    } catch (err) {
      onToast?.('error', 'Erro ao curtir post');
    }
  }, [user, navigate, toggleLike, onToast]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(post.id);
      onToast?.('success', 'Post excluído com sucesso');
      setConfirmDelete(false);
    } catch {
      onToast?.('error', 'Erro ao excluir post');
    }
  }, [post.id, deleteMutation, onToast]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      onToast?.('success', 'Link copiado!');
    }
  }, [post.id, post.title, onToast]);

  return (
    <article className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow animate-slide-in">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between p-4 pb-3">
        <Link
          to={`/perfil/${profile?.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || profile?.username}
            size="md"
            className="group-hover:ring-2 group-hover:ring-[#25D366] transition-all"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground group-hover:text-[#25D366] transition-colors truncate">
              {profile?.full_name || profile?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              @{profile?.username} · {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </Link>

        {/* Menu de opções */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Opções do post"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-lg min-w-[160px] overflow-hidden">
                <button
                  onClick={() => { handleShare(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <Share2 size={15} />
                  Compartilhar
                </button>
                {isOwner && (
                  <>
                    <Link
                      to={`/post/${post.id}/editar`}
                      onClick={() => setShowMenu(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Edit size={15} />
                      Editar
                    </Link>
                    <button
                      onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-3">
        <Link to={`/post/${post.id}`}>
          <h3 className="font-semibold text-foreground hover:text-[#25D366] transition-colors mb-1">
            {post.title}
          </h3>
        </Link>
        {post.description && (
          <p className="text-sm text-muted-foreground">{truncate(post.description, 120)}</p>
        )}
        {post.category && (
          <Badge variant="primary" className="mt-2">
            {post.category}
          </Badge>
        )}
      </div>

      {/* Player */}
      <div className="px-4 pb-3">
        <AudioPlayer
          src={post.audio_url}
          title={post.title}
          duration={post.duration_seconds}
          compact
        />
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-border">
        {/* Curtir */}
        <button
          onClick={handleLike}
          disabled={isTogglingLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
            liked
              ? 'text-red-500 bg-red-50 dark:bg-red-950/20'
              : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
          )}
          aria-label={liked ? 'Descurtir' : 'Curtir'}
          aria-pressed={liked}
        >
          {isTogglingLike ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Heart size={18} className={cn(liked && 'fill-current')} />
          )}
          <span className="font-medium">{count}</span>
        </button>

        {/* Comentários */}
        <Link
          to={`/post/${post.id}#comentarios`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all"
          aria-label={`${post.comments_count} comentários`}
        >
          <MessageCircle size={18} />
          <span className="font-medium">{post.comments_count}</span>
        </Link>

        <div className="flex-1" />

        {/* Visibilidade */}
        {isOwner && post.visibility === 'private' && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            🔒 Privado
          </span>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-card rounded-xl p-6 shadow-xl border border-border max-w-sm w-full">
            <h3 className="font-semibold text-lg mb-2">Excluir post?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Essa ação não pode ser desfeita. O arquivo de áudio também será removido.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
