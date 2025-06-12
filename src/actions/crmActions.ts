// src/actions/crmActions.ts
'use server';

import { query } from '@/lib/db';
import type { Contact, AddContactFormValues, EditContactFormValues } from '@/lib/types'; 
import { addContactFormSchema, editContactFormSchema } from '@/lib/types'; 
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
    const contactCheck = await query('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
    if (contactCheck.length === 0) {
      return { success: false, message: "Contacto no encontrado o no tienes permiso para editarlo." };
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
    const contactCheck = await query('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
    if (contactCheck.length === 0) {
      return { success: false, message: "Contacto no encontrado o no tienes permiso para eliminarlo." };
    }

    // Consider if related contact_interactions should be deleted by ON DELETE CASCADE on the FK, or manually here.
    // Assuming ON DELETE CASCADE for contact_interactions.contact_id is set.
    const result: any = await query('DELETE FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
    
    if (result.affectedRows > 0) {
      revalidatePath('/dashboard/crm');
      // revalidatePath(`/admin/users/${userId}/crm`); // If admin view needs revalidation
      return { success: true, message: "Contacto eliminado exitosamente." };
    } else {
      // Should not happen if contactCheck passed, but good for robustness
      return { success: false, message: "El contacto no fue encontrado o no se pudo eliminar." };
    }

  } catch (error: any) {
    console.error(`[CrmAction] Error deleting contact ${contactId}:`, error);
    return { success: false, message: `Error al eliminar contacto: ${error.message}` };
  }
}


// --- Interaction Schemas and Actions (to be implemented later) ---
// export const addInteractionFormSchema = z.object({...});
// export type AddInteractionFormValues = z.infer<typeof addInteractionFormSchema>;
// export async function addContactInteractionAction(...) {}
// export async function getContactInteractionsAction(...) {}

// TODO: Implement getContactByIdAction
