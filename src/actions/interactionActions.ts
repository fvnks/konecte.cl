
// src/actions/interactionActions.ts
'use server';

import { query } from '@/lib/db';
import type { RecordInteractionValues, UserListingInteraction, ListingType, RecordInteractionResult, InteractionTypeEnum } from '@/lib/types';
import { recordInteractionSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { getOrCreateConversationAction, sendMessageAction } from './chatActions'; // Import sendMessageAction

async function getListingOwnerAndTitle(listingId: string, listingType: ListingType): Promise<{ ownerId: string; title: string; slug: string } | null> {
  let sql: string;
  if (listingType === 'property') {
    sql = 'SELECT user_id, title, slug FROM properties WHERE id = ?';
  } else if (listingType === 'request') {
    sql = 'SELECT user_id, title, slug FROM property_requests WHERE id = ?';
  } else {
    return null;
  }
  const rows: any[] = await query(sql, [listingId]);
  if (rows.length > 0) {
    return { ownerId: rows[0].user_id, title: rows[0].title, slug: rows[0].slug };
  }
  return null;
}

export async function getListingInteractionDetailsAction(
  listingId: string,
  listingType: ListingType,
  userId?: string
): Promise<{ totalLikes: number; currentUserInteraction: InteractionTypeEnum | null }> {
  if (!listingId || !listingType) {
    throw new Error("listingId and listingType are required.");
  }

  let totalLikes = 0;
  let currentUserInteraction: InteractionTypeEnum | null = null;

  try {
    // Get total likes
    const tableName = listingType === 'property' ? 'properties' : 'property_requests';
    const countResult: any[] = await query(`SELECT upvotes FROM ${tableName} WHERE id = ?`, [listingId]);
    if (countResult.length > 0) {
      totalLikes = Number(countResult[0].upvotes) || 0;
    }

    // Get current user's interaction if userId is provided
    if (userId) {
      const userInteractionResult: any[] = await query(
        'SELECT interaction_type FROM user_listing_interactions WHERE user_id = ? AND listing_id = ? AND listing_type = ?',
        [userId, listingId, listingType]
      );
      if (userInteractionResult.length > 0) {
        currentUserInteraction = userInteractionResult[0].interaction_type as InteractionTypeEnum;
      }
    }
    return { totalLikes, currentUserInteraction };
  } catch (error: any) {
    console.error("[InteractionAction] Error in getListingInteractionDetailsAction:", error);
    // Return defaults or rethrow, depending on desired error handling
    return { totalLikes: 0, currentUserInteraction: null };
  }
}


export async function recordUserListingInteractionAction(
  likerUserId: string,
  values: RecordInteractionValues
): Promise<RecordInteractionResult> {
  if (!likerUserId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const validation = recordInteractionSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { listingId, listingType, interactionType: newInteractionType } = validation.data;
  const interactionId = randomUUID();
  const tableName = listingType === 'property' ? 'properties' : 'property_requests';

  try {
    // 1. Get previous interaction of the user for this item
    let previousInteractionType: InteractionTypeEnum | null = null;
    const previousInteractionRows: any[] = await query(
      'SELECT interaction_type FROM user_listing_interactions WHERE user_id = ? AND listing_id = ? AND listing_type = ?',
      [likerUserId, listingId, listingType]
    );
    if (previousInteractionRows.length > 0) {
      previousInteractionType = previousInteractionRows[0].interaction_type as InteractionTypeEnum;
    }

    // 2. Record or update the interaction in user_listing_interactions
    const upsertSql = `
      INSERT INTO user_listing_interactions (id, user_id, listing_id, listing_type, interaction_type, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        interaction_type = VALUES(interaction_type),
        created_at = NOW()
    `;
    await query(upsertSql, [interactionId, likerUserId, listingId, listingType, newInteractionType]);

    // 3. Update the upvotes count on the parent table
    let newTotalLikes = 0;
    const currentLikesResult: any[] = await query(`SELECT upvotes FROM ${tableName} WHERE id = ?`, [listingId]);
    newTotalLikes = Number(currentLikesResult[0]?.upvotes) || 0;

    if (newInteractionType === 'like') {
      if (previousInteractionType !== 'like') { // If it wasn't liked before (or no prev interaction)
        newTotalLikes++;
      }
    } else { // If the new interaction is 'dislike' or 'skip'
      if (previousInteractionType === 'like') { // And it was liked before
        newTotalLikes = Math.max(0, newTotalLikes - 1);
      }
    }
    await query(`UPDATE ${tableName} SET upvotes = ? WHERE id = ?`, [newTotalLikes, listingId]);
    
    // Match detection logic (remains the same)
    let matchDetails: RecordInteractionResult['matchDetails'] = { matchFound: false };
    if (newInteractionType === 'like') {
        const likedListingDetails = await getListingOwnerAndTitle(listingId, listingType);
        if (likedListingDetails && likerUserId !== likedListingDetails.ownerId) {
            const likedListingOwnerId = likedListingDetails.ownerId;
            const likerUserDetailsRows: any[] = await query('SELECT name FROM users WHERE id = ?', [likerUserId]);
            const likedListingOwnerDetailsRows: any[] = await query('SELECT name FROM users WHERE id = ?', [likedListingOwnerId]);
            const likerUserName = likerUserDetailsRows[0]?.name || 'Usuario';
            const likedListingOwnerName = likedListingOwnerDetailsRows[0]?.name || 'Anunciante';

            let reciprocalListingId: string | undefined;
            let reciprocalListingTitle: string | undefined;
            let conversationContext: { propertyId?: string; requestId?: string } = {};
            let likerOwnListingType: ListingType | undefined;

            if (listingType === 'property') {
                const mutualRows: any[] = await query(
                    `SELECT uli.listing_id, pr.title FROM user_listing_interactions uli
                     JOIN property_requests pr ON uli.listing_id = pr.id
                     WHERE uli.user_id = ? AND uli.listing_type = 'request' AND uli.interaction_type = 'like'
                     AND pr.user_id = ? AND pr.is_active = TRUE LIMIT 1`,
                    [likedListingOwnerId, likerUserId]
                );
                if (mutualRows.length > 0) {
                    reciprocalListingId = mutualRows[0].listing_id; 
                    reciprocalListingTitle = mutualRows[0].title;   
                    conversationContext = { propertyId: listingId, requestId: reciprocalListingId };
                    likerOwnListingType = 'request';
                }
            } else { // listingType === 'request'
                 const mutualRows: any[] = await query(
                    `SELECT uli.listing_id, p.title FROM user_listing_interactions uli
                     JOIN properties p ON uli.listing_id = p.id
                     WHERE uli.user_id = ? AND uli.listing_type = 'property' AND uli.interaction_type = 'like'
                     AND p.user_id = ? AND p.is_active = TRUE LIMIT 1`,
                    [likedListingOwnerId, likerUserId]
                );
                 if (mutualRows.length > 0) {
                    reciprocalListingId = mutualRows[0].listing_id; 
                    reciprocalListingTitle = mutualRows[0].title;  
                    conversationContext = { propertyId: reciprocalListingId, requestId: listingId };
                    likerOwnListingType = 'property';
                }
            }

            if (reciprocalListingId && reciprocalListingTitle && likerOwnListingType) {
                const conversationResult = await getOrCreateConversationAction(likerUserId, likedListingOwnerId, conversationContext);
                if (conversationResult.success && conversationResult.conversation) {
                    const likerListingTypeForMessage = likerOwnListingType === 'property' ? 'Propiedad' : 'Solicitud';
                    const likedListingTypeForMessage = listingType === 'property' ? 'Propiedad' : 'Solicitud';
                    const chatMessageContent = `¡Hola ${likedListingOwnerName}! Parece que tenemos un interés mutuo. Mi ${likerListingTypeForMessage}: "${reciprocalListingTitle}" podría interesarte, ya que parece coincidir con tu ${likedListingTypeForMessage}: "${likedListingDetails.title}".`;
                    await sendMessageAction(conversationResult.conversation.id, likerUserId, likedListingOwnerId, chatMessageContent);
                    matchDetails = { matchFound: true, conversationId: conversationResult.conversation.id, userAName: likerUserName, userBName: likedListingOwnerName, likedListingTitle: likedListingDetails.title, reciprocalListingTitle };
                }
            }
        }
    }
    
    let message = "Preferencia guardada.";
    if (newInteractionType === 'like') message = "¡Te gusta!";
    if (newInteractionType === 'dislike') message = "Preferencia 'No me gusta' guardada.";
    if (newInteractionType === 'skip') message = "Interacción omitida.";

    return {
      success: true,
      message,
      newTotalLikes,
      newInteractionType,
      matchDetails
    };

  } catch (error: any) {
    console.error("[InteractionAction] Error recording user listing interaction:", error);
    return { success: false, message: `Error al registrar interacción: ${error.message}` };
  }
}
    
