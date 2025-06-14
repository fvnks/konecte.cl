
// src/components/chat/ChatMessageItem.tsx
'use client';

import type { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // Corregido: quitado el guion bajo
import { es } from 'date-fns/locale';
import { UserCircle } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
}

export default function ChatMessageItem({ message, currentUserId }: ChatMessageItemProps) {
  const isSentByCurrentUser = message.sender_id === currentUserId;
  const senderName = message.sender?.name || 'Usuario';
  const senderAvatar = message.sender?.avatarUrl;
  const senderInitials = senderName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]",
        isSentByCurrentUser ? "self-end flex-row-reverse" : "self-start"
      )}
    >
      {!isSentByCurrentUser && (
        <Avatar className="h-8 w-8 border self-end mb-1">
          <AvatarImage src={senderAvatar} alt={senderName} data-ai-hint="persona perfil"/>
          <AvatarFallback className="text-xs bg-muted">
            {senderInitials || <UserCircle className="h-4 w-4"/>}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "p-2.5 sm:p-3 rounded-xl shadow-md",
          isSentByCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground border rounded-bl-none"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1.5",
            isSentByCurrentUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}
          title={format(new Date(message.created_at), "PPPpp", { locale: es })}
        >
          {format(new Date(message.created_at), "HH:mm", { locale: es })}
        </p>
      </div>
    </div>
  );
}
