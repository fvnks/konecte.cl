// src/actions/crmActions.ts
'use server';

import { query } from '@/lib/db';
import type { Contact } from '@/lib/types';
import { addContactFormSchema, type AddContactFormValues } from '@/lib/types'; // Updated import
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// --- Contact Schemas and Actions ---
// addContactFormSchema and contactStatusValues are now imported from @/lib/types


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

    // Revalidate paths where contacts might be displayed
    // Example: A dashboard CRM section or a dedicated contacts page
    revalidatePath('/dashboard/crm');
    revalidatePath('/crm/contacts');

    const newContact: Contact = {
      id: contactId,
      user_id: userId,
      name,
      email: email || null,
      phone: phone || null,
      company_name: company_name || null,
      status,
      source: source || null,
      notes: notes || null,
      created_at: new Date().toISOString(), // Approximate, DB will have the exact time
      updated_at: new Date().toISOString(),
    };
    return { success: true, message: "Contacto añadido exitosamente.", contact: newContact };

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

// --- Interaction Schemas and Actions (to be implemented later) ---
// export const addInteractionFormSchema = z.object({...});
// export type AddInteractionFormValues = z.infer<typeof addInteractionFormSchema>;
// export async function addContactInteractionAction(...) {}
// export async function getContactInteractionsAction(...) {}

// TODO: Implement getContactByIdAction, updateContactAction, deleteContactAction
// TODO: Implement actions for contact_interactions
