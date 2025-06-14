// src/components/chat/ConversationListItem.tsx
'use client';

import Link from 'next/link';
import type { ChatConversationListItem } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { UserCircle, Building, FileSearch, PackageOpen } from 'lucide-react';

interface ConversationListItemProps {
  conversation: ChatConversationListItem;
}

export default function ConversationListItem({ conversation }: ConversationListItemProps) {
  const otherUserName = conversation.other_user?.name || 'Usuario Desconocido';
  const otherUserAvatar = conversation.other_user?.avatarUrl;
  const otherUserInitials = otherUserName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  
  const lastMessageTime = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: es })
    : 'Hace mucho tiempo';

  const hasUnread = (conversation.unread_count_for_current_user || 0) > 0;

  const getContextIcon = () => {
    if (conversation.context_type === 'property') return <Building className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />;
    if (conversation.context_type === 'request') return <FileSearch className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />;
    return <PackageOpen className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors"/>; // Generic context if needed
  };

  return (
    <Link 
      href={`/dashboard/messages/${conversation.id}`}
      className={cn(
        "block p-3 sm:p-4 rounded-lg border transition-all duration-200 ease-in-out group",
        "bg-card hover:bg-secondary/60 hover:shadow-md",
        hasUnread ? "border-primary/50 bg-primary/5 hover:bg-primary/10" : "border-border"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-transparent group-hover:border-primary/30">
            <AvatarImage src={otherUserAvatar} alt={otherUserName} data-ai-hint="persona perfil"/>
            <AvatarFallback className={cn("text-sm sm:text-base", hasUnread ? "bg-primary/20 text-primary" : "bg-muted")}>
                {otherUserInitials || <UserCircle className="h-5 w-5"/>}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className={cn(
                "text-sm sm:text-base font-semibold truncate",
                hasUnread ? "text-primary" : "text-foreground group-hover:text-primary"
              )} title={otherUserName}>
                {otherUserName}
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 hidden sm:block">
                {lastMessageTime}
              </span>
            </div>
            <p className={cn(
              "text-xs sm:text-sm truncate",
              hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
            )} title={conversation.last_message_content || "Sin mensajes aún."}>
              {conversation.last_message_content || (conversation.context_title ? `Conversación sobre: ${conversation.context_title}` : "Nueva conversación...")}
            </p>
             {conversation.context_title && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center truncate">
                {getContextIcon()}
                <span className="ml-1 truncate" title={conversation.context_title}>{conversation.context_title}</span>
              </div>
            )}
          </div>

          {hasUnread && (
            <div className="flex flex-col items-end justify-center ml-2">
                <Badge variant="destructive" className="h-5 sm:h-6 px-1.5 sm:px-2 text-xs sm:text-sm rounded-full">
                    {conversation.unread_count_for_current_user}
                </Badge>
                 <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap sm:hidden">
                    {lastMessageTime}
                </span>
            </div>
          )}
        </div>
    </Link>
  );
}
