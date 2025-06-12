
// src/actions/crmActions.ts
'use server';

import { query } from '@/lib/db';
import type { Contact, AddContactFormValues, EditContactFormValues, Interaction, AddInteractionFormValues } from '@/lib/types'; 
import { addContactFormSchema, editContactFormSchema, addInteractionFormSchema } from '@/lib/types'; 
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// --- Contact Schemas and Actions ---

function mapDbRowToContact(row: any): Contact {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company_name: row.company_name,
    status: row.status,
    source: row.source,
    notes: row.notes,
    last_contacted_at: row.last_contacted_at ? new Date(row.last_contacted_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
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
    const sql = `
      INSERT INTO contacts (
        id, user_id, name, email, phone, company_name,
        status, source, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      contactId, userId, name,
      email || null,
      phone || null,
      company_name || null,
      status,
      source || null,
      notes || null
    ];

    await query(sql, params);

    revalidatePath('/dashboard/crm'); 
    // revalidatePath(`/admin/users/${userId}/crm`); 

    const newContactResult = await query('SELECT * FROM contacts WHERE id = ?', [contactId]);
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
    const sql = `
      SELECT * FROM contacts
      WHERE user_id = ?
      ORDER BY name ASC
    `;
    const rows = await query(sql, [userId]);
    if (!Array.isArray(rows)) {
        console.error("[CrmAction] Expected array from getUserContactsAction query, got:", typeof rows);
        return [];
    }
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
    const contactCheck = await query('SELECT id, user_id FROM contacts WHERE id = ?', [contactId]);
    if (contactCheck.length === 0) {
      return { success: false, message: "Contacto no encontrado." };
    }
    if (contactCheck[0].user_id !== userId) {
      return { success: false, message: "No tienes permiso para editar este contacto." };
    }

    const sql = `
      UPDATE contacts SET
        name = ?, email = ?, phone = ?, company_name = ?,
        status = ?, source = ?, notes = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    const params = [
      name,
      email || null,
      phone || null,
      company_name || null,
      status,
      source || null,
      notes || null,
      contactId,
      userId
    ];

    await query(sql, params);

    revalidatePath('/dashboard/crm');
    // revalidatePath(`/admin/users/${userId}/crm`);

    const updatedContactResult = await query('SELECT * FROM contacts WHERE id = ?', [contactId]);
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
    const contactCheck = await query('SELECT id, user_id FROM contacts WHERE id = ?', [contactId]);
     if (contactCheck.length === 0) {
      return { success: false, message: "Contacto no encontrado." };
    }
    if (contactCheck[0].user_id !== userId) {
      return { success: false, message: "No tienes permiso para eliminar este contacto." };
    }
    
    const result: any = await query('DELETE FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
    
    if (result.affectedRows > 0) {
      revalidatePath('/dashboard/crm');
      return { success: true, message: "Contacto eliminado exitosamente." };
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
  return {
    id: row.id,
    contact_id: row.contact_id,
    user_id: row.user_id,
    interaction_type: row.interaction_type,
    interaction_date: new Date(row.interaction_date).toISOString(),
    subject: row.subject,
    description: row.description,
    outcome: row.outcome,
    follow_up_needed: Boolean(row.follow_up_needed),
    follow_up_date: row.follow_up_date ? new Date(row.follow_up_date).toISOString().split('T')[0] : null, // Date only
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    contact_name: row.contact_name, // If joined
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
    follow_up_date,
  } = validation.data;
  const interactionId = randomUUID();

  try {
    // Verify contact belongs to user
    const contactCheck = await query('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
    if (contactCheck.length === 0) {
      return { success: false, message: "Contacto no encontrado o no tienes permiso para añadir interacciones." };
    }

    const sql = `
      INSERT INTO contact_interactions (
        id, contact_id, user_id, interaction_type, interaction_date,
        subject, description, outcome, follow_up_needed, follow_up_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      interactionId, contactId, userId, interaction_type,
      new Date(interaction_date), // Ensure it's a Date object for DB
      subject || null,
      description,
      outcome || null,
      follow_up_needed,
      follow_up_date ? new Date(follow_up_date) : null, // Ensure it's a Date object or null
    ];

    await query(sql, params);
    
    // Also update last_contacted_at on the contact
    await query('UPDATE contacts SET last_contacted_at = ? WHERE id = ? AND user_id = ?', [new Date(interaction_date), contactId, userId]);


    revalidatePath(`/dashboard/crm`); // Or more specific path if interactions are on a detail page

    const newInteractionResult = await query('SELECT * FROM contact_interactions WHERE id = ?', [interactionId]);
    if (newInteractionResult.length === 0) {
        return { success: false, message: "Error al añadir la interacción, no se pudo recuperar." };
    }
    
    return { success: true, message: "Interacción añadida exitosamente.", interaction: mapDbRowToInteraction(newInteractionResult[0]) };

  } catch (error: any) {
    console.error("[CrmAction] Error adding contact interaction:", error);
    return { success: false, message: `Error al añadir interacción: ${error.message}` };
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
    // Verify contact belongs to user before fetching interactions for security/privacy
    const contactCheck = await query('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
    if (contactCheck.length === 0) {
      console.warn(`[CrmAction] Attempt to fetch interactions for contact ${contactId} not belonging to user ${userId}.`);
      return []; // Or throw an error
    }

    const sql = `
      SELECT ci.* 
      FROM contact_interactions ci
      WHERE ci.contact_id = ? AND ci.user_id = ? 
      ORDER BY ci.interaction_date DESC, ci.created_at DESC
    `;
    const rows = await query(sql, [contactId, userId]);
    if (!Array.isArray(rows)) {
        console.error("[CrmAction] Expected array from getContactInteractionsAction query, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToInteraction);
  } catch (error: any) {
    console.error(`[CrmAction] Error fetching interactions for contact ${contactId}:`, error);
    return [];
  }
}
