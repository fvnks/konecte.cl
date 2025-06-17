// src/components/ui/LikeButton.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recordUserListingInteractionAction, getListingInteractionDetailsAction } from '@/actions/interactionActions';
import type { User as StoredUser, InteractionTypeEnum, ListingType } from '@/lib/types';
import Link from 'next/link';
import { Button as ShadButton } from './button'; // For toast action
import { Loader2 } from 'lucide-react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  listingId: string;
  listingType: ListingType;
  className?: string;
}

const StyledWrapper = styled.div`
  .button-container {
    position: relative;
    display: inline-block; 
  }

  .button {
    cursor: pointer;
    width: auto; 
    min-width: 100px; /* Adjusted: from 130px to 100px */
    height: 36px; /* Adjusted: from 40px to 36px */
    display: flex;
    align-items: center;
    background-color: hsl(var(--card)); 
    border: 1px solid hsl(var(--border));
    box-shadow: 0px 2px 0px rgba(45, 45, 45, 0.05); /* Adjusted shadow */
    overflow: hidden;
    border-radius: 0.375rem; /* md */
    transition: all 0.2s ease;
    padding: 0; 
  }

  #fontlikebutton {
    font-family: "Trebuchet MS", sans-serif;
    font-weight: 600;
    font-size: 12px; /* Adjusted: from 14px to 12px */
    color: hsl(var(--primary)); 
    margin-left: 0.2em; /* Adjusted: from 0.3em to 0.2em */
    transition: transform 0.3s ease-out, opacity 0.3s ease-out, color 0.2s ease;
  }

  .button:hover {
    background-color: hsl(var(--primary)); 
  }

  .button:hover svg#likeimg {
    stroke: hsl(var(--primary-foreground)); 
    transform: scale(1.3) translateX(calc( (var(--min-width, 100px) - var(--left-part-width, 28px) - var(--icon-size, 15px) - 8px - 4px) / 2 + 100%)); /* Adjust hover transform */
  }

  .button:hover #fontlikebutton {
    transform: translateX(200%); 
    opacity: 0;
  }

  .button:active {
    transform: scale(0.95) translateY(1px); /* Adjusted active effect */
    box-shadow: 0px 1px 0px 0px hsla(var(--primary) / 0.5); 
  }

  .button:active svg#likeimg {
    stroke: hsl(var(--primary-foreground));
    transform: scale(1.3) translateX(calc( (var(--min-width, 100px) - var(--left-part-width, 28px) - var(--icon-size, 15px) - 8px - 4px) / 2 + 100%)) rotate(-5deg); /* Minor rotation */
  }
  
  .button:active #fontlikebutton {
    transform: translateX(200%);
    opacity: 0;
  }

  svg#likeimg {
    transition: transform 0.3s ease-out, stroke 0.2s ease; 
    stroke: hsl(var(--primary)); 
    width: 15px; /* Adjusted: from 20px to 15px */
    height: 15px; /* Adjusted: from 20px to 15px */
  }

  #rightpart {
    flex-grow: 1; 
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 8px; /* Adjusted: from 0 10px to 0 8px */
    transition: background-color 0.2s ease;
    /* Define CSS variables for dynamic calculation in hover transform */
    --min-width: 100px;
    --left-part-width: 28px;
    --icon-size: 15px;
  }

  #leftpart {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: "Trebuchet MS", sans-serif;
    font-weight: 600;
    font-size: 11px; /* Adjusted: from 12px to 11px */
    background-color: hsl(var(--primary)); 
    color: hsl(var(--primary-foreground));
    width: 28px; /* Adjusted: from 36px to 28px */
    height: 100%;
    transition: all 0.2s ease;
    border-right: 1px solid hsla(var(--primary) / 0.2); 
  }

  .button:hover #leftpart {
    color: hsl(var(--primary)); 
    background: hsl(var(--card)); 
    border-right-color: hsl(var(--primary) / 0.3); 
  }

  #currentnumber, #movenumber {
    position: absolute; /* Allows them to overlap for the transition */
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  }
  #currentnumber {
    transform: translateY(0%);
    opacity: 1;
  }
  #movenumber {
    transform: translateY(100%);
    opacity: 0;
  }

  input#checknumber:checked ~ .button #currentnumber {
    transform: translateY(-100%);
    opacity: 0;
  }
  input#checknumber:checked ~ .button #movenumber {
    transform: translateY(0%);
    opacity: 1;
  }
  
  input#checknumber:checked ~ .button #leftpart {
    background-color: hsl(var(--accent)); 
    color: hsl(var(--accent-foreground));
    border-right-color: hsla(var(--accent-foreground) / 0.2);
  }
  input#checknumber:checked ~ .button:hover #leftpart {
    background-color: hsl(var(--card)); 
    color: hsl(var(--accent)); 
    border-right-color: hsl(var(--accent) / 0.3);
  }
  
  input#checknumber:checked ~ .button svg#likeimg {
    stroke: hsl(var(--accent)); 
  }
  input#checknumber:checked ~ .button #fontlikebutton {
    color: hsl(var(--accent));
  }

  input#checknumber:checked ~ .button:hover svg#likeimg {
    stroke: hsl(var(--primary-foreground)); /* Should be accent-foreground if button bg is accent on hover? */
    transform: scale(1.3) translateX(calc( (var(--min-width, 100px) - var(--left-part-width, 28px) - var(--icon-size, 15px) - 8px - 4px) / 2 + 100%)); 
  }
  input#checknumber:checked ~ .button:hover #fontlikebutton {
    color: hsl(var(--primary-foreground)); /* Similarly, should this be accent-foreground? */
    transform: translateX(200%); 
    opacity: 0;
  }

  .button.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    background-color: hsl(var(--muted)); 
    border-color: hsl(var(--border));
    box-shadow: none;
  }
  .button.disabled:hover {
    background-color: hsl(var(--muted)); 
  }
  .button.disabled svg#likeimg,
  .button.disabled:hover svg#likeimg {
    stroke: hsl(var(--muted-foreground));
    transform: none;
  }
  .button.disabled #fontlikebutton,
  .button.disabled:hover #fontlikebutton {
    color: hsl(var(--muted-foreground));
    transform: none;
    opacity: 1;
  }
  .button.disabled #leftpart,
  .button.disabled:hover #leftpart {
    color: hsl(var(--muted-foreground));
    background: hsl(var(--muted) / 0.5);
    border-right-color: hsl(var(--border));
  }
   input#checknumber:checked ~ .button.disabled svg#likeimg,
   input#checknumber:checked ~ .button.disabled:hover svg#likeimg {
    stroke: hsl(var(--muted-foreground));
  }
   input#checknumber:checked ~ .button.disabled #fontlikebutton,
   input#checknumber:checked ~ .button.disabled:hover #fontlikebutton {
    color: hsl(var(--muted-foreground));
    opacity: 1;
  }
  input#checknumber:checked ~ .button.disabled #leftpart,
  input#checknumber:checked ~ .button.disabled:hover #leftpart {
    background: hsl(var(--muted) / 0.5); 
    color: hsl(var(--muted-foreground));
  }
`;

