// src/components/comments/CommentItem.tsx
'use client';

import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, UserCircle, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toggleCommentLikeAction, getCommentInteractionDetailsAction, addCommentAction } from '@/actions/commentActions';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface CommentItemProps {
  comment: CommentType;
  loggedInUser: StoredUserType | null;
  onCommentAdded: (newComment: CommentType) => void;
  isReply?: boolean;
  // Context props to know what we are commenting on
  propertyId?: string;
  propertySlug?: string;
  requestId?: string;
  requestSlug?: string;
}

export default function CommentItem({ 
  comment, 
  loggedInUser, 
  onCommentAdded,
  isReply = false,
  propertyId,
  propertySlug,
  requestId,
  requestSlug,
}: CommentItemProps) {
  const authorName = comment.author?.name || 'Usuario Anónimo';
  const authorAvatar = comment.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const { toast } = useToast();
  const [totalLikes, setTotalLikes] = useState(comment.upvotes);
  const [currentUserLiked, setCurrentUserLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, startReplyTransition] = useTransition();

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
  
  const handleAddReply = async () => {
    if (!loggedInUser?.id) {
        toast({ title: "Acción Requerida", description: "Debes iniciar sesión para responder.", variant: "destructive" });
        return;
    }
    if (!replyContent.trim()) {
        toast({ title: "Respuesta Vacía", description: "Por favor, escribe algo en tu respuesta.", variant: "destructive" });
        return;
    }

    startReplyTransition(async () => {
        const target = propertyId && propertySlug
            ? { propertyId, propertySlug }
            : { requestId, requestSlug };

        if (!target.propertyId && !target.requestId) {
            toast({ title: "Error", description: "Contexto de comentario no encontrado.", variant: "destructive" });
            return;
        }

        const result = await addCommentAction(
            { content: replyContent, parentId: comment.id },
            loggedInUser.id,
            target
        );
        
        if (result.success && result.comment) {
            toast({ title: "Respuesta Publicada", description: "Tu respuesta ha sido publicada." });
            const newCommentWithAuthor = {
                ...result.comment,
                author: { id: loggedInUser.id, name: loggedInUser.name, avatarUrl: loggedInUser.avatarUrl }
            };
            onCommentAdded(newCommentWithAuthor); // Bubble up new comment
            setReplyContent('');
            setIsReplying(false);
        } else {
            toast({ title: "Error al Responder", description: result.message || "No se pudo publicar tu respuesta.", variant: "destructive" });
        }
    });
};


  const heartIconColor = currentUserLiked ? 'hsl(var(--destructive))' : 'currentColor';
  const heartIconFill = currentUserLiked ? 'hsl(var(--destructive))' : 'none';

  return (
    <div className="flex flex-col">
      <div className="flex items-start space-x-3 py-3">
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
            {!isReply && (
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-auto px-1.5 py-1 text-xs" onClick={() => setIsReplying(!isReplying)}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" /> Responder
              </Button>
            )}
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="mt-2 ml-8 pl-4 flex items-start space-x-3">
            <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={loggedInUser?.avatarUrl} alt={loggedInUser?.name || 'Tú'} />
                <AvatarFallback>{loggedInUser?.name.substring(0, 2).toUpperCase() || <UserCircle />}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <Textarea
                    placeholder={`Respondiendo a ${authorName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={isSubmittingReply}
                    className="text-sm"
                    rows={2}
                />
                <div className="mt-2 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)} disabled={isSubmittingReply}>Cancelar</Button>
                    <Button size="sm" onClick={handleAddReply} disabled={isSubmittingReply || !replyContent.trim()}>
                        {isSubmittingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Responder
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
