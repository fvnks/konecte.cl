// src/components/comments/RequestComments.tsx
'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
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

interface RequestCommentsProps {
  requestId: string;
  requestSlug: string;
}

export default function RequestComments({ requestId, requestSlug }: RequestCommentsProps) {
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

  const fetchComments = async () => {
    if (!requestId) return;
    setIsLoading(true);
    try {
      const fetchedComments = await getCommentsAction({ requestId });
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments for request:", error);
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const handleCommentAdded = (newComment: CommentType) => {
    setComments(prev => [newComment, ...prev]);
  };

  const handleAddTopLevelComment = async () => {
     if (!loggedInUser?.id) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para comentar.",
        variant: "default",
        action: <Button asChild variant="link"><Link href={`/auth/signin?redirect=/requests/${requestSlug}#comments`}>Iniciar Sesión</Link></Button>
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
        { requestId, requestSlug }
      );

      if (result.success && result.comment) {
        toast({ title: "Comentario Añadido", description: "Tu comentario ha sido publicado." });
        handleCommentAdded(result.comment);
        setNewCommentContent('');
      } else {
        toast({ title: "Error al Comentar", description: result.message || "No se pudo añadir tu comentario.", variant: "destructive" });
      }
    });
  };

  const commentTree = useMemo(() => {
    const commentMap: Map<string, CommentType & { children: CommentType[] }> = new Map();
    const rootComments: (CommentType & { children: CommentType[] })[] = [];

    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, children: [] });
    });

    comments.forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
            commentMap.get(comment.parent_id)!.children.push(commentMap.get(comment.id)!);
        } else {
            rootComments.push(commentMap.get(comment.id)!);
        }
    });

    rootComments.forEach(root => {
      if (root.children) {
        root.children.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });
    
    return rootComments.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments]);


  const authorName = loggedInUser?.name || 'Tú';
  const authorAvatar = loggedInUser?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Card className="shadow-lg rounded-xl" id="comments">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <MessageCircle className="mr-2 h-6 w-6 text-primary" />
          Discusión de la Solicitud ({comments.length})
        </CardTitle>
        <CardDescription>
          Comparte tu opinión o si tienes una propiedad que coincida.
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
                placeholder="Escribe un nuevo comentario aquí..."
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[80px] text-sm"
              />
              <Button onClick={handleAddTopLevelComment} disabled={isSubmitting || !newCommentContent.trim()} className="mt-2">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publicar Comentario
              </Button>
            </div>
          </div>
        ) : (
           <div className="text-center py-4 border-2 border-dashed rounded-lg bg-muted/40">
            <p className="text-muted-foreground">
              <Link href={`/auth/signin?redirect=/requests/${requestSlug}#comments`} className="text-primary hover:underline font-medium">Inicia sesión</Link> o <Link href={`/auth/signup?redirect=/requests/${requestSlug}#comments`} className="text-primary hover:underline font-medium">regístrate</Link> para dejar un comentario.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Cargando comentarios...</p>
          </div>
        ) : commentTree.length > 0 ? (
          <div className="space-y-4">
            {commentTree.map(comment => (
              <div key={comment.id} className="border-t border-border/50 pt-3">
                <CommentItem
                  comment={comment}
                  loggedInUser={loggedInUser}
                  onCommentAdded={handleCommentAdded}
                  requestId={requestId}
                  requestSlug={requestSlug}
                />
                 {comment.children.length > 0 && (
                  <div className="ml-8 pl-5 border-l-2 border-muted">
                    {comment.children.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        loggedInUser={loggedInUser}
                        onCommentAdded={handleCommentAdded}
                        isReply={true}
                        requestId={requestId}
                        requestSlug={requestSlug}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">
            Aún no hay comentarios para esta solicitud. ¡Sé el primero!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
