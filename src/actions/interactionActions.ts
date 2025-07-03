// src/actions/interactionActions.ts
'use server';

import { db } from '@/lib/db';
import { users, properties, searchRequests, userListingInteractions } from '@/lib/db/schema';
import type { RecordInteractionValues, ListingType, RecordInteractionResult, InteractionTypeEnum, ListingInteractionDetails } from '@/lib/types';
import { recordInteractionSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { getOrCreateConversationAction, sendMessageAction } from './chatActions';
import { and, eq, sql } from 'drizzle-orm';

async function getListingOwnerAndTitle(listingId: string, listingType: ListingType): Promise<{ ownerId: string; title: string; slug: string } | null> {
  const table = listingType === 'property' ? properties : searchRequests;
  // The 'any' type is used here because the table schema differs, but we select common fields.
  const result: any = await db.select({ ownerId: table.userId, title: table.title, slug: table.slug }).from(table).where(eq(table.id, listingId));
  return result[0] || null;
}

export async function getListingInteractionDetailsAction(
  listingId: string,
  listingType: ListingType,
  userId?: string
): Promise<ListingInteractionDetails> {
  if (!listingId || !listingType) {
    throw new Error("listingId and listingType are required.");
  }

  let totalLikes = 0;
  let currentUserInteraction: InteractionTypeEnum | null = null;

  try {
    const table = listingType === 'property' ? properties : searchRequests;
    const countResult = await db.select({ upvotes: table.upvotes }).from(table).where(eq(table.id, listingId));
    if (countResult.length > 0 && countResult[0].upvotes) {
      totalLikes = countResult[0].upvotes;
    }

    if (userId) {
      const userInteractionResult = await db.select({ interactionType: userListingInteractions.interactionType })
        .from(userListingInteractions)
        .where(and(
          eq(userListingInteractions.userId, userId),
          eq(userListingInteractions.listingId, listingId),
          eq(userListingInteractions.listingType, listingType)
        ));
      if (userInteractionResult.length > 0) {
        currentUserInteraction = userInteractionResult[0].interactionType;
      }
    }
    return { totalLikes, currentUserInteraction };
  } catch (error: any) {
    console.error("[InteractionAction] Error in getListingInteractionDetailsAction:", error);
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
  const table = listingType === 'property' ? properties : searchRequests;

  try {
    let previousInteractionType: InteractionTypeEnum | null = null;
    const previousInteraction = await db.select({ interactionType: userListingInteractions.interactionType})
        .from(userListingInteractions)
        .where(and(
            eq(userListingInteractions.userId, likerUserId),
            eq(userListingInteractions.listingId, listingId),
            eq(userListingInteractions.listingType, listingType)
        ));

    if (previousInteraction.length > 0) {
      previousInteractionType = previousInteraction[0].interactionType;
    }

    await db.insert(userListingInteractions)
        .values({
            id: randomUUID(),
            userId: likerUserId,
            listingId,
            listingType,
            interactionType: newInteractionType,
        })
        .onDuplicateKeyUpdate({ set: { interactionType: newInteractionType } });
    
    let likesUpdateSql;
    if (newInteractionType === 'like' && previousInteractionType !== 'like') {
        likesUpdateSql = sql`${table.upvotes} + 1`;
    } else if (newInteractionType !== 'like' && previousInteractionType === 'like') {
        likesUpdateSql = sql`GREATEST(0, ${table.upvotes} - 1)`;
    }

    if(likesUpdateSql) {
        await db.update(table).set({ upvotes: likesUpdateSql }).where(eq(table.id, listingId));
    }
    
    const finalLikesResult = await db.select({ upvotes: table.upvotes }).from(table).where(eq(table.id, listingId));
    const newTotalLikes = finalLikesResult[0]?.upvotes ?? 0;

    // Match detection logic
    let matchDetails: RecordInteractionResult['matchDetails'] = { matchFound: false };
    if (newInteractionType === 'like') {
        const likedListingDetails = await getListingOwnerAndTitle(listingId, listingType);
        if (likedListingDetails && likerUserId !== likedListingDetails.ownerId) {
            const likedListingOwnerId = likedListingDetails.ownerId;
            const likerUser = (await db.select({ name: users.name }).from(users).where(eq(users.id, likerUserId)))[0];
            const likedListingOwner = (await db.select({ name: users.name }).from(users).where(eq(users.id, likedListingOwnerId)))[0];

            const likerUserName = likerUser?.name || 'Usuario';
            const likedListingOwnerName = likedListingOwner?.name || 'Anunciante';
            
            let reciprocalListingId: string | undefined;
            let reciprocalListingTitle: string | undefined;
            let conversationContext: { propertyId?: string; requestId?: string } = {};
            let likerOwnListingType: ListingType | undefined;

            if (listingType === 'property') {
                const mutualInteraction = (await db.select({
                    listingId: userListingInteractions.listingId,
                    title: searchRequests.title
                })
                .from(userListingInteractions)
                .innerJoin(searchRequests, eq(userListingInteractions.listingId, searchRequests.id))
                .where(and(
                    eq(userListingInteractions.userId, likedListingOwnerId),
                    eq(userListingInteractions.listingType, 'request'),
                    eq(userListingInteractions.interactionType, 'like'),
                    eq(searchRequests.userId, likerUserId),
                    eq(searchRequests.isActive, true)
                )).limit(1))[0];

                if (mutualInteraction) {
                    reciprocalListingId = mutualInteraction.listingId;
                    reciprocalListingTitle = mutualInteraction.title;
                    conversationContext = { propertyId: listingId, requestId: reciprocalListingId };
                    likerOwnListingType = 'request';
                }
            } else { // listingType === 'request'
                const mutualInteraction = (await db.select({
                    listingId: userListingInteractions.listingId,
                    title: properties.title
                })
                .from(userListingInteractions)
                .innerJoin(properties, eq(userListingInteractions.listingId, properties.id))
                .where(and(
                    eq(userListingInteractions.userId, likedListingOwnerId),
                    eq(userListingInteractions.listingType, 'property'),
                    eq(userListingInteractions.interactionType, 'like'),
                    eq(properties.userId, likerUserId),
                    eq(properties.isActive, true)
                )).limit(1))[0];

                if (mutualInteraction) {
                    reciprocalListingId = mutualInteraction.listingId;
                    reciprocalListingTitle = mutualInteraction.title;
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
    


    