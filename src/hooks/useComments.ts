import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          post_id,
          content,
          created_at,
          profiles:user_id(id, username, full_name, avatar_url, bio)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsData = (data ?? []).map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        post_id: c.post_id,
        content: c.content,
        created_at: c.created_at,
        author: c.profiles,
      }));

      setComments(commentsData);
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();

    // Escuta mudanças em tempo real
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const addComment = useCallback(async (content: string) => {
    if (!user?.id || !content.trim() || !postId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        post_id: postId,
        content: content.trim(),
      });

      if (error) throw error;
      
      // Recarrega comentários após adicionar
      await fetchComments();
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, postId, fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Remove do estado local imediatamente
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Erro ao deletar comentário:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return { comments, addComment, deleteComment, isLoading };
}
