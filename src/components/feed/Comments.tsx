import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatRelativeTime } from '@/lib/utils';
import { Trash2, Loader2 } from 'lucide-react';

interface CommentsProps {
  postId: string;
}

export function Comments({ postId }: CommentsProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { comments, addComment, deleteComment, isLoading } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      await addComment(newComment);
      setNewComment('');
      toast.addToast('success', 'Comentário adicionado!');
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      toast.addToast('error', 'Erro ao adicionar comentário');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.addToast('success', 'Comentário removido!');
    } catch (err) {
      console.error('Erro ao deletar comentário:', err);
      toast.addToast('error', 'Erro ao remover comentário');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Comentários ({comments.length})</h3>

      {/* Input para novo comentário */}
      {user && (
        <form onSubmit={handleAddComment} className="flex gap-3">
          <Avatar url={''} name={user.email} size="sm" />
          <div className="flex-1 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              disabled={isAddingComment}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isAddingComment || !newComment.trim()}
              className="flex items-center gap-2"
            >
              {isAddingComment && <Loader2 size={16} className="animate-spin" />}
              Enviar
            </Button>
          </div>
        </form>
      )}

      {/* Lista de comentários */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted">
              <Avatar
                url={comment.author?.avatar_url}
                name={comment.author?.username}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {comment.author?.username}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {formatRelativeTime(comment.created_at)}
                </p>
                <p className="text-sm text-foreground break-words">{comment.content}</p>
              </div>
              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                  title="Deletar comentário"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
