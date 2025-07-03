// src/actions/brokerCollaborationActions.ts
'use server';

import { db } from '@/lib/db';
import {
  brokerCollaborations,
  properties,
  searchRequests,
  users,
} from '@/lib/db/schema';
import type {
  BrokerCollaboration,
  ProposePropertyFormValues,
} from '@/lib/types';
import { proposePropertyFormSchema } from '@/lib/types';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getOrCreateConversationAction, sendMessageAction } from './chatActions';
import { getUserByIdAction } from './userActions';
import { getPropertyByIdForAdminAction } from './propertyActions';
import { getRequestByIdForAdminAction } from './requestActions';

function mapDbRowToBrokerCollaboration(row: any): BrokerCollaboration {
  return {
    id: row.id,
    property_request_id: row.property_request_id,
    requesting_broker_id: row.requesting_broker_id,
    property_id: row.property_id,
    offering_broker_id: row.offering_broker_id,
    status: row.status,
    commission_terms: row.commission_terms,
    chat_conversation_id: row.chat_conversation_id,
    proposed_at: new Date(row.proposed_at).toISOString(),
    accepted_at: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
    closed_at: row.closed_at ? new Date(row.closed_at).toISOString() : null,
    updated_at: new Date(row.updated_at).toISOString(),
    property_request_title: row.request?.title,
    property_request_slug: row.request?.slug,
    requesting_broker_name: row.requestingBroker?.name,
    property_title: row.property?.title,
    property_slug: row.property?.slug,
    offering_broker_name: row.offeringBroker?.name,
  };
}

export async function proposePropertyForRequestAction(
  propertyRequestId: string,
  requestingBrokerId: string, // User who owns the property_request_id
  offeringBrokerId: string, // Logged-in user making the proposal
  values: ProposePropertyFormValues,
): Promise<{
  success: boolean;
  message?: string;
  collaboration?: BrokerCollaboration;
}> {
  if (!offeringBrokerId) {
    return { success: false, message: 'Usuario oferente no autenticado.' };
  }
  if (offeringBrokerId === requestingBrokerId) {
    return {
      success: false,
      message:
        'No puedes proponerte una propiedad a tu propia solicitud de esta manera.',
    };
  }

  const validation = proposePropertyFormSchema.safeParse(values);
  if (!validation.success) {
    return {
      success: false,
      message: 'Datos inválidos: ' + validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const { selectedPropertyId, commission_terms } = validation.data;
  const collaborationId = randomUUID();

  try {
    // Check if a collaboration for this property and request already exists
    const existingRows = await db
      .select({ id: brokerCollaborations.id })
      .from(brokerCollaborations)
      .where(
        and(
          eq(brokerCollaborations.property_request_id, propertyRequestId),
          eq(brokerCollaborations.property_id, selectedPropertyId),
        ),
      );

    if (existingRows.length > 0) {
      return {
        success: false,
        message:
          'Ya existe una propuesta de colaboración para esta propiedad y solicitud.',
      };
    }

    // Fetch details for chat message
    const offeringBroker = await getUserByIdAction(offeringBrokerId);
    const requestingBroker = await getUserByIdAction(requestingBrokerId);
    const property = await getPropertyByIdForAdminAction(selectedPropertyId);
    const request = await getRequestByIdForAdminAction(propertyRequestId);

    if (!offeringBroker || !requestingBroker || !property || !request) {
      return {
        success: false,
        message:
          'No se pudieron obtener los detalles necesarios para la propuesta.',
      };
    }

    // 1. Create Chat Conversation
    let chatConversationId: string | null = null;
    const conversationResult = await getOrCreateConversationAction(
      offeringBrokerId,
      requestingBrokerId,
      { propertyId: selectedPropertyId, requestId: propertyRequestId }, // Context of the collaboration
    );

    if (conversationResult.success && conversationResult.conversation) {
      chatConversationId = conversationResult.conversation.id;
    } else {
      console.warn(
        `[BrokerCollab] Failed to create/get chat for collaboration. Prop: ${selectedPropertyId}, Req: ${propertyRequestId}. Error: ${conversationResult.message}`,
      );
      // Proceed without chat for now, or return error if chat is critical
    }

    // 2. Insert Broker Collaboration
    await db.insert(brokerCollaborations).values({
      id: collaborationId,
      property_request_id: propertyRequestId,
      requesting_broker_id: requestingBrokerId,
      property_id: selectedPropertyId,
      offering_broker_id: offeringBrokerId,
      status: 'pending',
      commission_terms: commission_terms || null,
      chat_conversation_id: chatConversationId,
    });

    // 3. Send Initial Chat Message (if chat was created)
    if (chatConversationId) {
      const chatMessageContent = `¡Hola ${requestingBroker.name}! Te he propuesto mi propiedad "${property.title}" para tu solicitud de búsqueda "${request.title}". Podemos discutir los detalles aquí. Saludos, ${offeringBroker.name}.`;
      await sendMessageAction(
        chatConversationId,
        offeringBrokerId, // Sender is the offering broker
        requestingBrokerId, // Receiver is the requesting broker
        chatMessageContent
      );
    }

    revalidatePath('/dashboard/broker/open-requests');
    // Potentially revalidate other paths if collaborations are shown elsewhere
    revalidatePath(`/dashboard/messages/${chatConversationId}`); // Revalidate specific chat

    // Fetch the newly created collaboration to return it (optional)
    const newCollab = await getBrokerCollaborationByIdAction(collaborationId);

    return {
      success: true,
      message:
        'Propuesta de colaboración enviada exitosamente. Se ha iniciado un chat con el otro corredor.',
      collaboration: newCollab || undefined,
    };
  } catch (error: any) {
    console.error('[BrokerCollabAction] Error proposing property:', error);
    return {
      success: false,
      message: `Error al proponer propiedad: ${error.message}`,
    };
  }
}

export async function getBrokerCollaborationByIdAction(
  collaborationId: string,
): Promise<BrokerCollaboration | null> {
  if (!collaborationId) return null;
  try {
    const row = await db.query.brokerCollaborations.findFirst({
        where: eq(brokerCollaborations.id, collaborationId),
        with: {
            request: {
                columns: { title: true, slug: true }
            },
            requestingBroker: {
                columns: { name: true }
            },
            property: {
                columns: { title: true, slug: true }
            },
            offeringBroker: {
                columns: { name: true }
            }
        }
    });

    if (row) {
      return mapDbRowToBrokerCollaboration(row);
    }
    return null;
  } catch (error) {
    console.error(
      `[BrokerCollabAction] Error fetching collaboration by ID ${collaborationId}:`,
      error,
    );
    return null;
  }
}

// TODO: Add actions to get collaborations for a user (as offerer, as requester)
// TODO: Add action to update collaboration status (accept, reject, etc.)
