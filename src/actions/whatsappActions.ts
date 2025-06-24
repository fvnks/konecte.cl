'use server';

import { query } from '@/lib/db';
import { getUserByIdAction } from './userActions';
import type { WhatsAppMessage } from '@/lib/types';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Obtiene la conversación de WhatsApp para un usuario específico.
 * Valida los permisos del usuario en el servidor.
 * @param userId - El ID del usuario que solicita la conversación.
 */
export async function getWhatsappConversationAction(userId: string): Promise<ActionResult<WhatsAppMessage[]>> {
  if (!userId) {
    return { success: false, message: 'ID de usuario no proporcionado.' };
  }

  try {
    // 1. Validar permisos en el servidor
    const user = await getUserByIdAction(userId);
    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    if (user.plan_whatsapp_integration_enabled !== true) {
      return { success: false, message: 'Tu plan actual no incluye acceso al chat de WhatsApp.' };
    }
    if (!user.phone_number) {
        return { success: false, message: 'Debes tener un número de teléfono verificado en tu perfil.' };
    }

    // 2. Obtener la conversación de la base de datos
    const sql = `
      SELECT id, telefono, text, sender, timestamp, status, sender_id_override
      FROM whatsapp_messages
      WHERE telefono = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    const messages: WhatsAppMessage[] = await query(sql, [user.phone_number]);

    // Devolvemos los mensajes en orden cronológico (los más antiguos primero)
    return { success: true, data: messages.reverse() };

  } catch (error) {
    console.error(`[WHATSAPP_ACTION_ERROR] getConversation:`, error);
    return { success: false, message: 'Ocurrió un error en el servidor al cargar la conversación.' };
  }
}

/**
 * Envía un mensaje desde la interfaz web al bot de WhatsApp.
 * @param senderUserId - El ID del usuario que envía el mensaje.
 * @param messageText - El contenido del mensaje.
 */
export async function sendWhatsappMessageAction(senderUserId: string, messageText: string): Promise<ActionResult<{ messageId: string }>> {
    if (!senderUserId) {
        return { success: false, message: 'ID de usuario no proporcionado.' };
    }
    if (!messageText || messageText.trim().length === 0) {
        return { success: false, message: 'El mensaje no puede estar vacío.' };
    }

    try {
        // 1. Validar permisos del usuario que envía
        const user = await getUserByIdAction(senderUserId);
        if (!user) {
            return { success: false, message: 'Usuario no encontrado.' };
        }
        if (user.plan_whatsapp_integration_enabled !== true) {
            return { success: false, message: 'Tu plan no te permite enviar mensajes.' };
        }
        if (!user.phone_number) {
            return { success: false, message: 'No tienes un número de teléfono para enviar el mensaje.' };
        }

        const botPhoneNumber = process.env.WHATSAPP_BOT_NUMBER;
        if (!botPhoneNumber) {
            console.error("[WHATSAPP_ACTION_ERROR] WHATSAPP_BOT_NUMBER no está configurado en .env");
            return { success: false, message: "La configuración del bot no está completa en el servidor." };
        }
        
        // 2. Aquí iría la lógica para comunicarse con la API de WhatsApp (Meta)
        // Por ahora, simulamos que la API externa fue llamada exitosamente.
        // En una implementación real, aquí se haría una llamada a `https://graph.facebook.com/...`
        console.log(`Simulando envío a la API de WhatsApp: De ${user.phone_number} a ${botPhoneNumber}: "${messageText}"`);

        // 3. Insertar el mensaje saliente en nuestra propia DB para mantener el historial
        const insertSql = `
            INSERT INTO whatsapp_messages (telefono, text, sender, timestamp, status, sender_id_override)
            VALUES (?, ?, 'user', ?, 'sent_from_web', ?)
        `;
        const timestamp = new Date();
        const result: any = await query(insertSql, [user.phone_number, messageText, timestamp, senderUserId]);

        if (result.insertId) {
            return { success: true, data: { messageId: result.insertId.toString() } };
        } else {
            return { success: false, message: 'El mensaje fue enviado pero no se pudo guardar en el historial.' };
        }

    } catch (error) {
        console.error(`[WHATSAPP_ACTION_ERROR] sendMessage:`, error);
        return { success: false, message: 'Ocurrió un error en el servidor al enviar el mensaje.' };
    }
} 