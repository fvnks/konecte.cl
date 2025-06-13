
// src/components/chat/ChatHeader.tsx
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, UserCircle, Building, FileSearch } from 'lucide-react';
import type { User, ChatConversationListItem } from '@/lib/types';

interface ChatHeaderProps {
  otherUser?: Pick<User, 'name' | 'avatarUrl'>;
  conversationContext?: Pick<ChatConversationListItem, 'context_title' | 'context_slug' | 'context_type'> | null;
}

export default function ChatHeader({ otherUser, conversationContext }: ChatHeaderProps) {
  const userName = otherUser?.name || "Usuario Desconocido";
  const userAvatar = otherUser?.avatarUrl;
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const getContextIcon = () => {
    if (conversationContext?.context_type === 'property') return <Building className="h-4 w-4 text-muted-foreground" />;
    if (conversationContext?.context_type === 'request') return <FileSearch className="h-4 w-4 text-muted-foreground" />;
    return null;
  };

  const getContextLink = () => {
    if (!conversationContext?.context_slug) return null;
    if (conversationContext.context_type === 'property') return `/properties/${conversationContext.context_slug}`;
    if (conversationContext.context_type === 'request') return `/requests/${conversationContext.context_slug}`;
    return null;
  }

  const contextLink = getContextLink();

  return (
    <div className="flex items-center p-3 sm:p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
      <Button variant="ghost" size="icon" className="mr-2 sm:mr-3 h-9 w-9" asChild>
        <Link href="/dashboard/messages">
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Volver a Mensajes</span>
        </Link>
      </Button>
      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border">
        <AvatarImage src={userAvatar} alt={userName} data-ai-hint="persona perfil" />
        <AvatarFallback className="text-sm bg-muted">
          {userInitials || <UserCircle className="h-5 w-5"/>}
        </AvatarFallback>
      </Avatar>
      <div className="ml-2 sm:ml-3 flex-1 min-w-0">
        <h2 className="text-sm sm:text-base font-semibold truncate" title={userName}>{userName}</h2>
        {conversationContext?.context_title && (
          <div className="text-xs text-muted-foreground flex items-center truncate">
            {getContextIcon()}
            {contextLink ? (
                <Link href={contextLink} target="_blank" className="ml-1 hover:underline truncate" title={`Ver ${conversationContext.context_type === 'property' ? 'propiedad' : 'solicitud'}: ${conversationContext.context_title}`}>
                   {conversationContext.context_title}
                </Link>
            ) : (
                <span className="ml-1 truncate" title={conversationContext.context_title}>{conversationContext.context_title}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
