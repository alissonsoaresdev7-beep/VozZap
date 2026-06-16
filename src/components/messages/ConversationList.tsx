import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId?: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <MessageCircle size={28} className="text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Nenhuma conversa ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Visite um perfil e inicie uma conversa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map(({ partner, last_message, unread_count }) => (
        <Link
          key={partner.id}
          to={`/mensagens/${partner.id}`}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted',
            unread_count > 0 && 'bg-[#25D366]/5'
          )}
        >
          <div className="relative shrink-0">
            <Avatar src={partner.avatar_url} name={partner.full_name || partner.username} size="md" />
            {unread_count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#25D366] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread_count > 9 ? '9+' : unread_count}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={cn('text-sm font-semibold truncate', unread_count > 0 && 'text-[#25D366]')}>
                {partner.full_name || partner.username}
              </p>
              {last_message && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(last_message.created_at)}
                </span>
              )}
            </div>
            {last_message && (
              <p className={cn('text-xs truncate mt-0.5', unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {last_message.sender_id === currentUserId ? 'Você: ' : ''}
                {truncate(last_message.content, 50)}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
