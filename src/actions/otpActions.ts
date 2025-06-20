// src/actions/otpActions.ts
'use server';

import { query } from '@/lib/db';
import { z } from 'zod';
import type { User, SendMessageToBotPayload } from '@/lib/types';
import { randomBytes } from 'crypto'; // For more secure random generation

const OTP_LENGTH = 4;
const OTP_EXPIRATION_MINUTES = 5;

/**
 * Generates a random numeric OTP of a specified length.
 */
function generateOtpCode(length: number = OTP_LENGTH): string {
  // For a simple 4-digit numeric OTP, Math.random is usually sufficient.
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
  phoneNumber: string, // This is the user's phone number (target for OTP)
  otp: string,
  userName: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[OTP_ACTION] Attempting to send OTP to user ${userId} (phone: ${phoneNumber}). OTP: ${otp}`);

  const otpMessageText = `Hola ${userName}, tu código de verificación para Konecte es: ${otp}. Este código expira en ${OTP_EXPIRATION_MINUTES} minutos.`;
  
  // This is the WhatsApp number of YOUR BOT that runs on Ubuntu.
  // The /api/whatsapp-bot/send-message route will use this (or its internal env var for the webhook)
  // to know where the message effectively originates from Konecte's perspective,
  // but the actual sending to the *user* is determined by WHATSAPP_BOT_UBUNTU_WEBHOOK_URL
  // and the targetUserWhatsAppNumber in the payload *that* webhook receives.
  const konecteBotNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+1234567890"; // Fallback if not set

  const payload: SendMessageToBotPayload = {
    telefonoReceptorBot: konecteBotNumber, // Not strictly used by the final bot, but part of the API contract
    text: otpMessageText,
    telefonoRemitenteUsuarioWeb: phoneNumber, // This is the USER'S phone number, to whom the bot will send the OTP.
    userId: userId,
  };

  try {
    // We need the full URL if calling from a server action to an API route in the same app.
    // Using NEXT_PUBLIC_BASE_URL or similar would be more robust.
    // For now, assuming same origin or a correctly configured base URL.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'; // Ensure this is set correctly
    const apiEndpoint = `${baseUrl}/api/whatsapp-bot/send-message`;

    console.log(`[OTP_ACTION] Calling internal API endpoint: ${apiEndpoint} with payload:`, JSON.stringify(payload));

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
      return { success: false, message: responseData.message || `Error al enviar OTP al servicio de mensajería (status: ${response.status}).` };
    }

    console.log(`[OTP_ACTION_INFO] OTP API call successful for ${phoneNumber}. API response:`, responseData);
    // The API route's success message might be something like "Mensaje enviado al bot de Ubuntu para procesamiento."
    // We can adapt the message if needed.
    return { success: true, message: responseData.message || "OTP en proceso de envío." };

  } catch (error: any) {
    console.error(`[OTP_ACTION_ERROR] Exception while calling internal API for OTP send: ${error.message}`);
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

    // Attempt to send OTP via WhatsApp (now calling the internal API)
    const sendResult = await sendOtpViaWhatsApp(user.phone_number, otp, user.name, user.id);
    const phoneNumberEnding = user.phone_number.length >= 4 ? user.phone_number.slice(-4) : user.phone_number;

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
