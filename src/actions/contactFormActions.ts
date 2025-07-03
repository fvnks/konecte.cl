// src/actions/contactFormActions.ts
'use server';

import { db } from '@/lib/db';
import { contactFormSubmissions, users } from '@/lib/db/schema';
import { eq, desc, count as dslCount, sql } from 'drizzle-orm';
import type { ContactFormSubmission, ContactFormPublicValues } from '@/lib/types';
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
    submitted_at: new Date(row.submittedAt).toISOString(),
    is_read: row.isRead,
    admin_notes: row.adminNotes,
    replied_at: row.repliedAt ? new Date(row.repliedAt).toISOString() : null,
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
    await db.insert(contactFormSubmissions).values({
      id: submissionId,
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
    });
    
    revalidatePath('/admin/contact-submissions'); // Revalidate admin page to show new submission

    return { success: true, message: 'Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.' };
  } catch (error: any) {
    console.error("[ContactFormAction] Error submitting contact form:", error);
    return { success: false, message: `Error al enviar mensaje: ${error.message}` };
  }
}

export async function getContactFormSubmissionsAction(): Promise<ContactFormSubmission[]> {
  try {
    const rows = await db.select().from(contactFormSubmissions).orderBy(desc(contactFormSubmissions.submittedAt));
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
    const result = await db.update(contactFormSubmissions).set({ isRead }).where(eq(contactFormSubmissions.id, messageId));
    // Note: Drizzle's update doesn't directly return affectedRows in the same way. We assume success if no error is thrown.
    // For MySQL with node-mysql2, result is a "ResultSetHeader" which has an affectedRows property.
    // We'll cast to any to access it, but this might need adjustment based on the exact driver output.
    const affectedRows = (result as any).affectedRows;
    if (affectedRows > 0) {
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
    const result = await db.delete(contactFormSubmissions).where(eq(contactFormSubmissions.id, messageId));
    const affectedRows = (result as any).affectedRows;
    if (affectedRows > 0) {
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
    const result = await db.select({ count: dslCount() }).from(contactFormSubmissions).where(eq(contactFormSubmissions.isRead, false));
    return result[0]?.count || 0;
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
  // ADDED LOGS FOR DEBUGGING
  console.log(`[ContactFormAction DEBUG] adminRespondToSubmissionAction called with adminUserId: "${adminUserId}", submissionId: "${submissionId}"`);

  if (!submissionId || !adminUserId || !responseText.trim()) {
    console.error('[ContactFormAction DEBUG] Missing data for adminRespondToSubmissionAction.', { submissionIdExists: !!submissionId, adminUserIdExists: !!adminUserId, responseTextPresent: !!responseText.trim() });
    return { success: false, message: "Faltan datos para procesar la respuesta (submissionId, adminUserId o responseText).", chatSent: false };
  }

  try {
    // Verify admin user exists in DB before proceeding
    const adminUserCheck = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, adminUserId));
    console.log(`[ContactFormAction DEBUG] Admin user check for ID "${adminUserId}":`, JSON.stringify(adminUserCheck));

    if (adminUserCheck.length === 0) {
      console.error(`[ContactFormAction] Admin user with ID ${adminUserId} not found in database. Cannot create chat.`);
      // Intenta guardar la nota incluso si el admin no se encuentra, para no perder la respuesta.
      try {
        await db.update(contactFormSubmissions).set({
          adminNotes: responseText,
          repliedAt: new Date(),
          isRead: true,
        }).where(eq(contactFormSubmissions.id, submissionId));
        revalidatePath('/admin/contact-submissions');
      } catch (noteError: any) {
         console.error(`[ContactFormAction DEBUG] Failed to save admin_notes for submission ${submissionId} when admin was not found:`, noteError.message);
      }
      return { 
        success: true, // Se considera éxito parcial porque la nota pudo guardarse.
        message: "Respuesta guardada como nota. Error al crear chat: El usuario administrador actual no fue encontrado en la base de datos. Por favor, cierra sesión y vuelve a iniciar sesión.",
        chatSent: false 
      };
    }
    console.log(`[ContactFormAction DEBUG] Admin user ${adminUserCheck[0].name} (ID: ${adminUserCheck[0].id}) found.`);

    const submissionRows = await db.select({ email: contactFormSubmissions.email }).from(contactFormSubmissions).where(eq(contactFormSubmissions.id, submissionId));
    if (submissionRows.length === 0) {
      console.error(`[ContactFormAction DEBUG] Submission with ID ${submissionId} not found.`);
      return { success: false, message: "Mensaje de contacto original no encontrado.", chatSent: false };
    }
    const submitterEmail = submissionRows[0].email;
    console.log(`[ContactFormAction DEBUG] Submitter email: ${submitterEmail}`);

    const userRows = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, submitterEmail));
    console.log(`[ContactFormAction DEBUG] User check for submitter email "${submitterEmail}":`, JSON.stringify(userRows));
    
    let chatSent = false;
    let messageForToast = "";

    if (userRows.length > 0) {
      const targetUserId = userRows[0].id;
      console.log(`[ContactFormAction DEBUG] Target user (submitter) ID: ${targetUserId}, Name: ${userRows[0].name}`);
      
      const conversationResult = await getOrCreateConversationAction(adminUserId, targetUserId);
      console.log(`[ContactFormAction DEBUG] getOrCreateConversationAction result:`, JSON.stringify(conversationResult));

      if (conversationResult.success && conversationResult.conversation) {
        console.log(`[ContactFormAction DEBUG] Attempting to send message to conversation ${conversationResult.conversation.id}`);
        const sendMessageResult = await sendMessageAction(
          conversationResult.conversation.id,
          adminUserId, // Sender
          targetUserId,  // Receiver
          responseText
        );
        console.log(`[ContactFormAction DEBUG] sendMessageAction result:`, JSON.stringify(sendMessageResult));
        if (sendMessageResult.success) {
          chatSent = true;
          messageForToast = "Respuesta enviada como mensaje de chat y nota guardada.";
        } else {
          messageForToast = `Respuesta guardada como nota. Error al enviar como chat: ${sendMessageResult.message}`;
        }
      } else {
        messageForToast = `Respuesta guardada como nota. Error al crear/obtener chat: ${conversationResult.message}`;
      }
    } else {
      messageForToast = "Respuesta guardada como nota. El email del remitente no corresponde a un usuario registrado, no se envió chat.";
    }

    // Actualizar el contact_form_submission
    await db.update(contactFormSubmissions).set({
      adminNotes: responseText,
      repliedAt: new Date(),
      isRead: true,
    }).where(eq(contactFormSubmissions.id, submissionId));
    console.log(`[ContactFormAction DEBUG] contact_form_submission ${submissionId} updated with notes and replied_at.`);

    revalidatePath('/admin/contact-submissions');
    return { success: true, message: messageForToast, chatSent };

  } catch (error: any) {
    console.error(`[ContactFormAction DEBUG] Error in adminRespondToSubmissionAction for submission ${submissionId}:`, error);
    // Guardar la nota como fallback si todo lo demás falla pero se pudo obtener el responseText
    try {
        await db.update(contactFormSubmissions).set({
            adminNotes: sql`COALESCE(admin_notes, "") + "\n[Error al enviar Chat] " + ${responseText}`,
            repliedAt: new Date(),
            isRead: true,
        }).where(eq(contactFormSubmissions.id, submissionId));
        revalidatePath('/admin/contact-submissions');
         console.log(`[ContactFormAction DEBUG] Fallback: admin_notes updated for submission ${submissionId} due to error.`);
    } catch (fallbackError: any) {
        console.error(`[ContactFormAction DEBUG] Fallback to save admin_notes also failed for submission ${submissionId}:`, fallbackError.message);
    }
    return { success: false, message: `Error al procesar respuesta: ${error.message}. Se intentó guardar la nota.`, chatSent: false };
  }
}

