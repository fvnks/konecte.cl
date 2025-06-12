
// src/actions/commentActions.ts
'use server';

import { query } from '@/lib/db';
import type { Comment, AddCommentFormValues, User } from '@/lib/types';
import { addCommentFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

function mapDbRowToComment(row: any): Comment {
  const author: Pick<User, 'id' | 'name' | 'avatarUrl'> | undefined = row.author_id ? {
    id: row.author_id,
    name: row.author_name,
    avatarUrl: row.author_avatar_url || undefined,
  } : undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    property_id: row.property_id,
    request_id: row.request_id,
    content: row.content,
    parent_id: row.parent_id,
    upvotes: Number(row.upvotes),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
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
  if (target.propertyId && target.requestId) {
    return { success: false, message: 'Un comentario solo puede pertenecer a una propiedad O a una solicitud, no a ambas.' };
  }

  const validation = addCommentFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { content, parentId } = validation.data;
  const commentId = randomUUID();

  try {
    // Insertar el comentario
    const commentSql = `
      INSERT INTO comments (id, user_id, content, parent_id, property_id, request_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    await query(commentSql, [
      commentId,
      userId,
      content,
      parentId || null,
      target.propertyId || null,
      target.requestId || null,
    ]);

    // Actualizar el contador de comentarios en la tabla correspondiente
    if (target.propertyId) {
      await query('UPDATE properties SET comments_count = comments_count + 1 WHERE id = ?', [target.propertyId]);
    } else if (target.requestId) {
      await query('UPDATE property_requests SET comments_count = comments_count + 1 WHERE id = ?', [target.requestId]);
    }

    // Revalidar rutas
    if (target.propertySlug) {
      revalidatePath(`/properties/${target.propertySlug}`);
    }
    if (target.requestSlug) {
      revalidatePath(`/requests/${target.requestSlug}`);
    }
    // Potencialmente revalidar la página de listado si los contadores se muestran allí.
    // revalidatePath('/properties');
    // revalidatePath('/requests');


    // Obtener el comentario recién creado con información del autor
    const newCommentResult = await query(
        `SELECT c.*, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`, [commentId]
    );

    if (!Array.isArray(newCommentResult) || newCommentResult.length === 0) {
      return { success: false, message: 'Error al añadir el comentario, no se pudo recuperar.' };
    }
    
    return {
      success: true,
      message: 'Comentario añadido exitosamente.',
      comment: mapDbRowToComment(newCommentResult[0]),
    };

  } catch (error: any) {
    console.error('[CommentAction] Error adding comment:', error);
    return { success: false, message: `Error al añadir comentario: ${error.message}` };
  }
}


export async function getCommentsAction(
  target: { propertyId?: string; requestId?: string }
): Promise<Comment[]> {
  if (!target.propertyId && !target.requestId) {
    console.warn("[CommentAction] getCommentsAction called without propertyId or requestId.");
    return [];
  }
  if (target.propertyId && target.requestId) {
    console.warn("[CommentAction] getCommentsAction called with both propertyId and requestId. Choose one.");
    return [];
  }

  try {
    let sql = `
      SELECT 
        c.*, 
        u.id as author_id, 
        u.name as author_name, 
        u.avatar_url as author_avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
    `;
    const params: string[] = [];

    if (target.propertyId) {
      sql += ' WHERE c.property_id = ?';
      params.push(target.propertyId);
    } else if (target.requestId) {
      sql += ' WHERE c.request_id = ?';
      params.push(target.requestId);
    }
    
    sql += ' ORDER BY c.created_at DESC'; // O ASC si prefieres los más antiguos primero

    const rows = await query(sql, params);
    if (!Array.isArray(rows)) {
      console.error('[CommentAction] Expected array from getCommentsAction query, got:', typeof rows);
      return [];
    }
    return rows.map(mapDbRowToComment);
  } catch (error: any) {
    console.error(`[CommentAction] Error fetching comments for ${target.propertyId ? 'property' : 'request'} ${target.propertyId || target.requestId}:`, error);
    return [];
  }
}
