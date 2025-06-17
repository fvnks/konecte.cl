// src/components/comments/CommentItem.tsx
'use client';

import type { Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import styled from 'styled-components';

interface CommentItemProps {
  comment: CommentType;
}

const StyledCommentItemWrapper = styled.div`
  display: grid;
  grid-template-columns: 35px 1fr; // Columna para "reacts" y columna para contenido
  gap: 1rem; // Tailwind gap-4
  // padding-bottom: 1rem; // Espacio si no hay borde
  // border-bottom: 1px solid hsl(var(--border) / 0.5); // Borde sutil

  // &:last-child {
  //   border-bottom: none;
  //   padding-bottom: 0;
  // }

  .comment-react {
    width: 35px;
    height: fit-content;
    display: flex;
    flex-direction: column; // Apilados
    align-items: center;
    margin: 0;
    background-color: hsl(var(--secondary) / 0.7);
    border-radius: 0.375rem; // Tailwind rounded-md
    padding: 0.25rem 0; // Espacio interno vertical
  }

  .comment-react button {
    width: 30px; // Ajustar tamaño
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
    border-radius: 50%; // Botones redondos
  }

  .comment-react button:hover {
    background-color: hsl(var(--accent) / 0.1);
    color: hsl(var(--accent-foreground));
  }
  
  // Efecto ripple (simplificado o eliminado por ahora)
  /* .comment-react button:after { ... } */
  /* .comment-react button:hover:after { animation: ripple 0.6s ease-in-out forwards; } */

  .comment-react hr {
    width: 70%;
    height: 1px;
    background-color: hsl(var(--border));
    margin: 0.25rem auto; // Tailwind m-1
    border: 0;
  }

  .comment-react span { // Contador de likes
    height: 20px; // Ajustar
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
    font-size: 0.75rem; // Tailwind text-xs
    font-weight: 600;
    color: hsl(var(--muted-foreground));
  }

  .comment-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; // Tailwind gap-2
    padding: 0;
    margin: 0;
  }

  .comment-container .user {
    display: flex; // Cambiado a flex para mejor alineación del avatar y la info
    align-items: center;
    gap: 0.625rem; // Tailwind gap-2.5
  }

  .comment-container .user .user-pic-wrapper { // Envoltorio para el Avatar de ShadCN
    width: 36px; // Ajustar
    height: 36px;
    position: relative;
  }
  
  /* La bolita verde online puede ser compleja de añadir con el Avatar de ShadCN sin CSS adicional o un componente wrapper */
  /* .comment-container .user .user-pic:after { ... } */

  .comment-container .user .user-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.125rem; // Tailwind gap-0.5
  }

  .comment-container .user .user-info span { // Nombre de usuario
    font-weight: 600; // Tailwind font-semibold
    font-size: 0.875rem; // Tailwind text-sm
    color: hsl(var(--card-foreground));
  }

  .comment-container .user .user-info p { // Fecha
    font-weight: 400; // Tailwind font-normal
    font-size: 0.75rem; // Tailwind text-xs
    color: hsl(var(--muted-foreground));
  }

  .comment-container .comment-content {
    font-size: 0.875rem; // Tailwind text-sm
    line-height: 1.6; // Tailwind leading-relaxed
    font-weight: 400; // Tailwind font-normal
    color: hsl(var(--foreground) / 0.9);
    white-space: pre-line;
    padding: 0.5rem 0.75rem; // Tailwind p-2 o p-3
    background-color: hsl(var(--background)); // Un fondo sutil si es necesario
    border-radius: 0.375rem; // Tailwind rounded-md
    border: 1px solid hsl(var(--border) / 0.7);
  }
  
  .comment-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem; // Tailwind gap-1
    margin-top: 0.5rem; // Tailwind mt-2
  }
  .comment-actions button {
    font-size: 0.75rem; // Tailwind text-xs
    padding: 0.25rem 0.5rem; // Tailwind p-1
    height: auto;
    color: hsl(var(--muted-foreground));
  }
  .comment-actions button:hover {
    color: hsl(var(--primary));
    background-color: hsl(var(--accent) / 0.1);
  }
`;

export default function CommentItem({ comment }: CommentItemProps) {
  const authorName = comment.author?.name || 'Usuario Anónimo';
  const authorAvatar = comment.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <StyledCommentItemWrapper>
      <div className="comment-react">
        <button title="Me gusta (Visual)">
          <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" strokeLinecap="round" strokeWidth={1.5} stroke="currentColor" d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z" />
          </svg>
        </button>
        <hr />
        <span>{comment.upvotes}</span>
      </div>
      <div className="comment-container">
        <div className="user">
          <div className="user-pic-wrapper">
            <Avatar className="h-9 w-9"> {/* ShadCN Avatar */}
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
