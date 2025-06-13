
// src/actions/chatActions.ts
'use server';

import { query } from '@/lib/db';
import type { ChatConversation, ChatMessage, ChatConversationListItem, User } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// --- Helper Functions ---
function mapDbRowToChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    content: row.content,
    created_at: new Date(row.created_at).toISOString(),
    read_at: row.read_at ? new Date(row.read_at).toISOString() : null,
    sender: row.sender_name ? { // Assuming sender_name, sender_avatar_url are joined
      id: row.sender_id,
      name: row.sender_name,
      avatarUrl: row.sender_avatar_url || undefined,
    } : undefined,
  };
}

function mapDbRowToChatConversation(row: any): ChatConversation {
  return {
    id: row.id,
    property_id: row.property_id,
    request_id: row.request_id,
    user_a_id: row.user_a_id,
    user_b_id: row.user_b_id,
    user_a_unread_count: Number(row.user_a_unread_count),
    user_b_unread_count: Number(row.user_b_unread_count),
    last_message_at: row.last_message_at ? new Date(row.last_message_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}


// --- Server Actions ---

export async function getOrCreateConversationAction(
  currentUserId: string,
  targetUserId: string,
  context?: { propertyId?: string; requestId?: string }
): Promise<{ success: boolean; message?: string; conversation?: ChatConversation }> {
  if (currentUserId === targetUserId) {
    return { success: false, message: 'No puedes iniciar una conversación contigo mismo.' };
  }
  if (context?.propertyId && context?.requestId) {
    return { success: false, message: 'Una conversación solo puede tener un contexto (propiedad O solicitud), no ambos.' };
  }

  const user_a_id = currentUserId < targetUserId ? currentUserId : targetUserId;
  const user_b_id = currentUserId < targetUserId ? targetUserId : currentUserId;
  const property_id = context?.propertyId || null;
  const request_id = context?.requestId || null;

  try {
    let existingConversationSql = `
      SELECT * FROM chat_conversations 
      WHERE user_a_id = ? AND user_b_id = ?
    `;
    const params: (string | null)[] = [user_a_id, user_b_id];

    if (property_id) {
      existingConversationSql += ' AND property_id = ?';
      params.push(property_id);
    } else if (request_id) {
      existingConversationSql += ' AND request_id = ?';
      params.push(request_id);
    } else {
      existingConversationSql += ' AND property_id IS NULL AND request_id IS NULL';
    }
    
    existingConversationSql += ' LIMIT 1';

    const existingRows: any[] = await query(existingConversationSql, params);

    if (existingRows.length > 0) {
      return { success: true, conversation: mapDbRowToChatConversation(existingRows[0]) };
    }

    // Create new conversation
    const conversationId = randomUUID();
    const insertSql = `
      INSERT INTO chat_conversations (id, user_a_id, user_b_id, property_id, request_id, last_message_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await query(insertSql, [conversationId, user_a_id, user_b_id, property_id, request_id]);

    const newConversationResult = await query('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
    if (!Array.isArray(newConversationResult) || newConversationResult.length === 0) {
        return { success: false, message: "Error al crear la conversación, no se pudo recuperar." };
    }

    return { success: true, conversation: mapDbRowToChatConversation(newConversationResult[0]) };

  } catch (error: any) {
    console.error('[ChatAction] Error in getOrCreateConversationAction:', error);
    return { success: false, message: `Error al obtener o crear conversación: ${error.message}` };
  }
}


export async function sendMessageAction(
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string
): Promise<{ success: boolean; message?: string; chatMessage?: ChatMessage }> {
  if (!content.trim()) {
    return { success: false, message: 'El mensaje no puede estar vacío.' };
  }

  try {
    // Verify sender is part of the conversation
    const conversationCheckSql = 'SELECT id, user_a_id, user_b_id FROM chat_conversations WHERE id = ?';
    const conversationRows: any[] = await query(conversationCheckSql, [conversationId]);
    if (conversationRows.length === 0) {
      return { success: false, message: 'Conversación no encontrada.' };
    }
    const convo = conversationRows[0];
    if (senderId !== convo.user_a_id && senderId !== convo.user_b_id) {
      return { success: false, message: 'No tienes permiso para enviar mensajes en esta conversación.' };
    }
    if (receiverId !== convo.user_a_id && receiverId !== convo.user_b_id) {
        return { success: false, message: 'El destinatario no es parte de esta conversación.' };
    }
    if (senderId === receiverId) {
        return { success: false, message: 'El remitente y el destinatario no pueden ser el mismo.'};
    }

    const messageId = randomUUID();
    const insertMessageSql = `
      INSERT INTO chat_messages (id, conversation_id, sender_id, receiver_id, content, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await query(insertMessageSql, [messageId, conversationId, senderId, receiverId, content]);

    // Update conversation: last_message_at and unread_count
    const unreadCountFieldToIncrement = receiverId === convo.user_a_id ? 'user_a_unread_count' : 'user_b_unread_count';
    const updateConversationSql = `
      UPDATE chat_conversations 
      SET last_message_at = NOW(), 
          ${unreadCountFieldToIncrement} = ${unreadCountFieldToIncrement} + 1,
          updated_at = NOW()
      WHERE id = ?
    `;
    await query(updateConversationSql, [conversationId]);

    // Fetch the newly created message with sender details
    const newMessageResult = await query(
        `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar_url 
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.id = ?`, [messageId]
    );
    if (!Array.isArray(newMessageResult) || newMessageResult.length === 0) {
        return { success: false, message: "Error al enviar el mensaje, no se pudo recuperar." };
    }
    
    revalidatePath(`/dashboard/messages`); 
    revalidatePath(`/dashboard/messages/${conversationId}`); 

    return { success: true, message: 'Mensaje enviado.', chatMessage: mapDbRowToChatMessage(newMessageResult[0]) };

  } catch (error: any) {
    console.error('[ChatAction] Error in sendMessageAction:', error);
    return { success: false, message: `Error al enviar mensaje: ${error.message}` };
  }
}

export async function markConversationAsReadAction(conversationId: string, currentUserId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const conversationCheckSql = 'SELECT id, user_a_id, user_b_id FROM chat_conversations WHERE id = ?';
    const conversationRows: any[] = await query(conversationCheckSql, [conversationId]);

    if (conversationRows.length === 0) {
      return { success: false, message: 'Conversación no encontrada.' };
    }
    const convo = conversationRows[0];

    // Determine which unread count to reset
    let unreadCountFieldToReset: string | null = null;
    if (currentUserId === convo.user_a_id) {
      unreadCountFieldToReset = 'user_a_unread_count';
    } else if (currentUserId === convo.user_b_id) {
      unreadCountFieldToReset = 'user_b_unread_count';
    }

    if (!unreadCountFieldToReset) {
      return { success: false, message: 'Usuario actual no es parte de esta conversación.' };
    }

    // Mark messages as read
    await query(
      'UPDATE chat_messages SET read_at = NOW() WHERE conversation_id = ? AND receiver_id = ? AND read_at IS NULL',
      [conversationId, currentUserId]
    );

    // Reset unread count for the current user in the conversation
    await query(
      `UPDATE chat_conversations SET ${unreadCountFieldToReset} = 0, updated_at = NOW() WHERE id = ?`,
      [conversationId]
    );
    
    revalidatePath(`/dashboard/messages`);
    revalidatePath(`/dashboard/messages/${conversationId}`);
    // Potentially revalidate navbar if it shows total unread count

    return { success: true, message: 'Conversación marcada como leída.' };
  } catch (error: any) {
    console.error('[ChatAction] Error in markConversationAsReadAction:', error);
    return { success: false, message: `Error al marcar como leído: ${error.message}` };
  }
}


export async function getConversationMessagesAction(conversationId: string, currentUserId: string): Promise<ChatMessage[]> {
  try {
    // Mark as read before fetching
    await markConversationAsReadAction(conversationId, currentUserId);

    const sql = `
      SELECT 
        cm.*, 
        s.name as sender_name, 
        s.avatar_url as sender_avatar_url
      FROM chat_messages cm
      JOIN users s ON cm.sender_id = s.id
      WHERE cm.conversation_id = ?
      ORDER BY cm.created_at ASC
    `;
    const rows: any[] = await query(sql, [conversationId]);
    return rows.map(mapDbRowToChatMessage);
  } catch (error: any) {
    console.error(`[ChatAction] Error fetching messages for conversation ${conversationId}:`, error);
    return [];
  }
}

export async function getUserConversationsAction(userId: string): Promise<ChatConversationListItem[]> {
  try {
    const sql = `
      SELECT 
        c.id,
        c.property_id,
        c.request_id,
        c.user_a_id,
        c.user_b_id,
        c.last_message_at,
        CASE
          WHEN c.user_a_id = ? THEN c.user_a_unread_count
          WHEN c.user_b_id = ? THEN c.user_b_unread_count
          ELSE 0
        END as unread_count_for_current_user,
        other_user.id as other_user_id,
        other_user.name as other_user_name,
        other_user.avatar_url as other_user_avatar_url,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
        prop.title as property_title,
        prop.slug as property_slug,
        req.title as request_title,
        req.slug as request_slug
      FROM chat_conversations c
      JOIN users other_user ON (other_user.id = IF(c.user_a_id = ?, c.user_b_id, c.user_a_id))
      LEFT JOIN properties prop ON c.property_id = prop.id
      LEFT JOIN property_requests req ON c.request_id = req.id
      WHERE c.user_a_id = ? OR c.user_b_id = ?
      ORDER BY c.last_message_at DESC
    `;
    const params = [userId, userId, userId, userId, userId];
    const rows: any[] = await query(sql, params);

    return rows.map(row => ({
      id: row.id,
      last_message_at: row.last_message_at ? new Date(row.last_message_at).toISOString() : null,
      other_user: {
        id: row.other_user_id,
        name: row.other_user_name,
        avatarUrl: row.other_user_avatar_url || undefined,
      },
      last_message_content: row.last_message_content,
      unread_count_for_current_user: Number(row.unread_count_for_current_user),
      property_id: row.property_id,
      request_id: row.request_id,
      context_title: row.property_id ? row.property_title : (row.request_id ? row.request_title : null),
      context_slug: row.property_id ? row.property_slug : (row.request_id ? row.request_slug : null),
      context_type: row.property_id ? 'property' : (row.request_id ? 'request' : null),
    }));
  } catch (error: any) {
    console.error(`[ChatAction] Error fetching conversations for user ${userId}:`, error);
    return [];
  }
}

export async function getTotalUnreadMessagesCountAction(userId: string): Promise<number> {
  try {
    const sql = `
      SELECT 
        SUM(CASE
              WHEN user_a_id = ? THEN user_a_unread_count
              WHEN user_b_id = ? THEN user_b_unread_count
              ELSE 0
            END) as total_unread
      FROM chat_conversations
      WHERE user_a_id = ? OR user_b_id = ?;
    `;
    const rows: any[] = await query(sql, [userId, userId, userId, userId]);
    return rows.length > 0 ? Number(rows[0].total_unread || 0) : 0;
  } catch (error: any) {
    console.error(`[ChatAction] Error fetching total unread messages for user ${userId}:`, error);
    return 0;
  }
}
