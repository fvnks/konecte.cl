// src/actions/crmActions.ts
'use server';

import { db } from '@/lib/db';
import { contacts, contactInteractions } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import type { Contact, AddContactFormValues, EditContactFormValues, Interaction, AddInteractionFormValues, EditInteractionFormValues } from '@/lib/types';
import { addContactFormSchema, editContactFormSchema, addInteractionFormSchema, editInteractionFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// --- Contact Schemas and Actions ---

function mapDbRowToContact(row: any): Contact {
  return {
    id: row.id,
    user_id: row.userId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company_name: row.companyName,
    status: row.status,
    source: row.source,
    notes: row.notes,
    last_contacted_at: row.lastContactedAt ? new Date(row.lastContactedAt).toISOString() : null,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

export async function addContactAction(
  values: AddContactFormValues,
  userId: string
): Promise<{ success: boolean; message?: string; contact?: Contact }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const validation = addContactFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { name, email, phone, company_name, status, source, notes } = validation.data;
  const contactId = randomUUID();

  try {
    await db.insert(contacts).values({
      id: contactId,
      userId: userId,
      name: name,
      email: email || null,
      phone: phone || null,
      companyName: company_name || null,
      status: status,
      source: source || null,
      notes: notes || null
    });

    revalidatePath('/dashboard/crm');

    const newContactResult = await db.select().from(contacts).where(eq(contacts.id, contactId));
    if (newContactResult.length === 0) {
        return { success: false, message: "Error al crear el contacto, no se pudo recuperar." };
    }

    return { success: true, message: "Contacto añadido exitosamente.", contact: mapDbRowToContact(newContactResult[0]) };

  } catch (error: any) {
    console.error("[CrmAction] Error adding contact:", error);
    return { success: false, message: `Error al añadir contacto: ${error.message}` };
  }
}

export async function getUserContactsAction(userId: string): Promise<Contact[]> {
  if (!userId) {
    console.warn("[CrmAction] getUserContactsAction called without userId.");
    return [];
  }
  try {
    const rows = await db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(asc(contacts.name));
    return rows.map(mapDbRowToContact);
  } catch (error: any) {
    console.error(`[CrmAction] Error fetching contacts for user ${userId}:`, error);
    return [];
  }
}

export async function updateContactAction(
  contactId: string,
  values: EditContactFormValues,
  userId: string
): Promise<{ success: boolean; message?: string; contact?: Contact }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!contactId) {
    return { success: false, message: "ID de contacto no proporcionado." };
  }

  const validation = editContactFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { name, email, phone, company_name, status, source, notes } = validation.data;

  try {
    const contactCheckResult = await db.select({ userId: contacts.userId }).from(contacts).where(eq(contacts.id, contactId));

    if (contactCheckResult.length === 0) {
      return { success: false, message: "Contacto no encontrado." };
    }
    if (contactCheckResult[0].userId !== userId) {
      return { success: false, message: "No tienes permiso para editar este contacto." };
    }

    await db.update(contacts).set({
      name,
      email: email || null,
      phone: phone || null,
      companyName: company_name || null,
      status,
      source: source || null,
      notes: notes || null,
    }).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));


    revalidatePath('/dashboard/crm');

    const updatedContactResult = await db.select().from(contacts).where(eq(contacts.id, contactId));
     if (updatedContactResult.length === 0) {
        return { success: false, message: "Error al actualizar el contacto, no se pudo recuperar." };
    }

    return { success: true, message: "Contacto actualizado exitosamente.", contact: mapDbRowToContact(updatedContactResult[0]) };

  } catch (error: any) {
    console.error(`[CrmAction] Error updating contact ${contactId}:`, error);
    return { success: false, message: `Error al actualizar contacto: ${error.message}` };
  }
}

export async function deleteContactAction(
  contactId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!contactId) {
    return { success: false, message: "ID de contacto no proporcionado." };
  }

  try {
    const contactCheckResult = await db.select({ userId: contacts.userId }).from(contacts).where(eq(contacts.id, contactId));
     if (contactCheckResult.length === 0) {
      return { success: false, message: "Contacto no encontrado." };
    }
    if (contactCheckResult[0].userId !== userId) {
      return { success: false, message: "No tienes permiso para eliminar este contacto." };
    }

    await db.delete(contactInteractions).where(and(eq(contactInteractions.contactId, contactId), eq(contactInteractions.userId, userId)));

    const result = await db.delete(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

    const affectedRows = (result as any).affectedRows;
    if (affectedRows > 0) {
      revalidatePath('/dashboard/crm');
      return { success: true, message: "Contacto y sus interacciones eliminados exitosamente." };
    } else {
      return { success: false, message: "El contacto no fue encontrado o no se pudo eliminar." };
    }

  } catch (error: any) {
    console.error(`[CrmAction] Error deleting contact ${contactId}:`, error);
    return { success: false, message: `Error al eliminar contacto: ${error.message}` };
  }
}


