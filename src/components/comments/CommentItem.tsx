
// src/components/comments/CommentItem.tsx
'use client';

import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, UserCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toggleCommentLikeAction, getCommentInteractionDetailsAction } from '@/actions/commentActions';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentType;
  loggedInUser: StoredUserType | null;
}

export default function CommentItem({ comment, loggedInUser }: CommentItemProps) {
  const authorName = comment.author?.name || 'Usuario Anónimo';
  const authorAvatar = comment.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const { toast } = useToast();
  const [totalLikes, setTotalLikes] = useState(comment.upvotes);
  const [currentUserLiked, setCurrentUserLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);

  const fetchInteractionDetails = useCallback(async () => {
    if (!comment.id) return;
    setIsLoadingInitialState(true);
    try {
      const details = await getCommentInteractionDetailsAction(comment.id, loggedInUser?.id);
      setTotalLikes(details.totalLikes);
      setCurrentUserLiked(details.currentUserLiked);
    } catch (error) {
      console.error("Error fetching comment interaction details:", error);
    } finally {
      setIsLoadingInitialState(false);
    }
  }, [comment.id, loggedInUser?.id]);

  useEffect(() => {
    fetchInteractionDetails();
  }, [fetchInteractionDetails]);

  const handleToggleLike = async () => {
    if (!loggedInUser?.id) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para dar 'Me gusta'.",
        variant: "destructive",
      });
      return;
    }
    if (isLiking || isLoadingInitialState) return;

    setIsLiking(true);
    try {
      const result = await toggleCommentLikeAction(comment.id, loggedInUser.id);
      if (result.success && result.newUpvotesCount !== undefined && result.userNowLikes !== undefined) {
        setTotalLikes(result.newUpvotesCount);
        setCurrentUserLiked(result.userNowLikes);
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo procesar tu 'Me gusta'.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Inesperado",
        description: `Ocurrió un error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const heartIconColor = currentUserLiked ? 'hsl(var(--destructive))' : 'currentColor';
  const heartIconFill = currentUserLiked ? 'hsl(var(--destructive))' : 'none';

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-border/70">
      <Avatar className="h-9 w-9">
        <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona"/>
        <AvatarFallback>{authorInitials || <UserCircle className="h-5 w-5"/>}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-card-foreground">{authorName}</p>
          <p className="text-xs text-muted-foreground" title={new Date(comment.created_at).toLocaleString('es-CL')}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-line">{comment.content}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleLike}
            disabled={isLiking || isLoadingInitialState || !loggedInUser}
            className={cn(
              "text-muted-foreground hover:text-destructive h-auto px-1.5 py-1 text-xs",
              currentUserLiked && "text-destructive"
            )}
            title={currentUserLiked ? "Quitar Me gusta" : "Me gusta"}
          >
            {isLiking || isLoadingInitialState ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Heart className="h-3.5 w-3.5" style={{ fill: heartIconFill, stroke: heartIconColor }}/>
            )}
            <span className="ml-1">{totalLikes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-auto px-1.5 py-1 text-xs" disabled>
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Responder
          </Button>
        </div>
      </div>
    </div>
  );
}
