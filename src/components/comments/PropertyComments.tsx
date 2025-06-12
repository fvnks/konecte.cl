
// src/components/comments/PropertyComments.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Comment as CommentType, User as StoredUserType } from '@/lib/types';
import { addCommentAction, getCommentsAction } from '@/actions/commentActions';
import CommentItem from './CommentItem';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, UserCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

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
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para comentar.", variant: "default", 
        action: <Button variant="link" size="sm" asChild><Link href="/auth/signin">Iniciar Sesión</Link></Button>
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
        setComments(prevComments => [result.comment!, ...prevComments]);
        setNewCommentContent('');
      } else {
        toast({ title: "Error al Comentar", description: result.message || "No se pudo añadir tu comentario.", variant: "destructive" });
      }
    });
  };
  
  const authorName = loggedInUser?.name || 'Tú';
  const authorAvatar = loggedInUser?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();


  return (
    <Card id="comments" className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <MessageSquare className="mr-3 h-7 w-7 text-primary" /> Discusiones ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loggedInUser ? (
          <div className="flex gap-3 items-start border p-4 rounded-lg bg-background">
            <Avatar className="mt-1 h-10 w-10">
              <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona"/>
              <AvatarFallback>{authorInitials || <UserCircle className="h-5 w-5"/>}</AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2">
              <Textarea
                placeholder="Añade un comentario público..."
                className="min-h-[80px] text-sm"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                disabled={isSubmitting}
              />
              <Button onClick={handleAddComment} disabled={isSubmitting || !newCommentContent.trim()} size="sm">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publicar Comentario
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">
              <Link href="/auth/signin" className="text-primary hover:underline font-semibold">Inicia sesión</Link> o <Link href="/auth/signup" className="text-primary hover:underline font-semibold">regístrate</Link> para dejar un comentario.
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
              <CommentItem key={comment.id} comment={comment} />
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
