// src/components/ui/LikeButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
import type { User as StoredUser, InteractionTypeEnum, ListingType } from '@/lib/types';
import Link from 'next/link';
import { Button } from './button'; // Para el botón de login en el toast
import { Loader2 } from 'lucide-react';

interface LikeButtonProps {
  listingId: string;
  listingType: ListingType;
  className?: string;
}

export default function LikeButton({ listingId, listingType, className }: LikeButtonProps) {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // Para controlar el estado del checkbox visualmente

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
      setIsChecked(false); // Desmarcar si el usuario no está logueado
      return;
    }

    if (isInteracting) return;
    setIsInteracting(true);

    try {
      // El interactionType siempre será 'like' para este botón
      const result = await recordUserListingInteractionAction(loggedInUser.id, {
        listingId,
        listingType,
        interactionType: 'like',
      });

      if (result.success) {
        setIsChecked(true); // Marcar como "checked" visualmente
        if (result.matchDetails?.matchFound && result.matchDetails.conversationId) {
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
            title: "'Me Gusta' Registrado",
            description: result.message || `Tu 'Me Gusta' ha sido registrado.`,
            duration: 3000,
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.message || `No se pudo registrar tu 'Me Gusta'.`,
          variant: "destructive",
        });
        setIsChecked(false); // Revertir si falla
      }
    } catch (error: any) {
      toast({
        title: "Error Inesperado",
        description: `No se pudo registrar tu 'Me Gusta': ${error.message}`,
        variant: "destructive",
      });
      setIsChecked(false); // Revertir si falla
    } finally {
      setIsInteracting(false);
    }
  };
  
  // El input checkbox ahora es controlado. Al hacer clic, se llama a handleLike.
  // Si handleLike tiene éxito, setIsChecked(true) se llamará.
  // Si falla o no está logueado, setIsChecked(false) se llamará.

  return (
    <label className={className}>
      <input
        className="peer hidden"
        type="checkbox"
        checked={isChecked}
        onChange={handleLike} // Llamar a handleLike en el onChange
        disabled={isInteracting || !loggedInUser}
        title={!loggedInUser ? "Inicia sesión para dar Me Gusta" : "Me Gusta"}
      />
      <div className="group flex w-fit cursor-pointer items-center gap-2 overflow-hidden border rounded-full border-pink-700 fill-none p-2 px-3 font-extrabold text-pink-500 transition-all active:scale-90 peer-checked:bg-pink-100 peer-checked:fill-pink-500 peer-checked:text-pink-700 peer-checked:hover:text-pink-700 peer-checked:hover:border-pink-800">
        {isInteracting ? (
            <Loader2 className="size-5 animate-spin" />
        ) : (
            <>
                <div className="z-10 transition group-hover:translate-x-4">Me Gusta</div>
                <svg className="size-6 transition duration-500 group-hover:scale-[1100%]" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
            </>
        )}
      </div>
    </label>
  );
}
