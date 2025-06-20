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
 * Placeholder function to simulate sending OTP via WhatsApp.
 * In a real application, this would make an API call to your WhatsApp bot service.
 */
async function sendOtpViaWhatsApp(phoneNumber: string, otp: string, userName: string): Promise<{ success: boolean; message?: string }> {
  console.log(`[OTP_SIMULATION] Sending OTP to ${phoneNumber}: ${otp} for user ${userName}`);
  
  //
  // !!! IMPORTANT: Replace this with your actual WhatsApp sending logic !!!
  // This might involve an HTTP POST request to your WhatsApp bot's API endpoint.
  // Example (conceptual):
  //
  // const whatsappBotApiUrl = process.env.WHATSAPP_BOT_SEND_API_URL;
  // if (!whatsappBotApiUrl) {
  //   console.error("[OTP_ERROR] WHATSAPP_BOT_SEND_API_URL is not configured.");
  //   return { success: false, message: "Error de configuración del servidor de mensajería." };
  // }
  // try {
  //   const response = await fetch(whatsappBotApiUrl, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.WHATSAPP_BOT_API_KEY}` },
  //     body: JSON.stringify({
  //       to: phoneNumber,
  //       message: `Hola ${userName}, tu código de verificación para Konecte es: ${otp}. Este código expira en ${OTP_EXPIRATION_MINUTES} minutos.`
  //     })
  //   });
  //   if (!response.ok) {
  //     const errorData = await response.text();
  //     console.error(`[OTP_ERROR] Failed to send OTP via WhatsApp bot. Status: ${response.status}. Response: ${errorData}`);
  //     return { success: false, message: `Error al enviar OTP al bot: ${response.statusText}` };
  //   }
  //   console.log(`[OTP_INFO] OTP successfully sent to WhatsApp bot for ${phoneNumber}`);
  //   return { success: true, message: "OTP sent via bot (simulated)." };
  // } catch (error: any) {
  //   console.error(`[OTP_ERROR] Exception sending OTP via WhatsApp bot: ${error.message}`);
  //   return { success: false, message: `Excepción al enviar OTP: ${error.message}` };
  // }
  //
  // For now, we simulate success.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
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

    // Attempt to send OTP via WhatsApp (using placeholder)
    const sendResult = await sendOtpViaWhatsApp(user.phone_number, otp, user.name);
    if (!sendResult.success) {
      // Log the error but don't necessarily fail the whole action if DB update was fine.
      // The user can try resending.
      console.error(`[OTP_WARNING] OTP stored for user ${userId}, but failed to send via WhatsApp: ${sendResult.message}`);
      return { success: false, message: sendResult.message || "No se pudo enviar el código OTP. Intenta reenviar." };
    }
    
    const phoneNumberEnding = user.phone_number.length > 4 ? user.phone_number.slice(-4) : user.phone_number;

    return { 
        success: true, 
        message: 'Se ha enviado un código OTP a tu número de teléfono.',
        phone_number_ending: phoneNumberEnding 
    };

  } catch (error: any) {
    console.error('[OTPAction Error] generateAndSendOtpAction:', error);
    return { success: false, message: 'Error al generar o enviar el código OTP.' };
  }
}

export async function verifyOtpAction(
  userId: string,
  otpEntered: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const users: User[] = await query(
      'SELECT id, phone_otp, phone_otp_expires_at FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    const user = users[0];

    if (!user.phone_otp || !user.phone_otp_expires_at) {
      return { success: false, message: 'No hay un OTP pendiente para este usuario. Por favor, solicita uno nuevo.' };
    }

    if (new Date(user.phone_otp_expires_at) < new Date()) {
      await query('UPDATE users SET phone_otp = NULL, phone_otp_expires_at = NULL WHERE id = ?', [userId]);
      return { success: false, message: 'El código OTP ha expirado. Por favor, solicita uno nuevo.' };
    }

    if (user.phone_otp !== otpEntered) {
      // Optional: Implement attempt tracking here
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
    return { success: false, message: 'Error al verificar el código OTP.' };
  }
}
