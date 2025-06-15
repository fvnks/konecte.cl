
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound } from '@/lib/whatsappBotStore';
import type { SendMessagePayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SendMessagePayload;

    if (!payload.telefono || !payload.text) {
      return NextResponse.json({ success: false, message: 'El teléfono y el texto del mensaje son requeridos.' }, { status: 400 });
    }

    // Validar formato de teléfono si es necesario (ej. internacional)
    // Por ahora, asumimos que el frontend lo envía en un formato que el bot entiende.

    const storedMessage = addMessageToPendingOutbound(payload.telefono, payload.text);

    console.log(`[API SendMessage] Mensaje de ${payload.telefono} añadido a pendientes: "${payload.text}"`);

    return NextResponse.json({ success: true, message: storedMessage });
  } catch (error: any) {
    console.error('[API SendMessage] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}
