// src/actions/otpActions.ts
'use server';

import { query } from '@/lib/db';
import { z } from 'zod';
import type { User, SendMessageToBotPayload } from '@/lib/types';
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
 * Sends the OTP via WhatsApp by calling the external WhatsApp bot webhook directly.
 *
 * @param phoneNumber The user's phone number to send the OTP to.
 * @param otp The One-Time Password.
 * @param userName The user's name, for a personalized message.
 * @param userId The user's ID.
 * @returns Promise resolving to an object indicating success or failure.
 */
async function sendOtpViaWhatsApp(
  phoneNumber: string,
  otp: string,
  userName: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[OTP_ACTION Direct] Attempting to send OTP to user ${userId} (phone: ${phoneNumber}). OTP: ${otp}`);

  const otpMessageText = `Hola ${userName}, tu código de verificación para Konecte es: ${otp}. Este código expira en ${OTP_EXPIRATION_MINUTES} minutos.`;
  
  // Get the external bot's webhook URL from environment variables
  const ubuntuBotWebhookUrl = process.env.WHATSAPP_BOT_UBUNTU_WEBHOOK_URL;
  if (!ubuntuBotWebhookUrl) {
    const errorMessage = "[OTP_ACTION CRITICAL] WHATSAPP_BOT_UBUNTU_WEBHOOK_URL no está configurado. No se puede contactar al bot externo.";
    console.error(errorMessage);
    return { success: false, message: "Error de configuración del servidor: El endpoint del bot de WhatsApp no está definido." };
  }

  try {
    // 1. (Optional but good practice) Add a system message to the local chat history for UI purposes.
    // This helps in the WhatsApp chat viewer to see when system messages like OTPs were sent.
    addMessageToConversation(phoneNumber, {
      text: `[SISTEMA] Se envió un código OTP: ${otp}`,
      sender: 'bot', // From the user's perspective, it's from the bot/system
      status: 'pending_to_whatsapp',
      sender_id_override: 'system_otp', // Special identifier
    });
    console.log(`[OTP_ACTION Direct] System message for OTP stored in local chat history for ${phoneNumber}.`);

    // 2. Prepare and send the payload to the external Ubuntu bot webhook
    const webhookPayload = {
      konecteUserId: userId,
      targetUserWhatsAppNumber: phoneNumber, // The user's number
      messageText: otpMessageText,          // The OTP message
    };

    console.log(`[OTP_ACTION Direct] Enviando POST al webhook de Ubuntu: ${ubuntuBotWebhookUrl} con payload:`, JSON.stringify(webhookPayload));

    const webhookResponse = await fetch(ubuntuBotWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      const errorMessage = `Error al enviar al webhook de Ubuntu. Status: ${webhookResponse.status}. Body: ${errorBody}`;
      console.error(`[OTP_ACTION Direct ERROR] ${errorMessage}`);
      return { success: false, message: `Error al contactar el webhook del bot: ${webhookResponse.statusText}.` };
    }

    const webhookResult = await webhookResponse.json();
    console.log('[OTP_ACTION Direct SUCCESS] Respuesta del webhook de Ubuntu:', webhookResult);
    
    return { success: true, message: "El código OTP ha sido enviado a tu WhatsApp." };

  } catch (error: any) {
    let errorMessage = `Excepción al contactar el servicio de mensajería: ${error.message}`;
    if (error.message && error.message.toLowerCase().includes('fetch failed')) {
        errorMessage = "Error interno del servidor al enviar mensaje al bot: fetch failed";
        console.error(`[OTP_ACTION Direct ERROR] Exception: Fetch failed. This usually means the server couldn't reach the webhook URL. Check network configuration and if the URL (${ubuntuBotWebhookUrl}) is correct and accessible from the server. Error: ${error.message}`);
    } else {
      console.error(`[OTP_ACTION Direct ERROR] Exception while calling external webhook: ${error.message}`, error.stack);
    }
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

    // Attempt to send OTP via WhatsApp (now calling the external bot directly)
    const sendResult = await sendOtpViaWhatsApp(user.phone_number, otp, user.name, user.id);

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
        message: sendResult.message || 'Se está procesando el envío de un código OTP a tu número de teléfono.',
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
