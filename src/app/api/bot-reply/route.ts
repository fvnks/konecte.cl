// src/app/api/bot-reply/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
import type { User } from '@/lib/types';

interface BotReplyPayload {
  userId: string;
  messageText: string;
}

export async function POST(request: Request) {
  console.log('[API BotReply] Received POST request from external bot.');
  try {
    const payload = (await request.json()) as BotReplyPayload;
    console.log('[API BotReply] Payload received:', JSON.stringify(payload));

    const { userId, messageText } = payload;

    if (!userId || !messageText) {
      console.error('[API BotReply] Error: userId or messageText missing in payload.');
      return NextResponse.json({ success: false, message: 'El userId y messageText son requeridos.' }, { status: 400 });
    }

    // Query DB to find the user's phone number from their ID
    const userRows: User[] = await query('SELECT phone_number FROM users WHERE id = ?', [userId]);

    if (userRows.length === 0 || !userRows[0].phone_number) {
      console.error(`[API BotReply] Error: No se encontró usuario o número de teléfono para el userId: ${userId}`);
      return NextResponse.json({ success: false, message: `Usuario con ID ${userId} no encontrado o no tiene número de teléfono.` }, { status: 404 });
    }
    
    const userPhoneNumber = userRows[0].phone_number;
    console.log(`[API BotReply] Found phone number ${userPhoneNumber} for userId ${userId}.`);

    // Add the bot's reply to the correct conversation history using the phone number
    const storedMessage = addMessageToConversation(userPhoneNumber, {
      text: messageText,
      sender: 'bot',
      status: 'delivered_to_user'
    });
    
    console.log(`[API BotReply] Bot reply for user ${userId} stored in conversation for ${userPhoneNumber}. Message ID: ${storedMessage.id}`);

    // Respond with success to Botito
    return NextResponse.json({ success: true, message: "Reply received and stored by Konecte." });

  } catch (error: any) {
    console.error('[API BotReply] Error processing bot reply:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al procesar la respuesta del bot.' }, { status: 500 });
  }
}