export default function LikeButton({ listingId, listingType, className }: LikeButtonProps) {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isProcessingServerAction, setIsProcessingServerAction] = useState(false);
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);

  const [currentTotalLikes, setCurrentTotalLikes] = useState(0);
  const [currentUserHasLiked, setCurrentUserHasLiked] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user for LikeButton:", error);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchInitialState() {
      if (!listingId || !listingType) return;
      setIsLoadingInitialState(true);
      try {
        const details = await getListingInteractionDetailsAction(listingId, listingType, loggedInUser?.id);
        setCurrentTotalLikes(details.totalLikes);
        setCurrentUserHasLiked(details.currentUserInteraction === 'like');
      } catch (error) {
        console.error("Error fetching initial like state:", error);
      } finally {
        setIsLoadingInitialState(false);
      }
    }
    fetchInitialState();
  }, [listingId, listingType, loggedInUser?.id]);


  const handleLikeToggle = async () => {
    if (!loggedInUser) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para interactuar.",
        action: <ShadButton variant="link" size="sm" asChild><Link href="/auth/signin">Iniciar Sesión</Link></ShadButton>
      });
      return;
    }

    if (isProcessingServerAction || isLoadingInitialState) return;
    setIsProcessingServerAction(true);

    const newInteractionType = currentUserHasLiked ? 'skip' : 'like';

    try {
      const result = await recordUserListingInteractionAction(loggedInUser.id, {
        listingId,
        listingType,
        interactionType: newInteractionType,
      });

      if (result.success) {
        setCurrentTotalLikes(result.newTotalLikes ?? currentTotalLikes);
        setCurrentUserHasLiked(result.newInteractionType === 'like');
        
        if (newInteractionType === 'like' && result.matchDetails?.matchFound && result.matchDetails.conversationId) {
          toast({
            title: "¡Es un Match Mutuo!",
            description: `${result.message} Revisa tus mensajes.`,
            duration: 7000,
            action: (
              <ShadButton variant="link" size="sm" asChild>
                <Link href={`/dashboard/messages/${result.matchDetails.conversationId}`}>
                  Ver Chat
                </Link>
              </ShadButton>
            )
          });
          window.dispatchEvent(new CustomEvent('messagesUpdated'));
        }
      } else {
         toast({
            title: "Error",
            description: result.message || `No se pudo registrar tu preferencia.`,
            variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Inesperado",
        description: `No se pudo registrar tu preferencia: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingServerAction(false);
    }
  };

  const buttonDisabled = isProcessingServerAction || isLoadingInitialState || !loggedInUser;
  const displayLikes = currentTotalLikes;
  const nextLikesNumber = currentUserHasLiked ? displayLikes -1 : displayLikes + 1;


  return (
    <StyledWrapper className={cn(className)}>
      <div className="button-container">
        <input 
          hidden 
          id={`checknumber-${listingId}-${listingType}`} 
          type="checkbox" 
          checked={currentUserHasLiked} 
          onChange={() => { /* Logic handled by label's onClick */ }}
          disabled={buttonDisabled}
        />
        <label 
          htmlFor={`checknumber-${listingId}-${listingType}`}
          className={cn("button", buttonDisabled && "disabled")}
          onClick={(e) => { if(buttonDisabled) e.preventDefault(); else handleLikeToggle(); }}
          title={!loggedInUser ? "Inicia sesión para dar Me Gusta" : (currentUserHasLiked ? "Quitar Me Gusta" : "Me Gusta")}
          aria-pressed={currentUserHasLiked}
          tabIndex={buttonDisabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!buttonDisabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleLikeToggle();
            }
          }}
        >
          <div id="leftpart">
            {isProcessingServerAction || isLoadingInitialState ? (
                 <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <p id="currentnumber">{displayLikes}</p>
                <p id="movenumber">{nextLikesNumber < 0 ? 0 : nextLikesNumber}</p>
              </>
            )}
          </div>
          <div id="rightpart">
            <svg id="likeimg" strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <div id="fontlikebutton">Me Gusta</div>
          </div>
        </label>
      </div>
    </StyledWrapper>
  );
}
