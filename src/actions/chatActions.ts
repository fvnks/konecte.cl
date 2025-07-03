// src/actions/chatActions.ts
"use server";

import { db } from "@/lib/db";
import {
  chatConversations,
  chatMessages,
  users,
} from "@/lib/db/schema";
import type { ChatConversation, ChatMessage, ChatConversationListItem } from "@/lib/types";
import { and, eq, or, sql, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { alias } from "drizzle-orm/mysql-core";


// --- Helper Functions ---
// These will be removed as we refactor
function mapDbRowToChatMessage(row: any): any {
  return {};
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
  context?: { propertyId?: string; requestId?: string },
): Promise<{
  success: boolean;
  message?: string;
  conversation?: ChatConversation;
}> {
  if (currentUserId === targetUserId) {
    return {
      success: false,
      message: "No puedes iniciar una conversación contigo mismo.",
    };
  }
  if (context?.propertyId && context?.requestId) {
    return {
      success: false,
      message:
        "Una conversación solo puede tener un contexto (propiedad O solicitud), no ambos.",
    };
  }

  const user_a_id = currentUserId < targetUserId ? currentUserId : targetUserId;
  const user_b_id = currentUserId < targetUserId ? targetUserId : currentUserId;
  const property_id = context?.propertyId ?? null;
  const request_id = context?.requestId ?? null;

  try {
    const conditions = [
      eq(chatConversations.userAId, user_a_id),
      eq(chatConversations.userBId, user_b_id),
    ];

    if (property_id) {
      conditions.push(eq(chatConversations.propertyId, property_id));
    } else if (request_id) {
      conditions.push(eq(chatConversations.requestId, request_id));
    } else {
      conditions.push(
        sql`(property_id IS NULL AND request_id IS NULL)`,
      );
    }

    const existingConversation = await db
      .select()
      .from(chatConversations)
      .where(and(...conditions))
      .limit(1);

    if (existingConversation.length > 0) {
        const convo = existingConversation[0];
        return { success: true, conversation: { 
            ...convo,
            last_message_at: convo.lastMessageAt?.toISOString() ?? null,
            created_at: convo.createdAt?.toISOString() ?? '',
            updated_at: convo.updatedAt?.toISOString() ?? '',
            user_a_unread_count: convo.userAUnreadCount,
            user_b_unread_count: convo.userBUnreadCount,
            property_id: convo.propertyId,
            request_id: convo.requestId,
            user_a_id: convo.userAId,
            user_b_id: convo.userBId
         }};
    }

    const conversationId = randomUUID();
    await db.insert(chatConversations).values({
      id: conversationId,
      userAId: user_a_id,
      userBId: user_b_id,
      propertyId: property_id,
      requestId: request_id,
      lastMessageAt: new Date(),
    });

    const newConversationResult = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId));

    if (newConversationResult.length === 0) {
      return {
        success: false,
        message: "Error al crear la conversación, no se pudo recuperar.",
      };
    }
    const convo = newConversationResult[0];
    return {
      success: true,
      conversation: {
        ...convo,
        last_message_at: convo.lastMessageAt?.toISOString() ?? null,
        created_at: convo.createdAt?.toISOString() ?? '',
        updated_at: convo.updatedAt?.toISOString() ?? '',
        user_a_unread_count: convo.userAUnreadCount,
        user_b_unread_count: convo.userBUnreadCount,
        property_id: convo.propertyId,
        request_id: convo.requestId,
        user_a_id: convo.userAId,
        user_b_id: convo.userBId
     }
    };
  } catch (error: any) {
    console.error(
      "[ChatAction DEBUG] Error in getOrCreateConversationAction:",
      error,
    );
    return {
      success: false,
      message: `Error al obtener o crear conversación: ${error.message}`,
    };
  }
}

