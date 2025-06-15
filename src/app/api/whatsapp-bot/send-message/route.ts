
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound } from '@/lib/whatsappBotStore';
import type { SendMessagePayload } from '@/lib/types'; // Asegúrate que SendMessagePayload incluya userId

// Actualiza SendMessagePayload en types.ts para que incluya userId si no lo hace ya
// export interface SendMessagePayload {
//   telefono: string;
//   text: string;
//   userId: string; // ID del usuario web que envía el mensaje
// }


export async function POST(request: Request) {
  console.log('[API SendMessage] Recibida solicitud POST.');
  try {
    const payload = (await request.json()) as SendMessagePayload & { userId: string }; // Añadir userId al payload esperado
    console.log('[API SendMessage] Payload recibido:', JSON.stringify(payload));

    if (!payload.telefono || !payload.text || !payload.userId) { // Verificar userId
      console.error('[API SendMessage] Error: Teléfono, texto o userId faltante en el payload.');
      return NextResponse.json({ success: false, message: 'El teléfono, el texto del mensaje y el ID de usuario son requeridos.' }, { status: 400 });
    }

    // Pasar el userId a addMessageToPendingOutbound
    const storedMessage = addMessageToPendingOutbound(payload.telefono, payload.text, payload.userId);
    console.log(`[API SendMessage] Mensaje de ${payload.telefono} (usuario ID: ${payload.userId}) añadido a pendientes por el store. Mensaje ID: ${storedMessage.id}`);

    return NextResponse.json({ success: true, message: storedMessage });
  } catch (error: any) {
    console.error('[API SendMessage] Error procesando la solicitud:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}