// --- Interaction Schemas and Actions ---

function mapDbRowToInteraction(row: any): Interaction {
  const interaction = row.contact_interactions;
  return {
    id: interaction.id,
    contact_id: interaction.contactId,
    user_id: interaction.userId,
    interaction_type: interaction.interactionType,
    interaction_date: new Date(interaction.interactionDate).toISOString(),
    subject: interaction.subject,
    description: interaction.description,
    outcome: interaction.outcome,
    follow_up_needed: interaction.followUpNeeded,
    follow_up_date: interaction.followUpDate ? new Date(interaction.followUpDate).toISOString().split('T')[0] : null,
    created_at: new Date(interaction.createdAt).toISOString(),
    updated_at: new Date(interaction.updatedAt).toISOString(),
    contact_name: row.contact_name,
  };
}

export async function addContactInteractionAction(
  contactId: string,
  userId: string,
  values: AddInteractionFormValues
): Promise<{ success: boolean; message?: string; interaction?: Interaction }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!contactId) {
    return { success: false, message: "ID de contacto no proporcionado." };
  }

  const validation = addInteractionFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const {
    interaction_type,
    interaction_date,
    subject,
    description,
    outcome,
    follow_up_needed,
    follow_up_date
  } = validation.data;
  const interactionId = randomUUID();

  try {
     const contactCheckResult = await db.select({ userId: contacts.userId }).from(contacts).where(eq(contacts.id, contactId));
    if (contactCheckResult.length === 0) {
      return { success: false, message: "Contacto asociado no encontrado." };
    }
    if (contactCheckResult[0].userId !== userId) {
      return { success: false, message: "No tienes permiso para añadir interacciones a este contacto." };
    }

    await db.insert(contactInteractions).values({
      id: interactionId,
      contactId: contactId,
      userId: userId,
      interactionType: interaction_type,
      interactionDate: new Date(interaction_date),
      subject: subject || null,
      description: description,
      outcome: outcome || null,
      followUpNeeded: follow_up_needed || false,
      followUpDate: follow_up_date ? new Date(follow_up_date) : null
    });
    
    await db.update(contacts).set({ lastContactedAt: new Date(interaction_date) }).where(eq(contacts.id, contactId));

    revalidatePath(`/dashboard/crm/contact/${contactId}`);

    const newInteractionResult = await db.select({
        contact_interactions: contactInteractions,
        contact_name: contacts.name,
      })
      .from(contactInteractions)
      .leftJoin(contacts, eq(contactInteractions.contactId, contacts.id))
      .where(eq(contactInteractions.id, interactionId));

    if (newInteractionResult.length === 0) {
        return { success: false, message: "Error al crear la interacción, no se pudo recuperar." };
    }

    return { success: true, message: "Interacción añadida exitosamente.", interaction: mapDbRowToInteraction(newInteractionResult[0]) };

  } catch (error: any) {
    console.error(`[CrmAction] Error adding interaction to contact ${contactId}:`, error);
    return { success: false, message: `Error al añadir interacción: ${error.message}` };
  }
}

export async function updateContactInteractionAction(
  interactionId: string,
  userId: string,
  contactId: string,
  values: EditInteractionFormValues
): Promise<{ success: boolean; message?: string; interaction?: Interaction }> {
   if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!interactionId) {
    return { success: false, message: "ID de interacción no proporcionado." };
  }

  const validation = editInteractionFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }
  
  const {
    interaction_type,
    interaction_date,
    subject,
    description,
    outcome,
    follow_up_needed,
    follow_up_date
  } = validation.data;

  try {
    const interactionCheck = await db.select().from(contactInteractions).where(eq(contactInteractions.id, interactionId));
    if (interactionCheck.length === 0) {
        return { success: false, message: "Interacción no encontrada." };
    }
    if (interactionCheck[0].userId !== userId) {
        return { success: false, message: "No tienes permiso para editar esta interacción." };
    }
    
    await db.update(contactInteractions).set({
      interactionType: interaction_type,
      interactionDate: new Date(interaction_date),
      subject: subject || null,
      description: description,
      outcome: outcome || null,
      followUpNeeded: follow_up_needed || false,
      followUpDate: follow_up_date ? new Date(follow_up_date) : null
    }).where(eq(contactInteractions.id, interactionId));
    
    await db.update(contacts).set({ lastContactedAt: new Date(interaction_date) }).where(eq(contacts.id, contactId));

    revalidatePath(`/dashboard/crm/contact/${contactId}`);

     const updatedInteractionResult = await db.select({
        contact_interactions: contactInteractions,
        contact_name: contacts.name,
      })
      .from(contactInteractions)
      .leftJoin(contacts, eq(contactInteractions.contactId, contacts.id))
      .where(eq(contactInteractions.id, interactionId));


    if (updatedInteractionResult.length === 0) {
        return { success: false, message: "Error al actualizar la interacción, no se pudo recuperar." };
    }

    return { success: true, message: "Interacción actualizada exitosamente.", interaction: mapDbRowToInteraction(updatedInteractionResult[0]) };
  } catch (error: any) {
    console.error(`[CrmAction] Error updating interaction ${interactionId}:`, error);
    return { success: false, message: `Error al actualizar interacción: ${error.message}` };
  }
}

