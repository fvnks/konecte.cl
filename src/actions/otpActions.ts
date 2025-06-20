
// src/actions/otpActions.ts
'use server';

import { query } from '@/lib/db';
import { z } from 'zod';
import type { User } from '@/lib/types';
import { randomBytes } from 'crypto'; // For more secure random generation

const OTP_LENGTH = 4;
const OTP_EXPIRATION_MINUTES = 5;

/**
 * Generates a random numeric OTP of a specified length.
 */
function generateOtpCode(length: number = OTP_LENGTH): string {
  // For a simple 4-digit numeric OTP, Math.random is usually sufficient.
  // For higher security, crypto.randomBytes would be better for longer/alphanumeric codes.
  // return Math.floor(1000 + Math.random() * 9000).toString(); // For 4 digits
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Sends the OTP via WhatsApp (or another chosen method).
 * !!! THIS IS A PLACEHOLDER - REPLACE WITH YOUR ACTUAL SENDING LOGIC !!!
 * 
 * @param phoneNumber The user's phone number to send the OTP to.
 * @param otp The One-Time Password.
 * @param userName The user's name, for a personalized message.
 * @returns Promise resolving to an object indiquant success or failure.
 */
async function sendOtpViaWhatsApp(phoneNumber: string, otp: string, userName: string): Promise<{ success: boolean; message?: string }> {
  console.log(`[OTP_ACTION_SIMULATION] Attempting to "send" OTP to ${phoneNumber} for user ${userName}. OTP: ${otp}`);

  // --- BEGIN CRITICAL IMPLEMENTATION AREA FOR THE USER ---
  //
  // TODO: Replace the simulation below with your actual WhatsApp bot API call.
  // This will likely involve an HTTP POST request to your bot's API endpoint.
  //
  // Example (conceptual - adapt to your bot's API):
  //
  // const WHATSAPP_BOT_API_URL = process.env.WHATSAPP_BOT_API_URL; // e.g., https://your-bot-service.com/api/send-otp
  // const WHATSAPP_BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY;
  //
  // if (!WHATSAPP_BOT_API_URL || !WHATSAPP_BOT_API_KEY) {
  //   console.error("[OTP_ACTION_ERROR] WhatsApp Bot API URL or Key is not configured in environment variables.");
  //   return { success: false, message: "Error de configuración del servidor de mensajería. Contacte al administrador." };
  // }
  //
  // try {
  //   const response = await fetch(WHATSAPP_BOT_API_URL, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${WHATSAPP_BOT_API_KEY}`, // Or your bot's auth method
  //     },
  //     body: JSON.stringify({
  //       to: phoneNumber, // The user's phone number
  //       message: `Hola ${userName}, tu código de verificación para Konecte es: ${otp}. Este código expira en ${OTP_EXPIRATION_MINUTES} minutos.`
  //     }),
  //   });
  //
  //   if (!response.ok) {
  //     const errorData = await response.text();
  //     console.error(`[OTP_ACTION_ERROR] Failed to send OTP via WhatsApp bot. Status: ${response.status}. Response: ${errorData}`);
  //     // Consider more specific error messages based on response.status
  //     return { success: false, message: `Error al enviar OTP al servicio de mensajería (status: ${response.status}).` };
  //   }
  //
  //   const responseData = await response.json(); // Assuming your bot API returns JSON
  //   console.log(`[OTP_ACTION_INFO] OTP API call successful for ${phoneNumber}. Bot response:`, responseData);
  //   return { success: true, message: "OTP enviado a través del bot." };
  //
  // } catch (error: any) {
  //   console.error(`[OTP_ACTION_ERROR] Exception while calling WhatsApp Bot API: ${error.message}`);
  //   return { success: false, message: `Excepción al contactar el servicio de mensajería: ${error.message}` };
  // }
  //
  // --- END CRITICAL IMPLEMENTATION AREA ---


  // Current simulation:
  console.warn(`[OTP_ACTION_SIMULATION] THIS IS A SIMULATED OTP SEND. OTP for ${phoneNumber} is ${otp}.`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  return { success: true, message: "OTP enviado (simulación)." };
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

    // Attempt to send OTP via WhatsApp
    const sendResult = await sendOtpViaWhatsApp(user.phone_number, otp, user.name);
    const phoneNumberEnding = user.phone_number.length >= 4 ? user.phone_number.slice(-4) : user.phone_number;

    if (!sendResult.success) {
      console.error(`[OTP_ACTION_ERROR] OTP stored for user ${userId}, but failed to send: ${sendResult.message}`);
      // Even if sending fails, the OTP is stored. The user can try verifying if they somehow received it or try resending.
      return { success: false, message: sendResult.message || "No se pudo enviar el código OTP. Intenta reenviar.", phone_number_ending: phoneNumberEnding };
    }

    return {
        success: true,
        message: 'Se ha enviado un código OTP a tu número de teléfono.',
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
