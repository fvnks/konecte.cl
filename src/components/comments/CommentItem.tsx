
// src/components/comments/CommentItem.tsx
'use client';

import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, UserCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import styled from 'styled-components';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toggleCommentLikeAction, getCommentInteractionDetailsAction } from '@/actions/commentActions';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentType;
  loggedInUser: StoredUserType | null;
}

const StyledCommentItemWrapper = styled.div`
  display: grid;
  grid-template-columns: 35px 1fr; 
  gap: 1rem; 

  .comment-react {
    width: 35px;
    height: fit-content;
    display: flex;
    flex-direction: column; 
    align-items: center;
    margin: 0;
    background-color: hsl(var(--secondary) / 0.7);
    border-radius: 0.375rem; 
    padding: 0.25rem 0; 
  }

  .comment-react button {
    width: 30px; 
    height: 30px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: 0;
    outline: none;
    color: hsl(var(--muted-foreground));
    transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
    border-radius: 50%; 
    cursor: pointer;
  }
  .comment-react button.liked svg {
    fill: hsl(var(--destructive)); /* Use destructive for liked heart, same as producthunt */
    stroke: hsl(var(--destructive));
  }

  .comment-react button:hover:not(:disabled) {
    background-color: hsl(var(--destructive) / 0.1);
    color: hsl(var(--destructive));
  }
  .comment-react button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .comment-react hr {
    width: 70%;
    height: 1px;
    background-color: hsl(var(--border));
    margin: 0.25rem auto; 
    border: 0;
  }

  .comment-react span { 
    height: 20px; 
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
    font-size: 0.75rem; 
    font-weight: 600;
    color: hsl(var(--muted-foreground));
  }

  .comment-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; 
    padding: 0;
    margin: 0;
  }

  .comment-container .user {
    display: flex; 
    align-items: center;
    gap: 0.625rem; 
  }

  .comment-container .user .user-pic-wrapper { 
    width: 36px; 
    height: 36px;
    position: relative;
  }
  
  .comment-container .user .user-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.125rem; 
  }

  .comment-container .user .user-info span { 
    font-weight: 600; 
    font-size: 0.875rem; 
    color: hsl(var(--card-foreground));
  }

  .comment-container .user .user-info p { 
    font-weight: 400; 
    font-size: 0.75rem; 
    color: hsl(var(--muted-foreground));
  }

  .comment-container .comment-content {
    font-size: 0.875rem; 
    line-height: 1.6; 
    font-weight: 400; 
    color: hsl(var(--foreground) / 0.9);
    white-space: pre-line;
    padding: 0.5rem 0.75rem; 
    background-color: hsl(var(--background)); 
    border-radius: 0.375rem; 
    border: 1px solid hsl(var(--border) / 0.7);
  }
  
  .comment-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem; 
    margin-top: 0.5rem; 
  }
  .comment-actions button {
    font-size: 0.75rem; 
    padding: 0.25rem 0.5rem; 
    height: auto;
    color: hsl(var(--muted-foreground));
  }
  .comment-actions button:hover {
    color: hsl(var(--primary));
    background-color: hsl(var(--accent) / 0.1);
  }
`;

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
  
  const heartIconColor = currentUserLiked ? 'hsl(var(--destructive))' : 'currentColor'; // currentcolor from button
  const heartIconFill = currentUserLiked ? 'hsl(var(--destructive))' : 'none';

  return (
    <StyledCommentItemWrapper>
      <div className="comment-react">
        <button 
          onClick={handleToggleLike} 
          disabled={isLiking || isLoadingInitialState || !loggedInUser}
          className={cn(currentUserLiked && "liked")}
          title={currentUserLiked ? "Quitar Me gusta" : "Me gusta"}
        >
          {isLiking || isLoadingInitialState ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" style={{ fill: heartIconFill, stroke: heartIconColor }}/>
          )}
        </button>
        <hr />
        <span>{totalLikes}</span>
      </div>
      <div className="comment-container">
        <div className="user">
          <div className="user-pic-wrapper">
            <Avatar className="h-9 w-9"> 
              <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona"/>
              <AvatarFallback>{authorInitials || <UserCircle className="h-5 w-5" />}</AvatarFallback>
            </Avatar>
          </div>
          <div className="user-info">
            <span>{authorName}</span>
            <p title={new Date(comment.created_at).toLocaleString('es-CL')}>
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>
        <p className="comment-content">
          {comment.content}
        </p>
        <div className="comment-actions">
          <Button variant="ghost" size="sm" disabled>
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Responder
          </Button>
        </div>
      </div>
    </StyledCommentItemWrapper>
  );
}
