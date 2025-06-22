// src/actions/otpActions.ts
'use server';

import { query } from '@/lib/db';
import { z } from 'zod';
import type { User, SendMessageToBotPayload, WhatsAppMessage } from '@/lib/types';
import { addMessageToConversation } from '@/lib/whatsappBotStore';

const OTP_LENGTH = 4;
const OTP_EXPIRATION_MINUTES = 5;

/**
 * Generates a random numeric OTP of a specified length.
 */
function generateOtpCode(length: number = OTP_LENGTH): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Sends a generic message via the WhatsApp webhook.
 *
 * @param phoneNumber The user's phone number to send the message to.
 * @param messageText The text of the message.
 * @param userId The Konecte user's ID for context.
 * @returns Promise resolving to an object indicating success or failure.
 */
export async function sendGenericWhatsAppMessageAction(
  phoneNumber: string,
  messageText: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[WhatsAppAction] Attempting to send message to user ${userId} (phone: ${phoneNumber}).`);

  // TODO: Revert this to use process.env.WHATSAPP_BOT_UBUNTU_WEBHOOK_URL once the environment variable is corrected in Vercel.
  const ubuntuBotWebhookUrl = 'https://konecte.fedestore.cl/api/webhooks/konecte-incoming';
  
  if (!ubuntuBotWebhookUrl) {
    const errorMessage = "[WhatsAppAction CRITICAL] La URL del webhook del bot no está configurada.";
    console.error(errorMessage);
    return { success: false, message: "Error de configuración del servidor: El endpoint del bot de WhatsApp no está definido." };
  }

  try {
    // Optionally log this system-sent message to the internal store for admin viewing
    addMessageToConversation(phoneNumber, {
      text: `[SISTEMA->${phoneNumber}] ${messageText}`,
      sender: 'bot',
      status: 'pending_to_whatsapp',
      sender_id_override: 'system_notification',
    });

    const webhookPayload = {
      konecteUserId: userId,
      targetUserWhatsAppNumber: phoneNumber,
      messageText: messageText,
    };

    console.log(`[WhatsAppAction] Enviando POST al webhook de Ubuntu: ${ubuntuBotWebhookUrl} con payload:`, JSON.stringify(webhookPayload));

    const webhookResponse = await fetch(ubuntuBotWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      const errorMessage = `Error al enviar al webhook. Status: ${webhookResponse.status}. Body: ${errorBody}`;
      console.error(`[WhatsAppAction ERROR] ${errorMessage}`);
      return { success: false, message: `Error al contactar el webhook del bot: ${webhookResponse.statusText}.` };
    }

    const webhookResult = await webhookResponse.json();
    console.log('[WhatsAppAction SUCCESS] Respuesta del webhook de Ubuntu:', webhookResult);
    
    return { success: true, message: "Mensaje enviado a WhatsApp." };

  } catch (error: any) {
    let errorMessage = `Excepción al contactar el servicio de mensajería: ${error.message}`;
    if (error.cause || (error.message && error.message.toLowerCase().includes('fetch failed'))) {
        errorMessage = `Error de red al contactar el servicio de mensajería. Esto puede ser un firewall o un problema de red en el servidor del bot. URL: ${ubuntuBotWebhookUrl}`;
    }
    console.error(`[WhatsAppAction ERROR] ${errorMessage}`, error.stack);
    return { success: false, message: errorMessage };
  }
}


export async function generateAndSendOtpAction(
  userId: string
): Promise<{ success: boolean; message?: string; phone_number_ending?: string }> {
  try {
    const users: User[] = await query('SELECT id, phone_number, name FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    const user = users[0];

    if (!user.phone_number) {
      return { success: false, message: 'El usuario no tiene un número de teléfono registrado.' };
    }

    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    await query(
      'UPDATE users SET phone_otp = ?, phone_otp_expires_at = ?, phone_verified = FALSE WHERE id = ?',
      [otp, expiresAt, userId]
    );
    
    const phoneNumberEnding = user.phone_number.length >= 4 ? user.phone_number.slice(-4) : user.phone_number;

    const otpMessageText = `Hola ${user.name}, tu código de verificación para Konecte es: ${otp}. Este código expira en ${OTP_EXPIRATION_MINUTES} minutos.`;
    const sendResult = await sendGenericWhatsAppMessageAction(user.phone_number, otpMessageText, user.id);

    if (!sendResult.success) {
      console.error(`[OTP_ACTION_ERROR] OTP stored for user ${userId}, but failed to send via webhook: ${sendResult.message}`);
      return { 
        success: false, 
        message: sendResult.message || "No se pudo procesar el envío del código OTP. Intenta reenviar.", 
        phone_number_ending: phoneNumberEnding 
      };
    }

    return {
        success: true,
        message: 'Se está procesando el envío de un código OTP a tu número de teléfono.',
        phone_number_ending: phoneNumberEnding
    };

  } catch (error: any) {
    console.error('[OTPAction Error] generateAndSendOtpAction:', error);
    return { success: false, message: 'Error del servidor al generar o enviar el código OTP.' };
  }
}

export async function verifyOtpAction(
  userId: string,
  otpEntered: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const users: User[] = await query(
      'SELECT id, phone_otp, phone_otp_expires_at, phone_verified FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    const user = users[0];

    if (user.phone_verified) {
      return { success: true, message: 'El número de teléfono ya ha sido verificado.' };
    }

    if (!user.phone_otp || !user.phone_otp_expires_at) {
      await query('UPDATE users SET phone_otp = NULL, phone_otp_expires_at = NULL WHERE id = ?', [userId]);
      return { success: false, message: 'No hay un OTP pendiente para este usuario. Por favor, solicita uno nuevo.' };
    }

    if (new Date(user.phone_otp_expires_at) < new Date()) {
      await query('UPDATE users SET phone_otp = NULL, phone_otp_expires_at = NULL WHERE id = ?', [userId]);
      return { success: false, message: 'El código OTP ha expirado. Por favor, solicita uno nuevo.' };
    }

    if (user.phone_otp !== otpEntered) {
      // Optional: Implement attempt tracking here to prevent brute-forcing
      return { success: false, message: 'El código OTP ingresado es incorrecto.' };
    }

    // OTP is correct and not expired
    await query(
      'UPDATE users SET phone_verified = TRUE, phone_otp = NULL, phone_otp_expires_at = NULL WHERE id = ?',
      [userId]
    );

    return { success: true, message: '¡Número de teléfono verificado exitosamente!' };

  } catch (error: any) {
    console.error('[OTPAction Error] verifyOtpAction:', error);
    return { success: false, message: 'Error del servidor al verificar el código OTP.' };
  }
}
