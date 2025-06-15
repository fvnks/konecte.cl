
// src/app/api/whatsapp-bot/receive-reply/route.ts
import { NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
import type { ReceiveReplyPayload } from '@/lib/types';

export async function POST(request: Request) {
  // TODO: Considerar autenticación para el bot.
  try {
    const payload = (await request.json()) as ReceiveReplyPayload;

    if (!payload.telefono || !payload.text) {
      return NextResponse.json({ success: false, message: 'El teléfono y el texto de la respuesta son requeridos.' }, { status: 400 });
    }

    const storedMessage = addMessageToConversation(payload.telefono, {
      text: payload.text,
      sender: 'bot',
      status: 'delivered_to_user' // Asumimos que al recibirla aquí, está lista para el usuario
    });
    
    console.log(`[API ReceiveReply] Respuesta del bot para ${payload.telefono} recibida: "${payload.text}"`);

    return NextResponse.json({ success: true, message: storedMessage });
  } catch (error: any) {
    console.error('[API ReceiveReply] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al procesar respuesta.' }, { status: 500 });
  }
}
