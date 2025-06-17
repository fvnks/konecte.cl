// src/components/ui/LikeButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
import type { User as StoredUser, InteractionTypeEnum, ListingType } from '@/lib/types';
import Link from 'next/link';
import { Button } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  listingId: string;
  listingType: ListingType;
  className?: string;
}

export default function LikeButton({ listingId, listingType, className }: LikeButtonProps) {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

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
        description: "Debes iniciar sesión para dar 'Me Gusta'.",
        action: <Button variant="link" size="sm" asChild><Link href="/auth/signin">Iniciar Sesión</Link></Button>
      });
      setIsChecked(false);
      return;
    }

    if (isInteracting) return;
    setIsInteracting(true);

    // Toggle isChecked state optimistically for UI feedback
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);

    try {
      const result = await recordUserListingInteractionAction(loggedInUser.id, {
        listingId,
        listingType,
        interactionType: newCheckedState ? 'like' : 'skip', // Send 'skip' if unliking, 'like' if liking
      });

      if (result.success) {
        if (newCheckedState && result.matchDetails?.matchFound && result.matchDetails.conversationId) {
          toast({
            title: "¡Es un Match Mutuo!",
            description: `${result.message} Revisa tus mensajes.`,
            duration: 7000,
            action: (
              <Button variant="link" size="sm" asChild>
                <Link href={`/dashboard/messages/${result.matchDetails.conversationId}`}>
                  Ver Chat
                </Link>
              </Button>
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
        setIsChecked(!newCheckedState); // Revert UI on error
      }
    } catch (error: any) {
      toast({
        title: "Error Inesperado",
        description: `No se pudo registrar tu preferencia: ${error.message}`,
        variant: "destructive",
      });
      setIsChecked(!newCheckedState); // Revert UI on error
    } finally {
      setIsInteracting(false);
    }
  };

  return (
    <label className={className}>
      <input
        className="peer hidden"
        type="checkbox"
        checked={isChecked}
        onChange={handleLike}
        disabled={isInteracting || !loggedInUser}
        title={!loggedInUser ? "Inicia sesión para dar Me Gusta" : "Me Gusta"}
      />
      <div className={cn(
        "group flex w-fit cursor-pointer items-center gap-2 overflow-hidden border rounded-full border-pink-700 p-2 px-3 font-extrabold text-pink-500 transition-all duration-300 ease-in-out active:scale-90",
        // Estilos cuando está marcado (checked)
        "peer-checked:bg-pink-100 peer-checked:text-pink-700",
        // Estilos de hover general (independiente de si está checked o no)
        // Al hacer hover, el fondo se vuelve rosa oscuro, el texto blanco, y el gap se elimina.
        "group-hover:bg-pink-500 group-hover:text-white group-hover:gap-0 group-hover:justify-center",
        className
      )}>
        {isInteracting ? (
            <Loader2 className="size-5 animate-spin" />
        ) : (
            <>
                {/* Texto "Me Gusta" */}
                <div className={cn(
                  "z-10 transition-all duration-300 ease-in-out",
                  // En hover, el texto se expande y se centra
                  "group-hover:flex-grow group-hover:text-center"
                )}>
                  Me Gusta
                </div>
                {/* SVG del Corazón */}
                <svg
                  className={cn(
                    "size-6 shrink-0 transition-all duration-300 ease-in-out",
                    // En hover, el SVG desaparece y no ocupa espacio
                    "group-hover:w-0 group-hover:h-0 group-hover:opacity-0 group-hover:m-0 group-hover:p-0"
                  )}
                  stroke="currentColor" // Hereda el color del texto padre (text-pink-500 o group-hover:text-white)
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none" // Asegurarse de que el fill sea none si se usa stroke
                >
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
            </>
        )}
      </div>
    </label>
  );
}
