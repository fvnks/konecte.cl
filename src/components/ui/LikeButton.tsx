// src/components/ui/LikeButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
import type { User as StoredUser, InteractionTypeEnum, ListingType } from '@/lib/types';
import Link from 'next/link';
import { Button as ShadButton } from './button'; // Renombrar para evitar conflicto
import { Loader2 } from 'lucide-react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  listingId: string;
  listingType: ListingType;
  className?: string;
}

const StyledWrapper = styled.div`
  button {
    padding: 0 20px 0 10px;
    border-radius: 10px;
    box-shadow: 0px 0px 5px 7px #e7413373;
    background-color: #e74133; // Color rojo por defecto del diseño original
    color: white;
    font-size: 17px;
    border: none;
    display: flex;
    align-items: center;
    transition: all .5s ease-in-out;
    letter-spacing: 2px;
    height: 50px; // Altura fija para consistencia
  }

  button:hover {
    background-color: #f54d3e;
    transition: all .5s ease-in-out;
    box-shadow: 0px 0px 5px 3px #e7413373;
  }

  button::before {
    content: "";
    background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNzUycHQiIGhlaWdodD0iNzUycHQiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDc1MiA3NTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8cGF0aCBkPSJtMzc2LjMyIDU1Mi4zYy0wLjM4NjcyIDAtMC43ODEyNS0wLjAxNTYyNS0xLjE3MTktMC4wNTA3ODEtMS4wNzgxLTAuMDc0MjE5LTIuMTM2Ny0wLjI2NTYyLTMuMTU2Mi0wLjU0Njg4LTIuNzMwNS0wLjU5Mzc1LTUuMjkzLTEuODUxNi03LjM0MzgtMy43ODEybC0xMzcuNTQtMTI5LjY2Yy00NC40NTMtNDEuOTAyLTQ5LjQ4LTExNS40Ni0xMS4yMTUtMTYzLjk3IDE5LjA4Mi0yNC4xODQgNDUuNzctMzguNjk1IDc1LjE1Mi00MC44NTUgMjguOTMtMi4xMTcyIDU2Ljg2MyA4LjAzMTIgNzguNjggMjguNTk4bDYuMjY1NiA1LjkwMjMgNi4yNjU2LTUuOTAyM2MyMS44MzItMjAuNTcgNDkuODA1LTMwLjY5MSA3OC42OTEtMjguNTk4IDI5LjM4MyAyLjE2NDEgNTYuMDY2IDE2LjY3NiA3NS4xNDUgNDAuODU1IDM4LjI2MiA0OC41MTIgMzMuMjM0IDEyMi4wNy0xMS4yMTUgMTYzLjk3bC0xMzcuNTQgMTI5LjY3Yy0yLjk5MjIgMi44MTY0LTYuOTM3NSA0LjM3NS0xMS4wMjMgNC4zNzV6bS03Ny44MTItMzA3LjAxYy0xLjY5NTMgMC0zLjM5NDUgMC4wNjI1LTUuMTAxNiAwLjE4NzUtMjAuMjgxIDEuNDk2MS0zOC44NTIgMTEuNjkxLTUyLjI4MSAyOC43MTEtMjguMjE1IDM1Ljc3My0yNC42MTMgODkuOTEgOC4wMjczIDEyMC42OGwxMjYuODQgMTE5LjU5IDEyNi44NC0xMTkuNTljMzIuNjQ1LTMwLjc3MyAzNi4yNDYtODQuOTEgOC4wMjczLTEyMC42OC0xMy40MjItMTcuMDItMzEuOTg0LTI3LjIxNS01Mi4yNy0yOC43MTEtMTkuODI4LTEuNDY0OC0zOS4xMDUgNS42MjExLTU0LjI4NSAxOS45MzRsLTE3LjI4NSAxNi4yOTNjLTYuMTk1MyA1LjgzOTgtMTUuODU5IDUuODM5OC0yMi4wNDcgMGwtMTcuMjg1LTE2LjI5M2MtMTMuODcxLTEzLjA3OC0zMS4xNzYtMjAuMTE3LTQ5LjE4LTIwLjExN3oiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==");
    background-size: 100%;
    background-repeat: no-repeat;
    color: transparent;
    position: relative;
    width: 50px;
    height: 50px;
    display: block;
    margin-right: 5px;
    transition: all .9s ease-in-out;
  }

  button:hover::before {
    background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNzUycHQiIGhlaWdodD0iNzUycHQiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDc1MiA3NTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8cGF0aCBkPSJtMzY5Ljg0IDU1MC4yOGMwLjQ3MjY2IDAuNDcyNjYgMC45NDUzMSAwLjQ3MjY2IDAuOTQ1MzEgMC45NDUzMSA2NS4zNTUtNTEuNjIxIDE5My43LTE0OC4yMyAxOTMuNy0yNDkuMTEgMC01NS44ODMtNDUuNDY1LTEwMS4zNS0xMDEuMzUtMTAxLjM1LTM5Ljc4MSAwLTc0LjM1MiAyMy4yMDctOTAuOTI2IDU2LjgyOC0wLjQ3MjY2IDAuOTQ1MzEtMS40MjE5IDMuMzE2NC0xLjQyMTkgMy4zMTY0cy0wLjk0NTMxLTEuODk0NS0wLjk0NTMxLTIuMzY3MmMtMTYuMTAyLTM0LjA5LTUwLjY3Mi01Ny43Ny05MC45MjYtNTcuNzctNTUuODgzIDAtMTAxLjM1IDQ1LjQ2MS0xMDEuMzUgMTAxLjM0IDAgMTAxLjgyIDEyNy44NyAxOTcuMDEgMTkyLjI3IDI0OC4xNnoiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==");
    transition: all .9s ease-in-out;
    transform: rotate(-1turn);
  }

  button.liked {
    background-color: #f54d3e; /* Color cuando está "liked" */
    box-shadow: 0px 0px 5px 3px #e7413373;
  }

  button.liked::before {
    background-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNzUycHQiIGhlaWdodD0iNzUycHQiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDc1MiA3NTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8cGF0aCBkPSJtMzY5Ljg0IDU1MC4yOGMwLjQ3MjY2IDAuNDcyNjYgMC45NDUzMSAwLjQ3MjY2IDAuOTQ1MzEgMC45NDUzMSA2NS4zNTUtNTEuNjIxIDE5My43LTE0OC4yMyAxOTMuNy0yNDkuMTEgMC01NS44ODMtNDUuNDY1LTEwMS4zNS0xMDEuMzUtMTAxLjM1LTM5Ljc4MSAwLTc0LjM1MiAyMy4yMDctOTAuOTI2IDU2LjgyOC0wLjQ3MjY2IDAuOTQ1MzEtMS40MjE5IDMuMzE2NC0xLjQyMTkgMy4zMTY0cy0wLjk0NTMxLTEuODk0NS0wLjk0NTMxLTIuMzY3MmMtMTYuMTAyLTM0LjA5LTUwLjY3Mi01Ny43Ny05MC45MjYtNTcuNzctNTUuODgzIDAtMTAxLjM1IDQ1LjQ2MS0xMDEuMzUgMTAxLjM0IDAgMTAxLjgyIDEyNy44NyAxOTcuMDEgMTkyLjI3IDI0OC4xNnoiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==");
  }
`;

export default function LikeButton({ listingId, listingType, className }: LikeButtonProps) {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // Para el estado visual del like

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
        interactionType: newCheckedState ? 'like' : 'skip', 
      });

      if (result.success) {
        setIsChecked(newCheckedState); // Actualizar el estado visual solo si la acción fue exitosa
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
        // No revertimos isChecked aquí, ya que el backend es la fuente de verdad.
        // Considerar re-sincronizar el estado `isChecked` desde la base de datos si es necesario.
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

  return (
    <StyledWrapper className={cn(className)}>
      <button 
        onClick={handleLike} 
        disabled={isInteracting || !loggedInUser}
        className={cn(isChecked && 'liked')}
        title={!loggedInUser ? "Inicia sesión para dar Me Gusta" : (isChecked ? "Quitar Me Gusta" : "Me Gusta")}
        aria-pressed={isChecked}
      >
        {isInteracting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <span>Me Gusta</span>}
      </button>
    </StyledWrapper>
  );
}
