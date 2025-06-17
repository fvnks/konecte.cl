// src/components/comments/StyledCommentSystem.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import CommentItem from './CommentItem'; // Asumimos que CommentItem se adaptará
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';

interface StyledCommentSystemProps {
  title: string; // "Comentarios" o "Discusión"
  comments: CommentType[];
  isLoading: boolean;
  newCommentContent: string;
  onNewCommentChange: (content: string) => void;
  onSubmitComment: () => void;
  isSubmittingComment: boolean;
  loggedInUser: StoredUserType | null;
  targetTypeForLink: 'properties' | 'requests';
  targetSlugForLink: string;
  targetIdForLink: string;
}

// SVG Icons (se podrían importar de lucide-react si coinciden o usar los tuyos)
const BoldIcon = () => <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M5 6C5 4.58579 5 3.87868 5.43934 3.43934C5.87868 3 6.58579 3 8 3H12.5789C15.0206 3 17 5.01472 17 7.5C17 9.98528 15.0206 12 12.5789 12H5V6Z" clipRule="evenodd" fillRule="evenodd" /><path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M12.4286 12H13.6667C16.0599 12 18 14.0147 18 16.5C18 18.9853 16.0599 21 13.6667 21H8C6.58579 21 5.87868 21 5.43934 20.5607C5 20.1213 5 19.4142 5 18V12" /></svg>;
const ItalicIcon = () => <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M12 4H19" /><path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M8 20L16 4" /><path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M5 20H12" /></svg>;
const UnderlineIcon = () => <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M5.5 3V11.5C5.5 15.0899 8.41015 18 12 18C15.5899 18 18.5 15.0899 18.5 11.5V3" /><path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M3 21H21" /></svg>;
const StrikethroughIcon = () => <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M4 12H20" /><path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M17.5 7.66667C17.5 5.08934 15.0376 3 12 3C8.96243 3 6.5 5.08934 6.5 7.66667C6.5 8.15279 6.55336 8.59783 6.6668 9M6 16.3333C6 18.9107 8.68629 21 12 21C15.3137 21 18 19.6667 18 16.3333C18 13.9404 16.9693 12.5782 14.9079 12" /></svg>;
const EmojiIcon = () => <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg"><circle strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" r={10} cy={12} cx={12} /><path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" /><path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M8.00897 9L8 9M16 9L15.991 9" /></svg>;


const StyledCommentSystemWrapper = styled.div`
  .card {
    width: 100%; // Adaptable width
    max-width: 700px; // Max width para mejor lectura
    margin: 0 auto; // Centrar
    height: fit-content;
    background-color: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    box-shadow: 0px 12px 26px rgba(0, 0, 0, 0.07), 0px 0px 0px rgba(0, 0, 0, 0.07);
    border-radius: 17px 17px 27px 27px;
  }

  .title {
    width: 100%;
    height: 50px;
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 20px;
    border-bottom: 1px solid hsl(var(--border));
    font-weight: 700;
    font-size: 1.125rem; // Tailwind text-lg
    color: hsl(var(--card-foreground));
  }

  .title::after { // La línea decorativa bajo el título
    content: '';
    width: 8ch; // Ancho basado en caracteres
    height: 2px;
    position: absolute;
    bottom: -1.5px; // Ajuste para que quede sobre el borde
    background-color: hsl(var(--primary));
  }

  .comments-list { // Renombrado desde .comments para claridad
    display: flex;
    flex-direction: column; // Comentarios apilados verticalmente
    gap: 1rem; // Espacio entre comentarios
    padding: 1.25rem; // Tailwind p-5
  }

  .text-box {
    width: 100%;
    height: fit-content;
    background-color: hsl(var(--secondary)); // Color de fondo secundario
    padding: 0.75rem; // Tailwind p-3
    border-top: 1px solid hsl(var(--border));
  }

  .text-box .box-container {
    background-color: hsl(var(--card)); // Fondo de la tarjeta para el input
    border-radius: 8px 8px 21px 21px;
    padding: 0.75rem; // Tailwind p-3
    border: 1px solid hsl(var(--border));
  }
  
  // Usar Textarea de ShadCN, no necesita estilo aquí
  // .text-box textarea { ... }

  .text-box .formatting {
    display: flex; // Cambiado a flex para mejor alineamiento
    align-items: center;
    gap: 0.25rem; // Tailwind gap-1
  }

  .text-box .formatting button {
    width: 30px;
    height: 30px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border-radius: 50%;
    border: 0;
    outline: none;
    color: hsl(var(--muted-foreground));
    transition: background-color 0.2s ease-in-out;
  }

  .text-box .formatting button:hover {
    background-color: hsl(var(--accent) / 0.1);
    color: hsl(var(--accent-foreground));
  }

  .text-box .formatting .send-button { // Estilo específico para el botón de enviar
    width: 36px; // Ligeramente más grande
    height: 36px;
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    margin-left: auto; // Alinea a la derecha
    border-radius: 8px; // Borde más cuadrado
  }

  .text-box .formatting .send-button:hover {
    background-color: hsl(var(--primary) / 0.9);
  }

  .login-prompt {
    text-align: center;
    padding: 1rem;
    background-color: hsl(var(--secondary) / 0.5);
    border-radius: 8px;
    margin: 1.25rem; // Tailwind m-5
    font-size: 0.875rem; // Tailwind text-sm
    color: hsl(var(--muted-foreground));
  }

  .login-prompt a {
    color: hsl(var(--primary));
    font-weight: 500;
    text-decoration: none;
  }
  .login-prompt a:hover {
    text-decoration: underline;
  }

  @keyframes ripple { /* Mantener por si se usa en CommentItem */
    0% { transform: scale(0); opacity: 0.6; }
    100% { transform: scale(1); opacity: 0; }
  }
`;

