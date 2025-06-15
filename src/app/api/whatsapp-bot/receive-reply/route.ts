
// src/app/api/whatsapp-bot/receive-reply/route.ts
import { NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
import type { ReceiveReplyPayload } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API ReceiveReply] Recibida solicitud POST.');
  try {
    const payload = (await request.json()) as ReceiveReplyPayload;
    console.log('[API ReceiveReply] Payload recibido:', JSON.stringify(payload));

    if (!payload.telefono || !payload.text) {
      console.error('[API ReceiveReply] Error: Teléfono o texto faltante en el payload.');
      return NextResponse.json({ success: false, message: 'El teléfono y el texto de la respuesta son requeridos.' }, { status: 400 });
    }

    const storedMessage = addMessageToConversation(payload.telefono, {
      text: payload.text,
      sender: 'bot', // Mensaje recibido DEL BOT
      status: 'delivered_to_user' 
    });
    
    console.log(`[API ReceiveReply] Respuesta del bot para ${payload.telefono} guardada en el store. Mensaje ID: ${storedMessage.id}`);

    return NextResponse.json({ success: true, message: storedMessage });
  } catch (error: any) {
    console.error('[API ReceiveReply] Error procesando la solicitud:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al procesar respuesta.' }, { status: 500 });
  }
}
