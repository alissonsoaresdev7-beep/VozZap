import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useLike(postId: string) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !postId) return;

    const fetch = async () => {
      try {
        // Pega contagem de likes
        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        setCount(post?.likes_count ?? 0);

        // Verifica se o usuário já curtiu
        const { data: likes } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .limit(1);

        setLiked((likes?.length ?? 0) > 0);
      } catch (err) {
        console.error('Erro ao buscar like status:', err);
      }
    };

    fetch();

    // Subscribe a mudanças em tempo real
    const channel = supabase
      .channel(`likes:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` },
        () => fetch()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, postId]);

  const toggleLike = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      if (liked) {
        // Descurtir
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;
        setCount(c => Math.max(0, c - 1));
        setLiked(false);
      } else {
        // Curtir
        const { error } = await supabase.from('likes').insert({
          user_id: user.id,
          post_id: postId,
        });

        if (error) throw error;
        setCount(c => c + 1);
        setLiked(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar like:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, postId, liked]);

  return { liked, count, toggleLike, isLoading };
}
