
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound } from '@/lib/whatsappBotStore';
import type { SendMessagePayload } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API SendMessage] Recibida solicitud POST.');
  try {
    const payload = (await request.json()) as SendMessagePayload;
    console.log('[API SendMessage] Payload recibido:', JSON.stringify(payload));

    if (!payload.telefono || !payload.text) {
      console.error('[API SendMessage] Error: Teléfono o texto faltante en el payload.');
      return NextResponse.json({ success: false, message: 'El teléfono y el texto del mensaje son requeridos.' }, { status: 400 });
    }

    const storedMessage = addMessageToPendingOutbound(payload.telefono, payload.text);
    console.log(`[API SendMessage] Mensaje de ${payload.telefono} añadido a pendientes por el store. Mensaje ID: ${storedMessage.id}`);

    return NextResponse.json({ success: true, message: storedMessage });
  } catch (error: any) {
    console.error('[API SendMessage] Error procesando la solicitud:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}
