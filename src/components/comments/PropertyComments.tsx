
// src/components/comments/PropertyComments.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import { addCommentAction, getCommentsAction } from '@/actions/commentActions';
import CommentItem from './CommentItem';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';
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
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para comentar.",
        variant: "default",
        action: <Button asChild variant="link"><Link href={`/auth/signin?redirect=/properties/${propertySlug}#comments`}>Iniciar Sesión</Link></Button>
      });
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
        const newCommentWithAuthor = {
          ...result.comment,
          author: { id: loggedInUser.id, name: loggedInUser.name, avatarUrl: loggedInUser.avatarUrl }
        };
        setComments(prevComments => [newCommentWithAuthor, ...prevComments]);
        setNewCommentContent('');
      } else {
        toast({ title: "Error al Comentar", description: result.message || "No se pudo añadir tu comentario.", variant: "destructive" });
      }
    });
  };

  const authorName = loggedInUser?.name || 'Tú';
  const authorAvatar = loggedInUser?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Card className="shadow-lg rounded-xl" id="comments">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <MessageCircle className="mr-2 h-6 w-6 text-primary" />
          Comentarios ({comments.length})
        </CardTitle>
        <CardDescription>
          Comparte tu opinión sobre esta propiedad o haz preguntas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loggedInUser ? (
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10 mt-1">
              <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona"/>
              <AvatarFallback>{authorInitials || <UserCircle className="h-5 w-5"/>}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Escribe tu comentario aquí..."
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[80px] text-sm"
              />
              <Button onClick={handleAddComment} disabled={isSubmitting || !newCommentContent.trim()} className="mt-2">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publicar Comentario
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border-2 border-dashed rounded-lg bg-muted/40">
            <p className="text-muted-foreground">
              <Link href={`/auth/signin?redirect=/properties/${propertySlug}#comments`} className="text-primary hover:underline font-medium">Inicia sesión</Link> o <Link href={`/auth/signup?redirect=/properties/${propertySlug}#comments`} className="text-primary hover:underline font-medium">regístrate</Link> para dejar un comentario.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Cargando comentarios...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} loggedInUser={loggedInUser} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">
            Aún no hay comentarios. ¡Sé el primero en comentar!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
