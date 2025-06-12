
// src/components/comments/CommentItem.tsx
'use client';

import type { Comment as CommentType, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommentItemProps {
  comment: CommentType;
  // onReply: (commentId: string) => void; // Future functionality
  // onUpvote: (commentId: string) => void; // Future functionality
}

export default function CommentItem({ comment }: CommentItemProps) {
  const authorName = comment.author?.name || 'Usuario Anónimo';
  const authorAvatar = comment.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <div className="flex gap-3 items-start p-4 bg-secondary/30 rounded-lg shadow-sm">
      <Avatar className="h-10 w-10">
        <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona" />
        <AvatarFallback>{authorInitials || <UserCircle className="h-5 w-5"/>}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm">{authorName}</span>
          <span className="text-xs text-muted-foreground" title={new Date(comment.created_at).toLocaleString('es-CL')}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.content}</p>
        <div className="flex items-center gap-1 mt-2">
          <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-muted-foreground hover:text-primary" disabled>
            <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {comment.upvotes}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-muted-foreground" disabled>
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Responder
          </Button>
        </div>
      </div>
    </div>
  );
}
