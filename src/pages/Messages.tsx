import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useToast } from '@/hooks/useToast';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface Conversation {
  userId: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export function Messages() {
  // ===== TODOS OS HOOKS NO TOPO =====
  const { user } = useAuth();
  const { username: paramUsername } = useParams();
  const toast = useToast();

  // Estados
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Hook para mensagens diretas
  const { messages, sendMessage, isLoading: isSendingMessage, error: chatError } = useDirectMessages(
    selectedConversation || ''
  );

  // Callbacks
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      const conversationMap = new Map<string, Conversation>();
      const userIds = new Set<string>();

      for (const msg of (allMessages as any[]) || []) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        userIds.add(otherUserId);

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            username: 'Carregando...',
            full_name: 'Carregando...',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }
      }

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', Array.from(userIds));

        const profileMap = new Map<string, Profile>();
        for (const profile of profiles || []) {
          profileMap.set(profile.id, profile);
        }

        for (const [userId, conv] of conversationMap) {
          const profile = profileMap.get(userId);
          if (profile) {
            conv.username = profile.username;
            conv.full_name = profile.full_name;
            conv.avatar_url = profile.avatar_url;
          }
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      toast.addToast('error', 'Erro ao carregar conversas');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, toast]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageText.trim() || !selectedConversation) return;

      const text = messageText;
      setMessageText('');

      try {
        await sendMessage(text);
      } catch (err) {
        setMessageText(text);
        console.error('Erro ao enviar mensagem:', err);
        toast.addToast('error', 'Erro ao enviar mensagem');
      }
    },
    [messageText, selectedConversation, sendMessage, toast]
  );

  const selectedConv = useMemo(
    () => conversations.find((c) => c.userId === selectedConversation),
    [conversations, selectedConversation]
  );

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático quando há novas mensagens
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [messages]);

  // Quando paramUsername muda, seleciona a conversa ou cria nova
  useEffect(() => {
    if (!paramUsername || !user) return;

    // Tenta encontrar a conversa existente
    const existingConv = conversations.find((c) => c.username === paramUsername);
    if (existingConv) {
      setSelectedConversation(existingConv.userId);
      return;
    }

    // Se não encontrou, busca o perfil do usuário para iniciar nova conversa
    (async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('username', paramUsername)
          .single();

        if (error) {
          console.error('Usuário não encontrado:', error);
          return;
        }

        if (profile && profile.id !== user.id) {
          // Cria nova conversa (sem mensagens anteriores)
          const newConv: Conversation = {
            userId: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            unread_count: 0,
          };
          setConversations((prev) => [newConv, ...prev]);
          setSelectedConversation(profile.id);
        } else if (!profile) {
          console.warn('Perfil do usuário não encontrado:', paramUsername);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      }
    })();
  }, [paramUsername, user, conversations]);

  // Effects (sempre por último)
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-100px)] gap-4">
        {/* Lista de conversas */}
        <div className="w-80 border border-border rounded-xl flex flex-col bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Mensagens</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageCircle size={40} className="text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedConversation(conv.userId)}
                  className={`w-full px-4 py-3 border-b border-border text-left hover:bg-muted transition-colors ${
                    selectedConversation === conv.userId ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar url={conv.avatar_url} name={conv.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {conv.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 border border-border rounded-xl flex flex-col bg-card overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                {selectedConv && (
                  <>
                    <Avatar url={selectedConv.avatar_url} name={selectedConv.full_name} size="sm" />
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedConv.full_name}</h3>
                      <p className="text-xs text-muted-foreground">@{selectedConv.username}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Mostrar erro se houver */}
              {chatError && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {chatError}</p>
                </div>
              )}

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isSendingMessage && messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-muted-foreground" size={24} />
                  </div>
                )}
                {messages.length === 0 && !isSendingMessage ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">Comece a conversa!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          msg.sender_id === user?.id
                            ? 'bg-[#25D366] text-white'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isSendingMessage || !messageText.trim()}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isSendingMessage ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-muted-foreground">Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
