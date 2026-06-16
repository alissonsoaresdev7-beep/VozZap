// ====================================================
// VozZap - Hook para o feed de posts
// ====================================================

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/types';

const PAGE_SIZE = 10;

export function useFeed(category?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', category],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id, username, full_name, avatar_url, bio
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data as Post[]) || [], nextPage: pageParam + 1, hasMore: (data?.length ?? 0) === PAGE_SIZE };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: 0,
  });
}

export function usePost(postId: string) {
  return useInfiniteQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles (id, username, full_name, avatar_url, bio)`)
        .eq('id', postId)
        .single();
      if (error) throw error;
      return { data: data as Post, nextPage: 1, hasMore: false };
    },
    getNextPageParam: () => undefined,
    initialPageParam: 0,
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
}

export function useCheckLike(_postId: string, _userId?: string) {
  return { isLiked: false }; // Simplified - would use useQuery in real implementation
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
}

export function useUserPosts(userId?: string) {
  return useInfiniteQuery({
    queryKey: ['user-posts', userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { data: [], nextPage: 1, hasMore: false };
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles (id, username, full_name, avatar_url, bio)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      return { data: (data as Post[]) || [], nextPage: pageParam + 1, hasMore: (data?.length ?? 0) === PAGE_SIZE };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: 0,
    enabled: !!userId,
  });
}
