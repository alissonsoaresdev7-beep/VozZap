import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se já segue
  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    const checkFollowing = async () => {
      try {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        setIsFollowing((data?.length ?? 0) > 0);
      } catch (err) {
        console.log('Not following yet');
      }
    };

    checkFollowing();

    // Subscribe a mudanças em tempo real
    const channel = supabase
      .channel(`follows:${user.id}:${targetUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        () => checkFollowing()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (isFollowing) {
        // Deixar de seguir
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Seguir
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar follow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, toggleFollow, isLoading };
}
