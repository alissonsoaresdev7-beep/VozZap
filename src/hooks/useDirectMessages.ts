import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

const MESSAGES_LIMIT = 50;
let messageIdCounter = 0;

export function useDirectMessages(otherUserId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Só executa se temos ambos IDs válidos
    if (!user?.id || !otherUserId || otherUserId === '') {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at, read_at')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true })
          .limit(MESSAGES_LIMIT);

        if (error) throw error;

        if (isMounted) {
          const conversationMessages = (data as Message[]) ?? [];
          setMessages(conversationMessages);
          
          // Atualiza cache de IDs
          messageIdsRef.current.clear();
          conversationMessages.forEach(m => messageIdsRef.current.add(m.id));

          // Marca mensagens como lidas em background (sem bloquear)
          const unreadIds = conversationMessages
            .filter((m) => m.receiver_id === user.id && !m.read_at)
            .map((m) => m.id);

          if (unreadIds.length > 0) {
            // Executa sem bloquear - direct call
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .in('id', unreadIds)
              .then()
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription com melhor filtro
    const channel = supabase
      .channel(`messages:${user.id}:${otherUserId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (!isMounted) return;
          
          const newMsg = payload.new as Message;
          
          // Verifica se mensagem é para esta conversa
          const isForThisConversation = 
            (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id);
          
          if (!isForThisConversation) return;
          
          // Evita duplicatas
          if (messageIdsRef.current.has(newMsg.id)) {
            return;
          }
          
          messageIdsRef.current.add(newMsg.id);
          
          setMessages((prev) => [...prev, newMsg]);

          // Marca como lida se recebeu (direto, sem delay)
          if (newMsg.receiver_id === user.id && !newMsg.read_at) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then()
              .catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, otherUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.id || !otherUserId || !content.trim()) return;

      // Cria mensagem otimista (mostra imediatamente)
      const optimisticMessage: Message = {
        id: `optimistic-${++messageIdCounter}`,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      // Adiciona mensagem otimista localmente IMEDIATAMENTE
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Envia para servidor
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: otherUserId,
            content: content.trim(),
          })
          .select();

        if (error) {
          console.error('Erro ao inserir mensagem no banco:', error);
          throw error;
        }

        // Se obteve ID real do servidor, substitui mensagem otimista
        if (data && data[0]) {
          const realMessage = data[0] as Message;
          messageIdsRef.current.add(realMessage.id);
          
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticMessage.id ? realMessage : m
            )
          );
        }
      } catch (err) {
        // Remove mensagem otimista em caso de erro
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        );
        console.error('Erro ao enviar mensagem:', err);
        throw err;
      }
    },
    [user?.id, otherUserId]
  );

  return { messages, sendMessage, isLoading };
}
