
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
      let missingFields = [];
      if (!payload.telefonoReceptorBot) missingFields.push("telefonoReceptorBot");
      if (!payload.text) missingFields.push("text");
      if (!payload.userId) missingFields.push("userId");
      if (!payload.telefonoRemitenteUsuarioWeb) missingFields.push("telefonoRemitenteUsuarioWeb");
      
      const errorMessage = `Faltan datos requeridos en el payload: ${missingFields.join(', ')}. Payload completo: ${JSON.stringify(payload)}`;
      console.error(`[API SendMessage] Error: ${errorMessage}`);
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }

    // Validación adicional para asegurar que el texto y el teléfono del remitente no estén vacíos
    if (payload.text.trim() === "") {
        const errorMessage = "El campo 'text' (mensaje) no puede estar vacío.";
        console.error(`[API SendMessage] Error: ${errorMessage}. Payload: ${JSON.stringify(payload)}`);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
    if (payload.telefonoRemitenteUsuarioWeb.trim() === "") {
        const errorMessage = "El campo 'telefonoRemitenteUsuarioWeb' (teléfono del usuario web) no puede estar vacío.";
        console.error(`[API SendMessage] Error: ${errorMessage}. Payload: ${JSON.stringify(payload)}`);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }


    // 1. Añadir a la cola para el bot externo (Ubuntu)
    const messageForExternalBot = addMessageToPendingOutbound(
        payload.telefonoReceptorBot, 
        payload.text, 
        payload.userId,
        payload.telefonoRemitenteUsuarioWeb
    );
    console.log(`[API SendMessage] Mensaje de usuarioId ${payload.userId} (tel: ${payload.telefonoRemitenteUsuarioWeb}) para bot ${payload.telefonoReceptorBot} añadido a pendientes. Mensaje ID: ${messageForExternalBot.id}`);

    // 2. Reflejar el mensaje enviado por el usuario en su propio historial de chat en Konecte (UI optimista)
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
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}

