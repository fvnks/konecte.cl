
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound, addMessageToConversation } from '@/lib/whatsappBotStore';
import type { SendMessageToBotPayload } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API SendMessage] Recibida solicitud POST.');
  let payload: SendMessageToBotPayload;

  try {
    payload = (await request.json()) as SendMessageToBotPayload;
    console.log('[API SendMessage] Payload recibido del frontend:', JSON.stringify(payload));
  } catch (error: any) {
    console.error('[API SendMessage] Error parseando JSON del payload:', error.message);
    return NextResponse.json({ success: false, message: 'Error en el formato del payload JSON.' }, { status: 400 });
  }

  const missingOrInvalidFields: string[] = [];

  if (!payload.telefonoReceptorBot || typeof payload.telefonoReceptorBot !== 'string' || payload.telefonoReceptorBot.trim() === "") {
    missingOrInvalidFields.push("telefonoReceptorBot (debe ser un string no vacío)");
  }
  if (!payload.text || typeof payload.text !== 'string' || payload.text.trim() === "") {
    missingOrInvalidFields.push("text (debe ser un string no vacío)");
  }
  if (!payload.userId || typeof payload.userId !== 'string' || payload.userId.trim() === "") {
    missingOrInvalidFields.push("userId (debe ser un string no vacío)");
  }
  if (!payload.telefonoRemitenteUsuarioWeb || typeof payload.telefonoRemitenteUsuarioWeb !== 'string' || payload.telefonoRemitenteUsuarioWeb.trim() === "") {
    missingOrInvalidFields.push("telefonoRemitenteUsuarioWeb (debe ser un string no vacío)");
  }

  if (missingOrInvalidFields.length > 0) {
    const errorMessage = `[API SendMessage] Error: Faltan datos válidos o requeridos en el payload: ${missingOrInvalidFields.join(', ')}. Payload completo: ${JSON.stringify(payload)}`;
    console.error(errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  try {
    // 1. Añadir a la cola para el bot externo (Ubuntu)
    const messageForExternalBot = addMessageToPendingOutbound(
      payload.telefonoReceptorBot,
      payload.text,
      payload.userId,
      payload.telefonoRemitenteUsuarioWeb // Este es el número del usuario web que envía
    );
    console.log(`[API SendMessage] Mensaje de userId ${payload.userId} (tel: ${payload.telefonoRemitenteUsuarioWeb}) para bot ${payload.telefonoReceptorBot} añadido a pendientes. Mensaje ID: ${messageForExternalBot.id}, Status: ${messageForExternalBot.status}`);

    if (messageForExternalBot.status === 'failed') {
        console.error(`[API SendMessage] Error al añadir mensaje a la cola de salida (posiblemente datos inválidos pasaron la validación inicial o problema en el store): ${messageForExternalBot.text}`);
        // No se añade a la conversación del usuario si falla aquí
        return NextResponse.json({ success: false, message: `Error interno al procesar el mensaje para el bot: ${messageForExternalBot.text}` }, { status: 500 });
    }

    // 2. Reflejar el mensaje enviado por el usuario en su propio historial de chat en Konecte (UI optimista)
    addMessageToConversation(payload.telefonoRemitenteUsuarioWeb, {
      text: payload.text,
      sender: 'user',
      status: 'pending_to_whatsapp',
      original_sender_id_if_user: payload.userId,
    });
    console.log(`[API SendMessage] Mensaje del usuario ${payload.userId} reflejado en su historial de chat (clave: ${payload.telefonoRemitenteUsuarioWeb}).`);

    return NextResponse.json({ success: true, message: messageForExternalBot }); // Devuelve el mensaje que se añadió a la cola
  } catch (error: any) {
    console.error('[API SendMessage] Error procesando la solicitud:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}
