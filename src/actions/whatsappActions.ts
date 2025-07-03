'use server';

import { getUserByIdAction } from './userActions';
import type { WhatsAppMessage } from '@/lib/types';
import { db } from '@/lib/db';
import { whatsappMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const messages = await db.select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.telefono, user.phone_number))
        .orderBy(desc(whatsappMessages.timestamp))
        .limit(50);
    
    const formattedMessages: WhatsAppMessage[] = messages.map(m => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString()
    }))

    // Devolvemos los mensajes en orden cronológico (los más antiguos primero)
    return { success: true, data: formattedMessages.reverse() };

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
        // console.log(`Simulando envío a la API de WhatsApp: De ${user.phone_number} a ${botPhoneNumber}: "${messageText}"`);

        // Llamada directa al webhook del bot
        const webhookUrl = 'https://konecte.fedestore.cl/api/webhooks/konecte-incoming';
        console.log(`[WEB_CHAT] Enviando mensaje al webhook del bot: ${webhookUrl}`);
        
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'konecte-web',
                    userId: senderUserId,
                    messageText: messageText
                })
            });
        } catch (webhookError) {
            console.error('[WEB_CHAT] Error al llamar al webhook del bot:', webhookError);
            // No bloqueamos al usuario si el webhook falla, pero lo registramos.
        }

        // 3. Insertar el mensaje saliente en nuestra propia DB para mantener el historial
        const timestamp = new Date();
        const result = await db.insert(whatsappMessages).values({
            telefono: user.phone_number,
            text: messageText,
            sender: 'user',
            timestamp: timestamp,
            status: 'sent_from_web',
            senderIdOverride: senderUserId,
        });

        const messageId = result.insertId;

        if (messageId) {
            return { success: true, data: { messageId: messageId.toString() } };
        } else {
            return { success: false, message: 'El mensaje fue enviado pero no se pudo guardar en el historial.' };
        }

    } catch (error) {
        console.error(`[WHATSAPP_ACTION_ERROR] sendMessage:`, error);
        return { success: false, message: 'Ocurrió un error en el servidor al enviar el mensaje.' };
    }
}

/**
 * Elimina toda la conversación de WhatsApp para un usuario específico.
 * @param userId - El ID del usuario cuya conversación será eliminada.
 */
export async function deleteWhatsappConversationAction(userId: string): Promise<ActionResult<{ deletedCount: number }>> {
    if (!userId) {
        return { success: false, message: 'ID de usuario no proporcionado.' };
    }

    try {
        // 1. Obtener el número de teléfono del usuario para asegurar que solo borramos sus mensajes.
        const user = await getUserByIdAction(userId);
        if (!user?.phone_number) {
            return { success: false, message: 'Usuario o número de teléfono no encontrado.' };
        }

        // 2. Ejecutar la sentencia DELETE
        const result = await db.delete(whatsappMessages).where(eq(whatsappMessages.telefono, user.phone_number));

        const deletedCount = result.rowsAffected || 0;
        console.log(`[WHATSAPP_ACTION] Conversación eliminada para el usuario ${userId} (teléfono: ${user.phone_number}). Mensajes eliminados: ${deletedCount}`);

        return { success: true, data: { deletedCount } };

    } catch (error) {
        console.error(`[WHATSAPP_ACTION_ERROR] deleteConversation:`, error);
        return { success: false, message: 'Ocurrió un error en el servidor al eliminar la conversación.' };
    }
} 