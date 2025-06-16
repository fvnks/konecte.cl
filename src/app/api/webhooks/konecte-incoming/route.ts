// src/app/api/webhooks/konecte-incoming/route.ts
import { NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
import type { ReceiveReplyPayload } from '@/lib/types'; // Re-using the same payload type

export async function POST(request: Request) {
  console.log('[API Webhook Konecte Incoming] Received POST request.');
  try {
    const payload = (await request.json()) as ReceiveReplyPayload;
    console.log('[API Webhook Konecte Incoming] Payload received:', JSON.stringify(payload));

    if (!payload.telefono || !payload.text) {
      console.error('[API Webhook Konecte Incoming] Error: Teléfono o texto faltante en el payload.');
      return NextResponse.json({ success: false, message: 'El teléfono y el texto de la respuesta son requeridos.' }, { status: 400 });
    }

    // The 'telefono' in ReceiveReplyPayload is the user's phone number,
    // to whom the bot is replying. The message comes from the bot.
    const storedMessage = addMessageToConversation(payload.telefono, {
      text: payload.text,
      sender: 'bot', // Message is from the bot
      status: 'delivered_to_user'
    });
    
    console.log(`[API Webhook Konecte Incoming] Respuesta del bot para ${payload.telefono} guardada en el store. Mensaje ID: ${storedMessage.id}`);

    // Respond with success to the external bot
    return NextResponse.json({ success: true, message: "Message received and stored by Konecte." });
  } catch (error: any) {
    console.error('[API Webhook Konecte Incoming] Error procesando la solicitud:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al procesar webhook.' }, { status: 500 });
  }
}
