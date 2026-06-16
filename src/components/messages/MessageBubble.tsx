import { Check, CheckCheck } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Message, Profile } from '@/types';

interface MessageBubbleProps {
  message: Message & { sender?: Profile };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isRead = !!message.read_at;

  return (
    <div className={cn('flex items-end gap-2 max-w-[85%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
      {/* Avatar (apenas para mensagens dos outros) */}
      {!isOwn && (
        <Avatar
          src={message.sender?.avatar_url}
          name={message.sender?.full_name || message.sender?.username}
          size="xs"
          className="shrink-0 mb-1"
        />
      )}

      {/* Balão */}
      <div className={cn('group flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-full',
            isOwn
              ? 'bg-[#25D366] text-white rounded-br-sm'
              : 'bg-card text-foreground border border-border rounded-bl-sm'
          )}
        >
          {message.content}
        </div>

        {/* Metadados */}
        <div className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity', isOwn ? 'flex-row-reverse' : '')}>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(message.created_at)}
          </span>
          {isOwn && (
            isRead
              ? <CheckCheck size={12} className="text-[#25D366]" />
              : <Check size={12} className="text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
