// src/actions/contactFormActions.ts
'use server';

import { query } from '@/lib/db';
import type { ContactFormSubmission, ContactFormPublicValues, User } from '@/lib/types';
import { contactFormPublicSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getOrCreateConversationAction, sendMessageAction } from './chatActions'; // Import chat actions

function mapDbRowToContactFormSubmission(row: any): ContactFormSubmission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    submitted_at: new Date(row.submitted_at).toISOString(),
    is_read: Boolean(row.is_read),
    admin_notes: row.admin_notes,
    replied_at: row.replied_at ? new Date(row.replied_at).toISOString() : null,
  };
}

export async function submitContactFormAction(
  values: ContactFormPublicValues
): Promise<{ success: boolean; message?: string }> {
  const validation = contactFormPublicSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, phone, subject, message } = validation.data;
  const submissionId = randomUUID();

  try {
    const sql = `
      INSERT INTO contact_form_submissions (id, name, email, phone, subject, message, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    await query(sql, [submissionId, name, email, phone || null, subject || null, message]);
    
    revalidatePath('/admin/contact-submissions'); // Revalidate admin page to show new submission

    return { success: true, message: 'Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.' };
  } catch (error: any) {
    console.error("[ContactFormAction] Error submitting contact form:", error);
    return { success: false, message: `Error al enviar mensaje: ${error.message}` };
  }
}

export async function getContactFormSubmissionsAction(): Promise<ContactFormSubmission[]> {
  try {
    const rows = await query('SELECT * FROM contact_form_submissions ORDER BY submitted_at DESC');
    if (!Array.isArray(rows)) return [];
    return rows.map(mapDbRowToContactFormSubmission);
  } catch (error: any) {
    console.error("[ContactFormAction] Error fetching contact form submissions:", error);
    return [];
  }
}

export async function markSubmissionAsActionReadAction(messageId: string, isRead: boolean): Promise<{ success: boolean; message?: string }> {
  if (!messageId) {
    return { success: false, message: "ID de mensaje no proporcionado." };
  }
  try {
    const result: any = await query('UPDATE contact_form_submissions SET is_read = ? WHERE id = ?', [isRead, messageId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/contact-submissions');
      return { success: true, message: `Mensaje marcado como ${isRead ? 'leído' : 'no leído'}.` };
    }
    return { success: false, message: "Mensaje no encontrado." };
  } catch (error: any) {
    console.error(`[ContactFormAction] Error marking submission ${messageId} as ${isRead ? 'read' : 'unread'}:`, error);
    return { success: false, message: `Error al marcar mensaje: ${error.message}` };
  }
}

export async function deleteContactSubmissionAction(messageId: string): Promise<{ success: boolean; message?: string }> {
  if (!messageId) {
    return { success: false, message: "ID de mensaje no proporcionado." };
  }
  try {
    const result: any = await query('DELETE FROM contact_form_submissions WHERE id = ?', [messageId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/contact-submissions');
      return { success: true, message: "Mensaje eliminado exitosamente." };
    }
    return { success: false, message: "Mensaje no encontrado." };
  } catch (error: any) {
    console.error(`[ContactFormAction] Error deleting submission ${messageId}:`, error);
    return { success: false, message: `Error al eliminar mensaje: ${error.message}` };
  }
}

export async function getUnreadContactSubmissionsCountAction(): Promise<number> {
  try {
    const result: any[] = await query('SELECT COUNT(*) as count FROM contact_form_submissions WHERE is_read = FALSE');
    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.error("[ContactFormAction] Error fetching unread contact submissions count:", error);
    return 0;
  }
}

export async function adminRespondToSubmissionAction(
  submissionId: string, 
  adminUserId: string, 
  responseText: string
): Promise<{ success: boolean; message: string; chatSent?: boolean }> {
  if (!submissionId || !adminUserId || !responseText.trim()) {
    return { success: false, message: "Faltan datos para procesar la respuesta.", chatSent: false };
  }

  try {
    const submissionRows: any[] = await query('SELECT email FROM contact_form_submissions WHERE id = ?', [submissionId]);
    if (submissionRows.length === 0) {
      return { success: false, message: "Mensaje de contacto original no encontrado.", chatSent: false };
    }
    const submitterEmail = submissionRows[0].email;

    const userRows: any[] = await query('SELECT id FROM users WHERE email = ?', [submitterEmail]);
    
    let chatSent = false;
    let message = "";

    if (userRows.length > 0) {
      const targetUserId = userRows[0].id;
      // Crear o obtener conversación
      const conversationResult = await getOrCreateConversationAction(adminUserId, targetUserId);
      if (conversationResult.success && conversationResult.conversation) {
        // Enviar mensaje de chat
        const sendMessageResult = await sendMessageAction(
          conversationResult.conversation.id,
          adminUserId,
          targetUserId,
          responseText
        );
        if (sendMessageResult.success) {
          chatSent = true;
          message = "Respuesta enviada como mensaje de chat y nota guardada.";
        } else {
          message = `Respuesta guardada como nota. Error al enviar como chat: ${sendMessageResult.message}`;
        }
      } else {
        message = `Respuesta guardada como nota. Error al crear/obtener chat: ${conversationResult.message}`;
      }
    } else {
      message = "Respuesta guardada como nota. El email del remitente no corresponde a un usuario registrado, no se envió chat.";
    }

    // Actualizar el contact_form_submission
    await query(
      'UPDATE contact_form_submissions SET admin_notes = ?, replied_at = NOW(), is_read = TRUE WHERE id = ?',
      [responseText, submissionId]
    );

    revalidatePath('/admin/contact-submissions');
    return { success: true, message, chatSent };

  } catch (error: any) {
    console.error(`Error responding to submission ${submissionId}:`, error);
    return { success: false, message: `Error al procesar respuesta: ${error.message}`, chatSent: false };
  }
}
