// src/actions/brokerCollaborationActions.ts
'use server';

import { query } from '@/lib/db';
import type { BrokerCollaboration, ProposePropertyFormValues } from '@/lib/types';
import { proposePropertyFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getOrCreateConversationAction, sendMessageAction } from './chatActions';
import { getUserByIdAction } from './userActions';
import { getPropertyByIdForAdminAction } from './propertyActions'; // Re-usar para obtener título
import { getRequestByIdForAdminAction } from './requestActions';   // Re-usar para obtener título

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
    property_request_title: row.property_request_title,
    property_request_slug: row.property_request_slug,
    requesting_broker_name: row.requesting_broker_name,
    property_title: row.property_title,
    property_slug: row.property_slug,
    offering_broker_name: row.offering_broker_name,
  };
}

export async function proposePropertyForRequestAction(
  propertyRequestId: string,
  requestingBrokerId: string, // User who owns the property_request_id
  offeringBrokerId: string, // Logged-in user making the proposal
  values: ProposePropertyFormValues
): Promise<{ success: boolean; message?: string; collaboration?: BrokerCollaboration }> {
  if (!offeringBrokerId) {
    return { success: false, message: "Usuario oferente no autenticado." };
  }
  if (offeringBrokerId === requestingBrokerId) {
    return { success: false, message: "No puedes proponerte una propiedad a tu propia solicitud de esta manera." };
  }

  const validation = proposePropertyFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { selectedPropertyId, commission_terms } = validation.data;
  const collaborationId = randomUUID();

  try {
    // Check if a collaboration for this property and request already exists
    const existingCollabSql = 'SELECT id FROM broker_collaborations WHERE property_request_id = ? AND property_id = ?';
    const existingRows: any[] = await query(existingCollabSql, [propertyRequestId, selectedPropertyId]);
    if (existingRows.length > 0) {
      return { success: false, message: "Ya existe una propuesta de colaboración para esta propiedad y solicitud." };
    }

    // Fetch details for chat message
    const offeringBroker = await getUserByIdAction(offeringBrokerId);
    const requestingBroker = await getUserByIdAction(requestingBrokerId);
    const property = await getPropertyByIdForAdminAction(selectedPropertyId);
    const request = await getRequestByIdForAdminAction(propertyRequestId);

    if (!offeringBroker || !requestingBroker || !property || !request) {
        return { success: false, message: "No se pudieron obtener los detalles necesarios para la propuesta." };
    }

    // 1. Create Chat Conversation
    let chatConversationId: string | null = null;
    const conversationResult = await getOrCreateConversationAction(
      offeringBrokerId,
      requestingBrokerId,
      { propertyId: selectedPropertyId, requestId: propertyRequestId } // Context of the collaboration
    );

    if (conversationResult.success && conversationResult.conversation) {
      chatConversationId = conversationResult.conversation.id;
    } else {
      console.warn(`[BrokerCollab] Failed to create/get chat for collaboration. Prop: ${selectedPropertyId}, Req: ${propertyRequestId}. Error: ${conversationResult.message}`);
      // Proceed without chat for now, or return error if chat is critical
    }

    // 2. Insert Broker Collaboration
    const insertSql = `
      INSERT INTO broker_collaborations (
        id, property_request_id, requesting_broker_id, property_id, offering_broker_id, 
        status, commission_terms, chat_conversation_id, proposed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())
    `;
    await query(insertSql, [
      collaborationId, propertyRequestId, requestingBrokerId, selectedPropertyId, offeringBrokerId,
      commission_terms || null, chatConversationId
    ]);

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
        message: "Propuesta de colaboración enviada exitosamente. Se ha iniciado un chat con el otro corredor.",
        collaboration: newCollab || undefined
    };

  } catch (error: any) {
    console.error("[BrokerCollabAction] Error proposing property:", error);
    return { success: false, message: `Error al proponer propiedad: ${error.message}` };
  }
}


export async function getBrokerCollaborationByIdAction(collaborationId: string): Promise<BrokerCollaboration | null> {
  if (!collaborationId) return null;
  try {
    const sql = `
      SELECT 
        bc.*,
        pr.title as property_request_title,
        pr.slug as property_request_slug,
        u_req.name as requesting_broker_name,
        p.title as property_title,
        p.slug as property_slug,
        u_off.name as offering_broker_name
      FROM broker_collaborations bc
      JOIN property_requests pr ON bc.property_request_id = pr.id
      JOIN users u_req ON bc.requesting_broker_id = u_req.id
      JOIN properties p ON bc.property_id = p.id
      JOIN users u_off ON bc.offering_broker_id = u_off.id
      WHERE bc.id = ?
    `;
    const rows: any[] = await query(sql, [collaborationId]);
    if (rows.length > 0) {
      return mapDbRowToBrokerCollaboration(rows[0]);
    }
    return null;
  } catch (error) {
    console.error(`[BrokerCollabAction] Error fetching collaboration by ID ${collaborationId}:`, error);
    return null;
  }
}

// TODO: Add actions to get collaborations for a user (as offerer, as requester)
// TODO: Add action to update collaboration status (accept, reject, etc.)
