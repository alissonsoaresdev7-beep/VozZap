// ====================================================
// VozZap - Hook para mensagens diretas
// ====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message, Profile } from '@/types';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Busca todas as mensagens onde o usuário é remetente ou destinatário
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupa por parceiro de conversa
      const conversationMap = new Map<string, { partner: Profile; last_message: Message; unread_count: number }>();

      for (const msg of messages || []) {
        const typedMsg = msg as unknown as Message & { sender: Profile; receiver: Profile };
        const partner = typedMsg.sender_id === userId ? typedMsg.receiver : typedMsg.sender;
        const partnerId = partner?.id;

        if (!partnerId) continue;

        if (!conversationMap.has(partnerId)) {
          const unreadCount = (messages || []).filter(
            (m) => {
              const tm = m as unknown as Message;
              return tm.sender_id === partnerId && tm.receiver_id === userId && !tm.read_at;
            }
          ).length;

          conversationMap.set(partnerId, {
            partner,
            last_message: typedMsg,
            unread_count: unreadCount,
          });
        }
      }

      return Array.from(conversationMap.values());
    },
    enabled: !!userId,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });
}

export function useConversation(userId?: string, partnerId?: string) {
  return useQuery({
    queryKey: ['conversation', userId, partnerId],
    queryFn: async () => {
      if (!userId || !partnerId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as (Message & { sender: Profile; receiver: Profile })[];
    },
    enabled: !!userId && !!partnerId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      senderId,
      receiverId,
      content,
    }: {
      senderId: string;
      receiverId: string;
      content: string;
    }) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.senderId, variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, partnerId }: { userId: string; partnerId: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', userId)
        .eq('sender_id', partnerId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.userId] });
    },
  });
}
