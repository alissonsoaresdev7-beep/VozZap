import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { Badge } from '@/components/ui/Badge';
import { Comments } from '@/components/feed/Comments';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';
import type { Post } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function PostDetail() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(id, username, full_name, avatar_url)')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data as Post);
    } catch (err) {
      console.error('Erro ao buscar post:', err);
      toast.addToast('error', 'Erro ao carregar post');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-[#25D366]" size={32} />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <p className="text-muted-foreground mb-4">Post não encontrado</p>
          <Button onClick={() => navigate('/')}>Voltar para início</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        {/* Botão voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        {/* Card do post */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-8">
          {/* Cabeçalho */}
          <div className="flex items-start gap-4 pb-6 border-b border-border">
            <Avatar
              url={(post.profiles as any)?.avatar_url}
              name={(post.profiles as any)?.full_name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {(post.profiles as any)?.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                @{(post.profiles as any)?.username}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(post.created_at)}
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="py-6">
            <h1 className="text-3xl font-bold text-foreground mb-3">{post.title}</h1>

            {post.description && (
              <p className="text-lg text-muted-foreground mb-4">{post.description}</p>
            )}

            {post.category && (
              <Badge variant="primary" className="mb-4">
                {post.category}
              </Badge>
            )}
          </div>

          {/* Player */}
          <div className="mb-6">
            <AudioPlayer
              src={post.audio_url}
              title={post.title}
              duration={post.duration_seconds}
              compact={false}
            />
          </div>

          {/* Stats */}
          <div className="flex gap-6 py-4 border-t border-border text-sm text-muted-foreground">
            <span>❤️ {post.likes_count} curtidas</span>
            <span>💬 {post.comments_count} comentários</span>
          </div>
        </div>

        {/* Comentários */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm" id="comentarios">
          <Comments postId={post.id} />
        </div>
      </div>
    </Layout>
  );
}
