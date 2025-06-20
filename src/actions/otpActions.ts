
// src/actions/otpActions.ts
'use server';

import { query } from '@/lib/db';
import { z } from 'zod';
import type { User, SendMessageToBotPayload } from '@/lib/types';
// randomBytes can be kept if a more cryptographically secure OTP is desired later.
// For a simple 4-digit numeric OTP, Math.random is often sufficient.
// import { randomBytes } from 'crypto';

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
 * Sends the OTP via WhatsApp by calling the internal API endpoint
 * which then forwards the message to the external WhatsApp bot.
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
  console.log(`[OTP_ACTION] Attempting to send OTP to user ${userId} (phone: ${phoneNumber}). OTP: ${otp}`);

  const otpMessageText = `Hola ${userName}, tu código de verificación para Konecte es: ${otp}. Este código expira en ${OTP_EXPIRATION_MINUTES} minutos.`;
  
  const konecteBotNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+1234567890"; // Fallback if not set

  const payload: SendMessageToBotPayload = {
    telefonoReceptorBot: konecteBotNumber, // This is used by the API route to know which bot config (if multiple)
    text: otpMessageText,
    telefonoRemitenteUsuarioWeb: phoneNumber, // This is the USER'S phone number, to whom the bot will send the OTP.
    userId: userId,
  };

  try {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!rawBaseUrl) {
      console.error("[OTP_ACTION_ERROR] CRITICAL: NEXT_PUBLIC_APP_URL is not set. Cannot determine API endpoint URL. Please set this in your Vercel environment variables (e.g., https://yourdomain.com).");
      return { success: false, message: "Error de configuración del servidor: URL de la aplicación no definida." };
    }
    
    // Ensure baseUrl has a protocol. Default to https if none is present.
    const ensuredBaseUrl = rawBaseUrl.startsWith('http://') || rawBaseUrl.startsWith('https://') 
                           ? rawBaseUrl 
                           : `https://${rawBaseUrl}`;

    const apiEndpoint = `${ensuredBaseUrl}/api/whatsapp-bot/send-message`;

    console.log(`[OTP_ACTION] Calling internal API endpoint for OTP: ${apiEndpoint}`);
    console.log(`[OTP_ACTION] Payload for /api/whatsapp-bot/send-message:`, JSON.stringify(payload));

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[OTP_ACTION_ERROR] Failed to send OTP via internal API. Status: ${response.status}. Response:`, responseData);
      return { success: false, message: responseData.message || `Error al contactar el servicio de mensajería (estado: ${response.status}).` };
    }

    console.log(`[OTP_ACTION_INFO] OTP API call successful for ${phoneNumber}. API response:`, responseData);
    return { success: true, message: responseData.message || "OTP en proceso de envío." };

  } catch (error: any) {
     // Catching 'fetch failed' specifically
    if (error.message && error.message.toLowerCase().includes('fetch failed')) {
        console.error(`[OTP_ACTION_ERROR] Exception: Fetch failed. This usually means the server couldn't reach the API endpoint. Check network configuration and if the endpoint URL (logged above) is correct and accessible from the server. Error: ${error.message}`);
        return { success: false, message: `No se pudo contactar el servicio de mensajería. Verifica la configuración del servidor y la red.` };
    }
    console.error(`[OTP_ACTION_ERROR] Exception while calling internal API for OTP send: ${error.message}`, error.stack); // Log stack for more detail
    return { success: false, message: `Excepción al contactar el servicio de mensajería: ${error.message}` };
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

    // Attempt to send OTP via WhatsApp (now calling the internal API)
    const sendResult = await sendOtpViaWhatsApp(user.phone_number, otp, user.name, user.id);

    if (!sendResult.success) {
      console.error(`[OTP_ACTION_ERROR] OTP stored for user ${userId}, but failed to send via API: ${sendResult.message}`);
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
