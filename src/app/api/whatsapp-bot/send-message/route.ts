// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound, addMessageToConversation } from '@/lib/whatsappBotStore';
import type { SendMessageToBotPayload } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API SendMessage] Recibida solicitud POST.');
  try {
    const payload = (await request.json()) as SendMessageToBotPayload;
    console.log('[API SendMessage] Payload recibido:', JSON.stringify(payload));

    const missingOrInvalidFields: string[] = [];

    if (!payload.telefonoReceptorBot || typeof payload.telefonoReceptorBot !== 'string' || payload.telefonoReceptorBot.trim() === "") {
      missingOrInvalidFields.push("telefonoReceptorBot (debe ser un string no vacío)");
    }
    if (typeof payload.text !== 'string' || payload.text.trim() === "") {
      missingOrInvalidFields.push("text (debe ser un string no vacío)");
    }
    if (!payload.userId || typeof payload.userId !== 'string' || payload.userId.trim() === "") {
      missingOrInvalidFields.push("userId (debe ser un string no vacío)");
    }
    if (typeof payload.telefonoRemitenteUsuarioWeb !== 'string' || payload.telefonoRemitenteUsuarioWeb.trim() === "") {
      missingOrInvalidFields.push("telefonoRemitenteUsuarioWeb (debe ser un string no vacío)");
    }

    if (missingOrInvalidFields.length > 0) {
      const errorMessage = `Faltan datos válidos o requeridos en el payload: ${missingOrInvalidFields.join(', ')}. Payload completo: ${JSON.stringify(payload)}`;
      console.error(`[API SendMessage] Error: ${errorMessage}`);
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }

    // 1. Añadir a la cola para el bot externo (Ubuntu)
    const messageForExternalBot = addMessageToPendingOutbound(
        payload.telefonoReceptorBot,
        payload.text,
        payload.userId,
        payload.telefonoRemitenteUsuarioWeb // Este es el número del usuario web que envía
    );
    console.log(`[API SendMessage] Mensaje de usuarioId ${payload.userId} (tel: ${payload.telefonoRemitenteUsuarioWeb}) para bot ${payload.telefonoReceptorBot} añadido a pendientes. Mensaje ID: ${messageForExternalBot.id}`);

    // 2. Reflejar el mensaje enviado por el usuario en su propio historial de chat en Konecte (UI optimista)
    // La clave para el historial es el telefonoRemitenteUsuarioWeb
    addMessageToConversation(payload.telefonoRemitenteUsuarioWeb, {
      text: payload.text,
      sender: 'user',
      status: 'pending_to_whatsapp',
      original_sender_id_if_user: payload.userId,
    });
    console.log(`[API SendMessage] Mensaje del usuario ${payload.userId} reflejado en su historial de chat (clave: ${payload.telefonoRemitenteUsuarioWeb}).`);

    return NextResponse.json({ success: true, message: messageForExternalBot });
  } catch (error: any) {
    console.error('[API SendMessage] Error procesando la solicitud:', error.message, error.stack);
    // Loguear el cuerpo de la petición si es un error de parseo de JSON
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        try {
            const rawBody = await request.text(); // Intentar leer el cuerpo como texto
            console.error('[API SendMessage] Cuerpo de la petición que causó el error de JSON:', rawBody);
        } catch (bodyError) {
            console.error('[API SendMessage] No se pudo leer el cuerpo de la petición tras error de JSON:', bodyError);
        }
    }
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}
