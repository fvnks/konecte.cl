
// src/actions/interactionActions.ts
'use server';

import { query } from '@/lib/db';
import type { RecordInteractionValues, UserListingInteraction, ListingType, RecordInteractionResult, User } from '@/lib/types';
import { recordInteractionSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getOrCreateConversationAction } from './chatActions'; // Import chat action

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

  const { listingId: likedListingId, listingType: likedListingType, interactionType } = validation.data;
  const interactionId = randomUUID();

  try {
    const upsertSql = `
      INSERT INTO user_listing_interactions (id, user_id, listing_id, listing_type, interaction_type, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        interaction_type = VALUES(interaction_type),
        created_at = NOW()
    `;
    await query(upsertSql, [interactionId, likerUserId, likedListingId, likedListingType, interactionType]);

    // If it's not a 'like', we don't need to check for mutual match
    if (interactionType !== 'like') {
      return {
        success: true,
        message: `Interacción (${interactionType}) registrada para el listado ${likedListingId}.`,
        // We might need to fetch the actual interaction ID if UPSERT updated, but for now, this is fine.
        interaction: { id: interactionId, user_id: likerUserId, listing_id: likedListingId, listing_type: likedListingType, interaction_type: interactionType, created_at: new Date().toISOString() }
      };
    }

    // --- Mutual Match Detection Logic (for 'like' interactions) ---
    const likedListingDetails = await getListingOwnerAndTitle(likedListingId, likedListingType);
    if (!likedListingDetails) {
      console.warn(`[InteractionAction] Owner not found for liked listing ${likedListingId} (${likedListingType}). Cannot check for mutual match.`);
      return { success: true, message: "Preferencia guardada. No se pudo verificar el match mutuo (dueño del listado no encontrado)." };
    }
    const likedListingOwnerId = likedListingDetails.ownerId;
    const likedListingTitle = likedListingDetails.title;

    if (likerUserId === likedListingOwnerId) {
      return { success: true, message: "Preferencia guardada (auto-like)." }; // User liked their own listing
    }

    let mutualLikeFound = false;
    let reciprocalListingId: string | undefined;
    let reciprocalListingTitle: string | undefined;
    let conversationContext: { propertyId?: string; requestId?: string } = {};

    const likerUserDetailsRows: User[] = await query('SELECT name FROM users WHERE id = ?', [likerUserId]);
    const likedListingOwnerDetailsRows: User[] = await query('SELECT name FROM users WHERE id = ?', [likedListingOwnerId]);
    const likerUserName = likerUserDetailsRows[0]?.name || 'Usuario';
    const likedListingOwnerName = likedListingOwnerDetailsRows[0]?.name || 'Anunciante';


    if (likedListingType === 'property') { // Liker liked a Property
      // Check if likedListingOwnerId (property owner) liked any Request by likerUserId
      const mutualLikeQuery = `
        SELECT uli.listing_id, pr.title
        FROM user_listing_interactions uli
        JOIN property_requests pr ON uli.listing_id = pr.id
        WHERE uli.user_id = ?                   -- Property owner (likedListingOwnerId)
          AND uli.listing_type = 'request'
          AND uli.interaction_type = 'like'
          AND pr.user_id = ?                    -- Original liker (likerUserId)
          AND pr.is_active = TRUE               -- Only match active requests
        LIMIT 1;
      `;
      const mutualRows: any[] = await query(mutualLikeQuery, [likedListingOwnerId, likerUserId]);
      if (mutualRows.length > 0) {
        mutualLikeFound = true;
        reciprocalListingId = mutualRows[0].listing_id;
        reciprocalListingTitle = mutualRows[0].title;
        conversationContext = { propertyId: likedListingId, requestId: reciprocalListingId };
      }
    } else { // Liker liked a Request
      // Check if likedListingOwnerId (request owner) liked any Property by likerUserId
      const mutualLikeQuery = `
        SELECT uli.listing_id, p.title
        FROM user_listing_interactions uli
        JOIN properties p ON uli.listing_id = p.id
        WHERE uli.user_id = ?                   -- Request owner (likedListingOwnerId)
          AND uli.listing_type = 'property'
          AND uli.interaction_type = 'like'
          AND p.user_id = ?                     -- Original liker (likerUserId)
          AND p.is_active = TRUE                -- Only match active properties
        LIMIT 1;
      `;
      const mutualRows: any[] = await query(mutualLikeQuery, [likedListingOwnerId, likerUserId]);
      if (mutualRows.length > 0) {
        mutualLikeFound = true;
        reciprocalListingId = mutualRows[0].listing_id;
        reciprocalListingTitle = mutualRows[0].title;
        conversationContext = { propertyId: reciprocalListingId, requestId: likedListingId };
      }
    }

    if (mutualLikeFound) {
      const conversationResult = await getOrCreateConversationAction(
        likerUserId,
        likedListingOwnerId,
        conversationContext
      );

      if (conversationResult.success && conversationResult.conversation) {
        // Revalidate paths related to messages
        revalidatePath('/dashboard/messages');
        revalidatePath(`/dashboard/messages/${conversationResult.conversation.id}`);
        // Notify client to update message counts, e.g., via a custom event if Navbar is listening
        // Or, a more robust solution would be server-sent events or websockets for real-time.

        return {
          success: true,
          message: "¡Es un Match Mutuo! Se ha creado o encontrado una conversación.",
          matchDetails: {
            matchFound: true,
            conversationId: conversationResult.conversation.id,
            userAName: likerUserName,
            userBName: likedListingOwnerName,
            likedListingTitle: likedListingTitle,
            reciprocalListingTitle: reciprocalListingTitle,
          }
        };
      } else {
        console.error("[InteractionAction] Mutual match found, but failed to create/get conversation:", conversationResult.message);
        return {
          success: true, // Interaction was saved, but chat creation failed
          message: "Preferencia guardada. Hubo un problema al iniciar el chat para el match.",
          matchDetails: { matchFound: true } // Indicate match was found, but no conversation ID
        };
      }
    }

    return {
      success: true,
      message: "Preferencia guardada.",
      matchDetails: { matchFound: false }
    };

  } catch (error: any) {
    console.error("[InteractionAction] Error recording user listing interaction:", error);
    return { success: false, message: `Error al registrar interacción: ${error.message}` };
  }
}
