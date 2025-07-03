// src/actions/commentActions.ts
'use server';

import { db } from '@/lib/db';
import { comments, properties, searchRequests, users, userCommentInteractions } from '@/lib/db/schema';
import type { Comment, AddCommentFormValues, CommentInteractionDetails } from '@/lib/types';
import { addCommentFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { and, eq, desc, sql } from 'drizzle-orm';

function mapDbRowToComment(row: any): Comment {
  const author = row.author ? {
    id: row.author.id,
    name: row.author.name,
    avatarUrl: row.author.avatarUrl || undefined,
  } : undefined;

  return {
    id: row.id,
    user_id: row.userId,
    property_id: row.propertyId,
    request_id: row.requestId,
    content: row.content,
    parent_id: row.parentId,
    upvotes: Number(row.upvotes),
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
    author,
  };
}

export async function addCommentAction(
  values: AddCommentFormValues,
  userId: string,
  target: { propertyId?: string; requestId?: string; propertySlug?: string; requestSlug?: string; }
): Promise<{ success: boolean; message?: string; comment?: Comment }> {
  if (!userId) {
    return { success: false, message: 'Usuario no autenticado.' };
  }
  if (!target.propertyId && !target.requestId) {
    return { success: false, message: 'Se requiere un ID de propiedad o solicitud.' };
  }

  const validation = addCommentFormSchema.safeParse(values);
  if (!validation.success) {
      const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { content, parentId } = validation.data;
  const commentId = randomUUID();

  try {
    await db.insert(comments).values({
      id: commentId,
      userId: userId,
      content,
      parentId: parentId || undefined,
      propertyId: target.propertyId || undefined,
      requestId: target.requestId || undefined,
    });

    if (target.propertyId) {
        await db.update(properties).set({ commentsCount: sql`${properties.commentsCount} + 1` }).where(eq(properties.id, target.propertyId));
    } else if (target.requestId) {
        await db.update(searchRequests).set({ commentsCount: sql`${searchRequests.commentsCount} + 1` }).where(eq(searchRequests.id, target.requestId));
    }
    
    if (target.propertySlug) revalidatePath(`/properties/${target.propertySlug}`);
    if (target.requestSlug) revalidatePath(`/requests/${target.requestSlug}`);
    
    const newCommentQuery = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
        with: {
            author: {
                columns: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                }
            }
        }
    });

    if (!newCommentQuery) {
      return { success: false, message: 'Error al añadir el comentario, no se pudo recuperar.' };
    }
    
    return {
      success: true,
      message: 'Comentario añadido exitosamente.',
      comment: mapDbRowToComment(newCommentQuery),
    };

  } catch (error: any) {
    console.error('[CommentAction] Error adding comment:', error);
    return { success: false, message: `Error al añadir comentario: ${error.message}` };
  }
}

export async function getCommentsAction(
  target: { propertyId?: string; requestId?: string }
): Promise<Comment[]> {
  if (!target.propertyId && !target.requestId) return [];

  try {
    const queryResult = await db.query.comments.findMany({
        where: target.propertyId ? eq(comments.propertyId, target.propertyId) : eq(comments.requestId, target.requestId!),
        with: {
            author: {
                columns: {
                    id: true,
                    name: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: [desc(comments.createdAt)]
    });

    return queryResult.map(mapDbRowToComment);
  } catch (error: any) {
    console.error(`[CommentAction] Error fetching comments:`, error);
    return [];
  }
}

export async function getCommentInteractionDetailsAction(
  commentId: string,
  userId?: string
): Promise<CommentInteractionDetails> {
  if (!commentId) throw new Error("commentId is required.");

  try {
    const commentResult = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
        columns: {
            upvotes: true
        }
    });
    const totalLikes = commentResult?.upvotes ?? 0;
    
    let currentUserLiked = false;
    if (userId) {
      const userInteractionResult = await db.select().from(userCommentInteractions).where(and(
          eq(userCommentInteractions.userId, userId),
          eq(userCommentInteractions.commentId, commentId),
          eq(userCommentInteractions.interactionType, 'like')
      ));
      currentUserLiked = userInteractionResult.length > 0;
    }
    return { totalLikes, currentUserLiked };
  } catch (error: any) {
    console.error("[CommentAction] Error in getCommentInteractionDetailsAction:", error);
    return { totalLikes: 0, currentUserLiked: false };
  }
}

export async function toggleCommentLikeAction(
  commentId: string,
  userId: string
): Promise<{ success: boolean; message?: string; newUpvotesCount?: number; userNowLikes?: boolean }> {
  if (!commentId || !userId) {
    return { success: false, message: "Se requiere el ID del comentario y del usuario." };
  }

  try {
    const existingInteraction = await db.query.userCommentInteractions.findFirst({
        where: and(
            eq(userCommentInteractions.userId, userId),
            eq(userCommentInteractions.commentId, commentId),
            eq(userCommentInteractions.interactionType, 'like')
        )
    });

    let userNowLikes: boolean;

    if (existingInteraction) {
      // Unlike
      await db.delete(userCommentInteractions).where(eq(userCommentInteractions.id, existingInteraction.id));
      await db.update(comments).set({ upvotes: sql`${comments.upvotes} - 1` }).where(eq(comments.id, commentId));
      userNowLikes = false;
    } else {
      // Like
      await db.insert(userCommentInteractions).values({
          id: randomUUID(),
          userId,
          commentId,
          interactionType: 'like'
      });
      await db.update(comments).set({ upvotes: sql`${comments.upvotes} + 1` }).where(eq(comments.id, commentId));
      userNowLikes = true;
    }

    const updatedComment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
        columns: {
            upvotes: true
        }
    });
    const newUpvotesCount = updatedComment?.upvotes ?? 0;

    return {
      success: true,
      newUpvotesCount,
      userNowLikes,
      message: userNowLikes ? "¡Te gusta este comentario!" : "Ya no te gusta este comentario."
    };

  } catch (error: any) {
    console.error("[CommentAction] Error in toggleCommentLikeAction:", error);
    return { success: false, message: `Error al procesar 'Me gusta': ${error.message}` };
  }
}
