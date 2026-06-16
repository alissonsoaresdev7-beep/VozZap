import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const [error, setError] = useState<string | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Retorna se não temos IDs válidos
    if (!user?.id || !otherUserId || otherUserId === '') {
      setMessages([]);
      setError(null);
      return;
    }

    let isMounted = true;

    const initChat = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1️⃣ BUSCAR MENSAGENS INICIAIS
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at, read_at')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true })
          .limit(MESSAGES_LIMIT);

        if (fetchError) {
          console.error('[Chat] Erro ao buscar mensagens iniciais:', fetchError);
          throw fetchError;
        }

        if (!isMounted) return;

        const conversationMessages = (data as Message[]) ?? [];
        setMessages(conversationMessages);

        // Atualiza cache de IDs
        messageIdsRef.current.clear();
        conversationMessages.forEach((m) => messageIdsRef.current.add(m.id));

        // Marca mensagens como lidas automaticamente
        const unreadIds = conversationMessages
          .filter((m) => m.receiver_id === user.id && !m.read_at)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds)
            .then()
            .catch((err) => console.error('[Chat] Erro ao marcar como lido:', err));
        }
      } catch (err) {
        console.error('[Chat] Erro ao carregar mensagens:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          // 2️⃣ APENAS APÓS carregar inicial, subscribe ao realtime
          setupRealtimeSubscription();
        }
      }
    };

    const setupRealtimeSubscription = async () => {
      try {
        // Gera nome do canal usando IDs ordenados (mais estável)
        const sortedIds = [user.id, otherUserId].sort();
        const channelName = `messages_${sortedIds[0]}_${sortedIds[1]}`;

        console.log(`[Chat] Criando subscription realtime para canal: ${channelName}`);

        // ⚠️ IMPORTANTE: Sem filtro no .on() aqui pois a RLS já filtra no servidor
        // O Supabase Realtime + RLS automaticamente filtra para apenas:
        // - Mensagens onde você é sender_id OU receiver_id
        channelRef.current = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true }, // Recebe próprias mudanças
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

              console.log('[Chat] Nova mensagem recebida:', {
                msgId: newMsg.id,
                from: newMsg.sender_id === user.id ? 'próprio' : 'outro',
              });

              // Verifica se mensagem é para esta conversa
              const isForThisConversation =
                (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
                (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id);

              if (!isForThisConversation) {
                console.log('[Chat] Mensagem ignorada - não é desta conversa');
                return;
              }

              // Evita duplicatas (mensagens otimistas que já estão no state)
              if (messageIdsRef.current.has(newMsg.id)) {
                console.log('[Chat] Mensagem duplicada ignorada:', newMsg.id);
                return;
              }

              messageIdsRef.current.add(newMsg.id);

              // ✅ Atualização imutável do estado
              setMessages((prev) => {
                const updated = [...prev, newMsg];
                console.log(`[Chat] Total de mensagens: ${updated.length}`);
                return updated;
              });

              // Marca como lida se recebeu
              if (newMsg.receiver_id === user.id && !newMsg.read_at) {
                supabase
                  .from('messages')
                  .update({ read_at: new Date().toISOString() })
                  .eq('id', newMsg.id)
                  .then(() => {
                    console.log(`[Chat] Mensagem marcada como lida: ${newMsg.id}`);
                  })
                  .catch((err) =>
                    console.error('[Chat] Erro ao marcar como lido:', err)
                  );
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `read_at=is.not.null`,
            },
            (payload) => {
              if (!isMounted) return;

              const updatedMsg = payload.new as Message;

              // Atualiza status de leitura localmente
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === updatedMsg.id ? { ...m, read_at: updatedMsg.read_at } : m
                )
              );

              console.log('[Chat] Status de leitura atualizado:', updatedMsg.id);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[Chat] ✅ Realtime subscription ATIVA');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Chat] ❌ Erro na subscription realtime');
              setError('Erro ao conectar realtime');
            } else if (status === 'CLOSED') {
              console.log('[Chat] Subscription finalizada');
            }
          });
      } catch (err) {
        console.error('[Chat] Erro ao setupar realtime:', err);
        setError('Erro ao conectar ao chat em tempo real');
      }
    };

    initChat();

    // Cleanup
    return () => {
      isMounted = false;

      if (channelRef.current) {
        console.log('[Chat] Removendo subscription realtime');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, otherUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.id || !otherUserId || !content.trim()) return;

      const optimisticMessage: Message = {
        id: `optimistic-${++messageIdCounter}`,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      // Adiciona mensagem otimista
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        console.log('[Chat] Enviando mensagem...', optimisticMessage.id);

        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: otherUserId,
            content: content.trim(),
          })
          .select();

        if (error) {
          console.error('[Chat] Erro ao inserir mensagem:', error);
          throw error;
        }

        if (!data || !data[0]) {
          throw new Error('Sem dados retornados do servidor');
        }

        const realMessage = data[0] as Message;
        messageIdsRef.current.add(realMessage.id);

        console.log('[Chat] Mensagem enviada com sucesso:', realMessage.id);

        // Substitui mensagem otimista com real
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? realMessage : m))
        );
      } catch (err) {
        console.error('[Chat] Erro ao enviar mensagem:', err);

        // Remove mensagem otimista em caso de erro
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        );

        throw err;
      }
    },
    [user?.id, otherUserId]
  );

  return { messages, sendMessage, isLoading, error };
}
