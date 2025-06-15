
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound, addMessageToConversation } from '@/lib/whatsappBotStore';
import type { SendMessageToBotPayload } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API SendMessage] Recibida solicitud POST.');
  try {
    const payload = (await request.json()) as SendMessageToBotPayload;
    console.log('[API SendMessage] Payload recibido:', JSON.stringify(payload));

    if (!payload.telefonoReceptorBot || !payload.text || !payload.userId || !payload.telefonoRemitenteUsuarioWeb) {
      console.error('[API SendMessage] Error: Faltan datos en el payload. Requeridos: telefonoReceptorBot, text, userId, telefonoRemitenteUsuarioWeb.');
      return NextResponse.json({ success: false, message: 'Faltan datos requeridos en el payload.' }, { status: 400 });
    }

    // 1. Añadir a la cola para el bot externo (Ubuntu)
    // El 'telefono' aquí es el número del bot, el 'text' es el mensaje del usuario web,
    // y 'userId' es el ID del usuario web.
    // 'telefonoRemitenteUsuarioWeb' se añade para que el bot sepa a quién responder en Konecte.
    const messageForExternalBot = addMessageToPendingOutbound(
        payload.telefonoReceptorBot, 
        payload.text, 
        payload.userId,
        payload.telefonoRemitenteUsuarioWeb // Nuevo parámetro
    );
    console.log(`[API SendMessage] Mensaje de usuarioId ${payload.userId} (tel: ${payload.telefonoRemitenteUsuarioWeb}) para bot ${payload.telefonoReceptorBot} añadido a pendientes. Mensaje ID: ${messageForExternalBot.id}`);

    // 2. Reflejar el mensaje enviado por el usuario en su propio historial de chat en Konecte (UI optimista)
    // La conversación se indexa por el número de teléfono del usuario web.
    addMessageToConversation(payload.telefonoRemitenteUsuarioWeb, {
      text: payload.text,
      sender: 'user',
      status: 'pending_to_whatsapp', // Indica que está en camino al bot externo
      original_sender_id_if_user: payload.userId, // El ID del usuario web que envió el mensaje
    });
    console.log(`[API SendMessage] Mensaje del usuario ${payload.userId} reflejado en su historial de chat (clave: ${payload.telefonoRemitenteUsuarioWeb}).`);


    return NextResponse.json({ success: true, message: messageForExternalBot }); // Devolver el mensaje tal como se encoló para el bot.
  } catch (error: any) {
    console.error('[API SendMessage] Error procesando la solicitud:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}
