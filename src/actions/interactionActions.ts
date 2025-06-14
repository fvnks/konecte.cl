
// src/actions/interactionActions.ts
'use server';

import { query } from '@/lib/db';
import type { RecordInteractionValues, UserListingInteraction, ListingType, InteractionTypeEnum } from '@/lib/types';
import { recordInteractionSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// Helper to map DB row, though not strictly needed if we return simple success/error
function mapDbRowToUserListingInteraction(row: any): UserListingInteraction {
  return {
    id: row.id,
    user_id: row.user_id,
    listing_id: row.listing_id,
    listing_type: row.listing_type,
    interaction_type: row.interaction_type,
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function recordUserListingInteractionAction(
  userId: string,
  values: RecordInteractionValues
): Promise<{ success: boolean; message?: string; interaction?: UserListingInteraction }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const validation = recordInteractionSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { listingId, listingType, interactionType } = validation.data;
  const interactionId = randomUUID();

  try {
    // UPSERT logic: Insert or Update if a record for this user+listing+type already exists.
    // This allows a user to change their mind (e.g., from dislike to like).
    const sql = `
      INSERT INTO user_listing_interactions (id, user_id, listing_id, listing_type, interaction_type, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        interaction_type = VALUES(interaction_type),
        created_at = NOW() 
    `;
    // For ON DUPLICATE KEY UPDATE to work, (user_id, listing_id, listing_type) must be a UNIQUE KEY.
    
    await query(sql, [interactionId, userId, listingId, listingType, interactionType]);

    // Revalidate paths if needed, e.g., if interactions affect recommendations or counts.
    // For now, this action is simple and doesn't trigger revalidation of listing pages.
    // revalidatePath(`/properties/${listingId}`); (if listingType is 'property')

    // For simplicity, we are not fetching the created/updated interaction back.
    // If needed, a SELECT query could be added here.
    // The `id` used for INSERT might not be the one kept if an UPDATE occurs due to duplicate key.
    // If you need the definite ID after UPSERT, you'd typically query for it.

    return {
      success: true,
      message: `Interacción (${interactionType}) registrada para el listado ${listingId}.`,
      // interaction: { id: interactionId, user_id: userId, listing_id: listingId, listing_type: listingType, interaction_type: interactionType, created_at: new Date().toISOString() } // Simplified return
    };

  } catch (error: any) {
    console.error("[InteractionAction] Error recording user listing interaction:", error);
    return { success: false, message: `Error al registrar interacción: ${error.message}` };
  }
}

// Future action: Get all listing IDs a user has interacted with for a given type.
// export async function getUserInteractedListingIdsAction(userId: string, listingType: ListingType): Promise<string[]> {
//   if (!userId) return [];
//   try {
//     const rows: { listing_id: string }[] = await query(
//       'SELECT listing_id FROM user_listing_interactions WHERE user_id = ? AND listing_type = ?',
//       [userId, listingType]
//     );
//     return rows.map(row => row.listing_id);
//   } catch (error: any) {
//     console.error(`Error fetching interacted listing IDs for user ${userId}, type ${listingType}:`, error);
//     return [];
//   }
// }

    