export async function getContactInteractionsAction(
  contactId: string,
  userId: string
): Promise<Interaction[]> {
  if (!userId) {
    console.warn("[CrmAction] getContactInteractionsAction called without userId.");
    return [];
  }
   if (!contactId) {
    console.warn("[CrmAction] getContactInteractionsAction called without contactId.");
    return [];
  }

  try {
    const contactCheck = await db.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    if (contactCheck.length === 0) {
        console.warn(`[CrmAction] User ${userId} tried to access interactions for contact ${contactId} they do not own.`);
        return [];
    }

    const rows = await db.select({
        contact_interactions: contactInteractions,
        contact_name: contacts.name,
      })
      .from(contactInteractions)
      .leftJoin(contacts, eq(contactInteractions.contactId, contacts.id))
      .where(eq(contactInteractions.contactId, contactId))
      .orderBy(desc(contactInteractions.interactionDate));

    return rows.map(mapDbRowToInteraction);
  } catch (error: any) {
    console.error(`[CrmAction] Error fetching interactions for contact ${contactId}:`, error);
    return [];
  }
}

export async function deleteInteractionAction(
  interactionId: string,
  userId: string,
  contactId: string 
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!interactionId) {
    return { success: false, message: "ID de interacción no proporcionado." };
  }

  try {
    const interactionCheck = await db.select().from(contactInteractions).where(eq(contactInteractions.id, interactionId));
    if (interactionCheck.length === 0) {
        return { success: false, message: "Interacción no encontrada." };
    }
    if (interactionCheck[0].userId !== userId) {
        return { success: false, message: "No tienes permiso para eliminar esta interacción." };
    }
    
    const result = await db.delete(contactInteractions).where(eq(contactInteractions.id, interactionId));
    
    const affectedRows = (result as any).affectedRows;
    if (affectedRows > 0) {
      revalidatePath(`/dashboard/crm/contact/${contactId}`);
      return { success: true, message: "Interacción eliminada exitosamente." };
    } else {
      return { success: false, message: "La interacción no fue encontrada o no se pudo eliminar." };
    }
  } catch (error: any) {
    console.error(`[CrmAction] Error deleting interaction ${interactionId}:`, error);
    return { success: false, message: `Error al eliminar interacción: ${error.message}` };
  }
}

export async function addAuthorToMyContactsAction(
  authorData: { id: string; name: string; email?: string | null; phone?: string | null; },
  viewerId: string
): Promise<{ success: boolean; message: string; }> {
  if (!viewerId) {
    return { success: false, message: "Debes iniciar sesión para añadir contactos." };
  }
  if (!authorData || !authorData.id || !authorData.name) {
    return { success: false, message: "Datos del autor inválidos." };
  }

  try {
    const existingContact = await db.select().from(contacts).where(and(
      eq(contacts.userId, viewerId),
      eq(contacts.sourceUserId, authorData.id)
    ));

    if (existingContact.length > 0) {
        return { success: true, message: "Este usuario ya está en tus contactos." };
    }
    
    const contactId = randomUUID();
    await db.insert(contacts).values({
      id: contactId,
      userId: viewerId,
      sourceUserId: authorData.id,
      name: authorData.name,
      email: authorData.email || null,
      phone: authorData.phone || null,
      status: 'new',
      source: 'Desde Perfil de Usuario en konecte',
    });

    revalidatePath('/dashboard/crm');

    return { success: true, message: `${authorData.name} ha sido añadido a tus contactos.` };
  } catch (error: any) {
    console.error(`[CrmAction] Error adding author ${authorData.id} to contacts for user ${viewerId}:`, error);
    // Check for unique constraint violation on email
    if (error.message && (error.message.includes('UNIQUE constraint failed: contacts.email') || error.message.includes('Duplicate entry'))) {
      const existing = await db.select().from(contacts).where(and(eq(contacts.userId, viewerId), eq(contacts.email, authorData.email!)));
      if (existing.length > 0) {
        return { success: false, message: `Ya tienes un contacto llamado "${existing[0].name}" con el correo ${authorData.email}.` };
      }
    }
    return { success: false, message: `Ocurrió un error al añadir el contacto: ${error.message}` };
  }
}
