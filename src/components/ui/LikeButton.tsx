// src/components/ui/LikeButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
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

// Adjusted StyledWrapper based on user's new design
const StyledWrapper = styled.div`
  .button-container {
    position: relative;
    display: inline-block;
  }

  .button {
    cursor: pointer;
    width: auto; /* Adjusted for content */
    height: 40px; /* Adjusted height */
    display: flex;
    align-items: center;
    background-color: hsl(var(--card)); /* Themed */
    border: 1px solid hsl(var(--border)); /* Themed border */
    box-shadow: 0px 3px 0px rgba(45, 45, 45, 0.1); /* Adjusted shadow */
    overflow: hidden;
    border-radius: 0.5em;
    transition: all 0.2s ease;
    padding: 0 8px; /* Added padding for spacing */
  }

  #fontlikebutton {
    font-family: "Trebuchet MS", sans-serif;
    font-weight: 600;
    font-size: 14px; /* Adjusted font size */
    color: hsl(var(--primary)); /* Themed */
    margin-left: 0.3em; /* Adjusted margin */
    transition: transform 0.2s ease, color 0.2s ease; /* Added color transition */
  }

  .button:hover {
    background-color: hsl(var(--primary)); /* Themed hover */
  }

  .button:hover svg#likeimg {
    stroke: hsl(var(--primary-foreground)); /* Themed icon color on hover */
    transform: scale(1.3) translateX(30%); /* Adjusted transform */
  }

  .button:hover #fontlikebutton {
    color: hsl(var(--primary-foreground)); /* Themed text color on hover */
    transform: translateX(60%); /* Adjusted transform */
  }

  .button:active {
    transform: scale(0.95) translateY(2px); /* Adjusted active transform */
    box-shadow: 0px 1px 0px 0px hsla(var(--primary), 0.5); /* Themed active shadow */
  }

  .button:active svg#likeimg {
    /* Keeping transform from hover, adding rotation */
    stroke: hsl(var(--primary-foreground));
    transform: scale(1.3) translateX(25%) rotate(-15deg); /* Adjusted active icon transform */
  }
  
  .button:active #fontlikebutton {
    color: hsl(var(--primary-foreground));
    transform: translateX(60%);
  }

  svg#likeimg {
    transition: all 0.2s ease;
    stroke: hsl(var(--primary)); /* Initial themed stroke */
    width: 20px; /* Adjusted SVG size */
    height: 20px; /* Adjusted SVG size */
  }

  #rightpart {
    flex-grow: 1; /* Allow right part to take remaining space */
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 8px; /* Padding for right part */
  }

  #leftpart {
    color: hsl(var(--primary-foreground)); /* Themed */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: "Trebuchet MS", sans-serif;
    font-weight: 600;
    font-size: 12px; /* Adjusted font size for numbers */
    background-color: hsl(var(--primary)); /* Themed */
    width: 36px; /* Adjusted width */
    height: 100%;
    transition: all 0.2s ease;
    border-right: 1px solid hsla(var(--primary-foreground), 0.2);
  }

  .button:hover #leftpart {
    color: hsl(var(--primary)); /* Themed */
    background: hsl(var(--card)); /* Themed */
    border-right-color: hsl(var(--primary));
  }

  #currentnumber {
    transform: translateY(50%);
    transition: all 0.2s ease;
  }

  #movenumber {
    transform: translateY(-200%); /* Start off-screen */
    transition: all 0.2s ease;
  }

  /* Styles for when checkbox is checked (liked state) */
  input#checknumber:checked ~ .button #currentnumber {
    transform: translateY(200%); /* Move current number off-screen */
  }

  input#checknumber:checked ~ .button #movenumber {
    transform: translateY(-50%); /* Move new number into view */
  }
  
  /* Change appearance of left part when liked */
  input#checknumber:checked ~ .button #leftpart {
    background-color: hsl(var(--accent)); /* Example: use accent color when liked */
    color: hsl(var(--accent-foreground));
  }
  input#checknumber:checked ~ .button:hover #leftpart {
    background-color: hsl(var(--accent) / 0.9);
    color: hsl(var(--accent-foreground));
  }

  /* Disabled state */
  .button.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .button.disabled:hover {
    background-color: hsl(var(--card)); 
  }
  .button.disabled:hover svg#likeimg {
    stroke: hsl(var(--primary));
    transform: none;
  }
  .button.disabled:hover #fontlikebutton {
    color: hsl(var(--primary));
    transform: none;
  }
  .button.disabled:hover #leftpart {
    color: hsl(var(--primary-foreground));
    background: hsl(var(--primary));
  }
`;

export default function LikeButton({ listingId, listingType, className }: LikeButtonProps) {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // Local state for checkbox

  // Static like numbers for demo animation
  const currentLikes = 24; 
  const nextLikes = currentLikes + 1;

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

  const handleLike = async () => {
    if (!loggedInUser) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para interactuar.",
        action: <ShadButton variant="link" size="sm" asChild><Link href="/auth/signin">Iniciar Sesión</Link></ShadButton>
      });
      return;
    }

    if (isInteracting) return;
    setIsInteracting(true);

    const newCheckedState = !isChecked;

    try {
      const result = await recordUserListingInteractionAction(loggedInUser.id, {
        listingId,
        listingType,
        interactionType: newCheckedState ? 'like' : 'skip', // 'skip' if unliking, or could be 'unlike' if you add that
      });

      if (result.success) {
        setIsChecked(newCheckedState); // Update local checkbox state
        if (newCheckedState && result.matchDetails?.matchFound && result.matchDetails.conversationId) {
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
        } else {
          toast({
            title: newCheckedState ? "'Me Gusta' Registrado" : "Preferencia Actualizada",
            description: result.message || `Tu preferencia ha sido registrada.`,
            duration: 3000,
          });
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
      setIsInteracting(false);
    }
  };

  const buttonDisabled = isInteracting || !loggedInUser;

  return (
    <StyledWrapper className={cn(className)}>
      <div className="button-container">
        <input 
          hidden 
          id={`checknumber-${listingId}`} // Unique ID for each button instance
          type="checkbox" 
          checked={isChecked} 
          onChange={handleLike} // Let label handle click, checkbox reflects state
          disabled={buttonDisabled}
        />
        <label 
          htmlFor={`checknumber-${listingId}`} 
          className={cn("button", buttonDisabled && "disabled")}
          onClick={(e) => { if(buttonDisabled) e.preventDefault(); else handleLike(); }}
          title={!loggedInUser ? "Inicia sesión para dar Me Gusta" : (isChecked ? "Quitar Me Gusta" : "Me Gusta")}
          aria-pressed={isChecked}
          tabIndex={buttonDisabled ? -1 : 0} // Make it focusable only if not disabled
          onKeyDown={(e) => {
            if (!buttonDisabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleLike();
            }
          }}
        >
          <div id="leftpart">
            {isInteracting && isChecked ? ( // Show loader only when unliking and interacting
                 <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <p id="currentnumber">{currentLikes}</p>
                <p id="movenumber">{nextLikes}</p>
              </>
            )}
          </div>
          <div id="rightpart">
            {isInteracting && !isChecked ? ( // Show loader only when liking and interacting
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg id="likeimg" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2.5} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                <div id="fontlikebutton">Me Gusta</div>
              </>
            )}
          </div>
        </label>
      </div>
    </StyledWrapper>
  );
}

