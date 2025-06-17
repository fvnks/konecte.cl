// src/components/comments/PropertyComments.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import { addCommentAction, getCommentsAction } from '@/actions/commentActions';
import StyledCommentSystem from './StyledCommentSystem'; // Importar el nuevo sistema
import { useToast } from '@/hooks/use-toast';

interface PropertyCommentsProps {
  propertyId: string;
  propertySlug: string;
}

export default function PropertyComments({ propertyId, propertySlug }: PropertyCommentsProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchComments() {
      if (!propertyId) return;
      setIsLoading(true);
      try {
        const fetchedComments = await getCommentsAction({ propertyId });
        setComments(fetchedComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchComments();
  }, [propertyId, toast]);

  const handleAddComment = async () => {
    if (!loggedInUser?.id) {
      // El componente StyledCommentSystem manejará el prompt de login
      return;
    }
    if (!newCommentContent.trim()) {
      toast({ title: "Comentario Vacío", description: "Por favor, escribe algo en tu comentario.", variant: "destructive" });
      return;
    }

    startSubmittingTransition(async () => {
      const result = await addCommentAction(
        { content: newCommentContent },
        loggedInUser.id,
        { propertyId, propertySlug }
      );

      if (result.success && result.comment) {
        toast({ title: "Comentario Añadido", description: "Tu comentario ha sido publicado." });
        setComments(prevComments => [result.comment!, ...prevComments]);
        setNewCommentContent('');
      } else {
        toast({ title: "Error al Comentar", description: result.message || "No se pudo añadir tu comentario.", variant: "destructive" });
      }
    });
  };
  
  return (
    <StyledCommentSystem
      title="Comentarios de la Propiedad"
      comments={comments}
      isLoading={isLoading}
      newCommentContent={newCommentContent}
      onNewCommentChange={setNewCommentContent}
      onSubmitComment={handleAddComment}
      isSubmittingComment={isSubmitting}
      loggedInUser={loggedInUser}
      targetTypeForLink="properties"
      targetSlugForLink={propertySlug}
      targetIdForLink={propertyId}
    />
  );
}
