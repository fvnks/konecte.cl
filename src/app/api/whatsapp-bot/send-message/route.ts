
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToPendingOutbound, addMessageToConversation } from '@/lib/whatsappBotStore';
import type { SendMessageToBotPayload } from '@/lib/types';

export async function POST(request: Request) {
  let payload: SendMessageToBotPayload;

  try {
    payload = (await request.json()) as SendMessageToBotPayload;
    console.log('[API SendMessage] Payload CRUDO recibido del frontend:', JSON.stringify(payload));
  } catch (error: any) {
    console.error('[API SendMessage] Error parseando JSON del payload:', error.message);
    return NextResponse.json({ success: false, message: 'Error en el formato del payload JSON.' }, { status: 400 });
  }

  // Validación exhaustiva de cada campo esperado
  const { telefonoReceptorBot, text, userId, telefonoRemitenteUsuarioWeb } = payload;
  const missingOrInvalidFields: string[] = [];

  if (!telefonoReceptorBot || typeof telefonoReceptorBot !== 'string' || telefonoReceptorBot.trim() === "") {
    missingOrInvalidFields.push("telefonoReceptorBot (debe ser un string no vacío para el número del bot de Ubuntu)");
  }
  if (!text || typeof text !== 'string' || text.trim() === "") {
    missingOrInvalidFields.push("text (debe ser un string no vacío para el contenido del mensaje)");
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === "") {
    missingOrInvalidFields.push("userId (debe ser un string no vacío para el ID del usuario web)");
  }
  if (!telefonoRemitenteUsuarioWeb || typeof telefonoRemitenteUsuarioWeb !== 'string' || telefonoRemitenteUsuarioWeb.trim() === "") {
    missingOrInvalidFields.push("telefonoRemitenteUsuarioWeb (debe ser un string no vacío para el número del usuario web)");
  }

  if (missingOrInvalidFields.length > 0) {
    const errorMessage = `[API SendMessage CRITICAL VALIDATION FAIL] Faltan datos válidos o requeridos en el payload: ${missingOrInvalidFields.join('; ')}. Payload completo: ${JSON.stringify(payload)}. Mensaje NO se procesará.`;
    console.error(errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  console.log(`[API SendMessage] Payload VALIDADO. Procediendo a encolar. telefonoReceptorBot: ${telefonoReceptorBot}, text: "${text.substring(0,30)}...", userId: ${userId}, telefonoRemitenteUsuarioWeb: ${telefonoRemitenteUsuarioWeb}`);

  try {
    // 1. Añadir a la cola para el bot externo (Ubuntu)
    const messageForExternalBot = addMessageToPendingOutbound(
      telefonoReceptorBot,
      text,
      userId,
      telefonoRemitenteUsuarioWeb
    );
    
    // Verificar si addMessageToPendingOutbound devolvió un mensaje de error (porque falló su propia validación interna)
    if (messageForExternalBot.status === 'failed') {
        console.error(`[API SendMessage] Error DESDE addMessageToPendingOutbound al intentar encolar mensaje. Razón: ${messageForExternalBot.text}. Payload original: ${JSON.stringify(payload)}`);
        return NextResponse.json({ success: false, message: `Error interno al procesar el mensaje para el bot: ${messageForExternalBot.text}` }, { status: 500 });
    }
    
    console.log(`[API SendMessage] Mensaje (ID en cola: ${messageForExternalBot.id}) para bot ${telefonoReceptorBot} añadido a pendientes. Originado por userId ${userId} (tel: ${telefonoRemitenteUsuarioWeb}).`);

    // 2. Reflejar el mensaje enviado por el usuario en su propio historial de chat en Konecte (UI optimista)
    addMessageToConversation(telefonoRemitenteUsuarioWeb, {
      text: text,
      sender: 'user',
      status: 'pending_to_whatsapp',
      original_sender_id_if_user: userId,
    });
    console.log(`[API SendMessage] Mensaje del usuario ${userId} reflejado en su historial de chat (clave: ${telefonoRemitenteUsuarioWeb}).`);

    return NextResponse.json({ success: true, message: "Mensaje encolado para el bot.", enqueuedMessageId: messageForExternalBot.id });
  } catch (error: any) {
    console.error('[API SendMessage CRITICAL RUNTIME ERROR] Error procesando la solicitud después de validación:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al enviar mensaje.' }, { status: 500 });
  }
}