const StyledCommentSystem: React.FC<StyledCommentSystemProps> = ({
  title,
  comments,
  isLoading,
  newCommentContent,
  onNewCommentChange,
  onSubmitComment,
  isSubmittingComment,
  loggedInUser,
  targetSlugForLink, // No se usa directamente aquí, pero se pasa a CommentItem
  targetTypeForLink, // Idem
  targetIdForLink, // Idem
}) => {
  const authorName = loggedInUser?.name || 'Tú';
  const authorAvatar = loggedInUser?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <StyledCommentSystemWrapper>
      <div className="card">
        <span className="title">{title} ({comments.length})</span>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Cargando comentarios...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="comments-list">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6 px-5">
            Aún no hay comentarios. ¡Sé el primero en comentar!
          </p>
        )}

        <div className="text-box">
          {loggedInUser ? (
            <div className="box-container">
              <div className="flex items-start gap-3">
                <Avatar className="mt-1 h-9 w-9">
                  <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona"/>
                  <AvatarFallback>{authorInitials || <UserCircle className="h-4 w-4"/>}</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="Escribe tu comentario..."
                  value={newCommentContent}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  disabled={isSubmittingComment}
                  className="flex-grow min-h-[60px] text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-2"
                />
              </div>
              <div className="formatting mt-2">
                <button type="button" title="Negrita (decorativo)"><BoldIcon /></button>
                <button type="button" title="Cursiva (decorativo)"><ItalicIcon /></button>
                <button type="button" title="Subrayado (decorativo)"><UnderlineIcon /></button>
                <button type="button" title="Tachado (decorativo)"><StrikethroughIcon /></button>
                <button type="button" title="Emoji (decorativo)"><EmojiIcon /></button>
                <Button
                  size="icon"
                  className="send-button h-9 w-9"
                  title="Enviar Comentario"
                  onClick={onSubmitComment}
                  disabled={isSubmittingComment || !newCommentContent.trim()}
                >
                  {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
             <div className="login-prompt">
              <Link href={`/auth/signin?redirect=/${targetTypeForLink}/${targetSlugForLink}#comments`}>Inicia sesión</Link> o <Link href={`/auth/signup?redirect=/${targetTypeForLink}/${targetSlugForLink}#comments`}>regístrate</Link> para dejar un comentario.
            </div>
          )}
        </div>
      </div>
    </StyledCommentSystemWrapper>
  );
};

export default StyledCommentSystem;