export async function sendMessageAction(
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
): Promise<{ success: boolean; message?: string; chatMessage?: ChatMessage }> {
  if (!content.trim()) {
    return { success: false, message: "El mensaje no puede estar vacío." };
  }

  try {
    const conversationResult = await db
      .select({
        id: chatConversations.id,
        userAId: chatConversations.userAId,
        userBId: chatConversations.userBId,
        userAUnreadCount: chatConversations.userAUnreadCount,
        userBUnreadCount: chatConversations.userBUnreadCount,
      })
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId));

    if (conversationResult.length === 0) {
      return { success: false, message: "Conversación no encontrada." };
    }
    const convo = conversationResult[0];

    if (senderId !== convo.userAId && senderId !== convo.userBId) {
      return {
        success: false,
        message: "No tienes permiso para enviar mensajes en esta conversación.",
      };
    }
    if (receiverId !== convo.userAId && receiverId !== convo.userBId) {
      return {
        success: false,
        message: "El destinatario no es parte de esta conversación.",
      };
    }
    if (senderId === receiverId) {
      return {
        success: false,
        message: "El remitente y el destinatario no pueden ser el mismo.",
      };
    }

    const messageId = randomUUID();
    await db.insert(chatMessages).values({
      id: messageId,
      conversationId,
      senderId,
      receiverId,
      content,
      createdAt: new Date(),
    });

    const unreadCountFieldToIncrement =
      receiverId === convo.userAId
        ? chatConversations.userAUnreadCount
        : chatConversations.userBUnreadCount;

    await db
      .update(chatConversations)
      .set({
        lastMessageAt: new Date(),
        [unreadCountFieldToIncrement.name]: sql`${unreadCountFieldToIncrement} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.id, conversationId));

    const newMessageResult = await db
      .select({
        id: chatMessages.id,
        conversation_id: chatMessages.conversationId,
        sender_id: chatMessages.senderId,
        receiver_id: chatMessages.receiverId,
        content: chatMessages.content,
        created_at: chatMessages.createdAt,
        read_at: chatMessages.readAt,
        sender: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.id, messageId));

    if (newMessageResult.length === 0) {
      return {
        success: false,
        message: "Error al enviar el mensaje, no se pudo recuperar.",
      };
    }

    revalidatePath(`/dashboard/messages`);
    revalidatePath(`/dashboard/messages/${conversationId}`);

    const result = newMessageResult[0];
    const finalMessage: ChatMessage = {
        ...result,
        created_at: result.created_at?.toISOString() ?? new Date().toISOString(),
        read_at: result.read_at?.toISOString() ?? null,
    };


    return {
      success: true,
      message: "Mensaje enviado.",
      chatMessage: finalMessage,
    };
  } catch (error: any) {
    console.error("[ChatAction DEBUG] Error in sendMessageAction:", error);
    return {
      success: false,
      message: `Error al enviar mensaje: ${error.message}`,
    };
  }
}

export async function markConversationAsReadAction(
  conversationId: string,
  currentUserId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const conversationResult = await db
      .select({ id: chatConversations.id, userAId: chatConversations.userAId, userBId: chatConversations.userBId })
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId));

    if (conversationResult.length === 0) {
      return { success: false, message: "Conversación no encontrada." };
    }
    const convo = conversationResult[0];

    let unreadCountFieldToReset: typeof chatConversations.userAUnreadCount.name | null = null;
    if (currentUserId === convo.userAId) {
        unreadCountFieldToReset = 'userAUnreadCount';
    } else if (currentUserId === convo.userBId) {
        unreadCountFieldToReset = 'userBUnreadCount';
    }

    if (!unreadCountFieldToReset) {
      return {
        success: false,
        message: "Usuario actual no es parte de esta conversación.",
      };
    }

    await db
      .update(chatMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          eq(chatMessages.receiverId, currentUserId),
          sql`read_at IS NULL`,
        ),
      );

    await db
      .update(chatConversations)
      .set({ [unreadCountFieldToReset]: 0, updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId));

    revalidatePath(`/dashboard/messages`);
    revalidatePath(`/dashboard/messages/${conversationId}`);

    return { success: true, message: "Conversación marcada como leída." };
  } catch (error: any) {
    console.error(
      "[ChatAction DEBUG] Error in markConversationAsReadAction:",
      error,
    );
    return {
      success: false,
      message: `Error al marcar como leído: ${error.message}`,
    };
  }
}

export async function getConversationMessagesAction(
  conversationId: string,
  currentUserId: string,
): Promise<ChatMessage[]> {
  try {
    await markConversationAsReadAction(conversationId, currentUserId);

    const messagesResult = await db
      .select({
        id: chatMessages.id,
        conversation_id: chatMessages.conversationId,
        sender_id: chatMessages.senderId,
        receiver_id: chatMessages.receiverId,
        content: chatMessages.content,
        created_at: chatMessages.createdAt,
        read_at: chatMessages.readAt,
        sender: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return messagesResult.map(m => ({
        ...m,
        created_at: m.created_at?.toISOString() ?? new Date().toISOString(),
        read_at: m.read_at?.toISOString() ?? null
    }))

  } catch (error: any) {
    console.error("[ChatAction DEBUG] Error in getConversationMessagesAction:", error);
    return [];
  }
}

export async function getUserConversationsAction(userId: string): Promise<ChatConversationListItem[]> {
    try {
        const otherUser = alias(users, "otherUser");

        const conversationsData = await db
          .select({
            id: chatConversations.id,
            propertyId: chatConversations.propertyId,
            requestId: chatConversations.requestId,
            otherUserId: sql<string>`CASE WHEN ${chatConversations.userAId} = ${userId} THEN ${chatConversations.userBId} ELSE ${chatConversations.userAId} END`,
            otherUserName: otherUser.name,
            otherUserAvatarUrl: otherUser.avatarUrl,
            lastMessageAt: chatConversations.lastMessageAt,
            unreadCount: sql<number>`CASE WHEN ${chatConversations.userAId} = ${userId} THEN ${chatConversations.userAUnreadCount} ELSE ${chatConversations.userBUnreadCount} END`.as("unread_count"),
          })
          .from(chatConversations)
          .leftJoin(otherUser, eq(sql`CASE WHEN ${chatConversations.userAId} = ${userId} THEN ${chatConversations.userBId} ELSE ${chatConversations.userAId} END`, otherUser.id))
          .where(
              or(eq(chatConversations.userAId, userId), eq(chatConversations.userBId, userId))
          )
          .orderBy(desc(chatConversations.lastMessageAt));
        
          const conversationIds = conversationsData.map(c => c.id);
          if (conversationIds.length === 0) return [];
      
          // This is a common pattern to get the last message for each conversation.
          // It's more efficient than joining and ordering in a complex way.
          const lastMessagesSubquery = db.$with('last_messages').as(
            db.select({
                conversationId: chatMessages.conversationId,
                content: chatMessages.content,
                rn: sql<number>`ROW_NUMBER() OVER(PARTITION BY ${chatMessages.conversationId} ORDER BY ${chatMessages.createdAt} DESC)`.as('rn')
            })
            .from(chatMessages)
            .where(or(...conversationIds.map(id => eq(chatMessages.conversationId, id))))
          );

          const lastMessages = await db.with(lastMessagesSubquery).select({
            conversationId: lastMessagesSubquery.conversationId,
            content: lastMessagesSubquery.content,
          }).from(lastMessagesSubquery).where(eq(lastMessagesSubquery.rn, 1));
          
          const lastMessageMap = new Map(lastMessages.map(m => [m.conversationId, m.content]));
      
          return conversationsData.map(c => ({
            id: c.id,
            property_id: c.propertyId,
            request_id: c.requestId,
            other_user_id: c.otherUserId,
            other_user_name: c.otherUserName,
            other_user_avatar_url: c.otherUserAvatarUrl,
            last_message_content: lastMessageMap.get(c.id) ?? '',
            last_message_at: c.lastMessageAt?.toISOString() ?? null,
            unread_count: c.unreadCount,
          }));

    } catch (error) {
        console.error('[ChatAction DEBUG] Error in getUserConversationsAction:', error);
        return [];
    }
}


export async function getTotalUnreadMessagesCountAction(userId: string): Promise<number> {
    try {
        const result = await db.select({
            total: count()
        })
        .from(chatConversations)
        .where(
            or(
                and(
                    eq(chatConversations.userAId, userId), 
                    sql`${chatConversations.userAUnreadCount} > 0`
                ),
                and(
                    eq(chatConversations.userBId, userId),
                    sql`${chatConversations.userBUnreadCount} > 0`
                )
            )
        );

        const totalUnreadConversations = result[0]?.total ?? 0;

        // The above counts conversations with unread messages. If we need total unread messages, the query is different.
        // Let's sum the counts.

        const sumResult = await db.select({
            total: sql<number>`SUM(CASE WHEN user_a_id = ${userId} THEN user_a_unread_count ELSE user_b_unread_count END)`.as('total')
        })
        .from(chatConversations)
        .where(or(eq(chatConversations.userAId, userId), eq(chatConversations.userBId, userId)));


        return Number(sumResult[0]?.total ?? 0);
    } catch (error) {
        console.error('[ChatAction DEBUG] Error in getTotalUnreadMessagesCountAction:', error);
        return 0;
    }
}

    