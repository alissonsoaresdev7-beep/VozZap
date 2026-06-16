// ====================================================
// VozZap - Hook para gerenciamento de perfis
// ====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, uploadAvatar } from '@/lib/supabase';
import type { Profile, ProfileFormData } from '@/types';

export function useProfile(username?: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });
}

export function useProfileById(userId?: string) {
  return useQuery({
    queryKey: ['profile-by-id', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function useFollowCounts(userId?: string) {
  return useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      if (!userId) return { followers: 0, following: 0 };
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
      ]);
      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    },
    enabled: !!userId,
  });
}

export function useIsFollowing(followerId?: string, followingId?: string) {
  return useQuery({
    queryKey: ['is-following', followerId, followingId],
    queryFn: async () => {
      if (!followerId || !followingId) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!followerId && !!followingId,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      followerId,
      followingId,
      isFollowing,
    }: {
      followerId: string;
      followingId: string;
      isFollowing: boolean;
    }) => {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follow-counts', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['is-following', variables.followerId, variables.followingId] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      formData,
    }: {
      userId: string;
      formData: ProfileFormData;
    }) => {
      let avatarUrl: string | undefined;

      if (formData.avatar_file) {
        const uploaded = await uploadAvatar(userId, formData.avatar_file);
        if (uploaded) avatarUrl = uploaded;
      }

      const updateData: Partial<Profile> = {
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio,
      };
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-by-id'] });
    },
  });
}
