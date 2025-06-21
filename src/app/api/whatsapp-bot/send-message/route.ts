// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
import type { SendMessageToBotPayload } from '@/lib/types';

export async function POST(request: Request) {
  let payload: SendMessageToBotPayload;

  console.log('[API SendMessage] Received POST request.');

  try {
    payload = (await request.json()) as SendMessageToBotPayload;
    console.log('[API SendMessage] Payload CRUDO recibido del frontend:', JSON.stringify(payload));
  } catch (error: any) {
    console.error('[API SendMessage] Error parseando JSON del payload:', error.message);
    return NextResponse.json({ success: false, message: 'Error en el formato del payload JSON.' }, { status: 400 });
  }

  const { text, userId, telefonoRemitenteUsuarioWeb, telefonoReceptorBot } = payload;
  const missingOrInvalidFields: string[] = [];

  if (!text || typeof text !== 'string' || text.trim() === "") {
    missingOrInvalidFields.push("text (debe ser un string no vacío)");
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === "") {
    missingOrInvalidFields.push("userId (debe ser un string no vacío)");
  }
  if (!telefonoRemitenteUsuarioWeb || typeof telefonoRemitenteUsuarioWeb !== 'string' || telefonoRemitenteUsuarioWeb.trim() === "") {
    missingOrInvalidFields.push("telefonoRemitenteUsuarioWeb (debe ser un string no vacío, es el teléfono del usuario web)");
  }
   if (!telefonoReceptorBot || typeof telefonoReceptorBot !== 'string' || telefonoReceptorBot.trim() === "") {
    missingOrInvalidFields.push("telefonoReceptorBot (debe ser un string no vacío, es el número del bot)");
  }

  // NOTE: This is the correct webhook on the external bot server.
  const ubuntuBotWebhookUrl = 'https://konecte.fedestore.cl/api/webhooks/konecte-incoming';

  if (missingOrInvalidFields.length > 0) {
    const errorMessage = `[API SendMessage VALIDATION FAIL] Faltan datos válidos o requeridos: ${missingOrInvalidFields.join('; ')}. Payload original: ${JSON.stringify(payload)}. Mensaje NO se procesará.`;
    console.error(errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  console.log(`[API SendMessage] Payload VALIDADO. Intentando enviar a webhook: ${ubuntuBotWebhookUrl}.`);

  try {
    addMessageToConversation(telefonoRemitenteUsuarioWeb, {
      text: text,
      sender: 'user',
      status: 'pending_to_whatsapp',
      original_sender_id_if_user: userId,
    });
    console.log(`[API SendMessage] Mensaje del usuario ${userId} (tel: ${telefonoRemitenteUsuarioWeb}) reflejado en su historial de chat local de Konecte.`);
    
    // CORRECTED PAYLOAD to match what the bot's webhook expects (same as OTP flow).
    const webhookPayload = {
      targetUserWhatsAppNumber: telefonoReceptorBot,
      messageText: text,
      konecteUserId: userId, // Pass the Konecte User ID so the bot knows who to reply to.
    };

    console.log(`[API SendMessage] Enviando POST al webhook de Ubuntu: ${ubuntuBotWebhookUrl} con payload:`, JSON.stringify(webhookPayload));

    const webhookResponse = await fetch(ubuntuBotWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseBodyText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      const errorMessage = `[API SendMessage] Error al enviar al webhook de Ubuntu. Status: ${webhookResponse.status}. Body: ${responseBodyText}`;
      console.error(errorMessage);
      return NextResponse.json({ success: false, message: `Error al contactar el webhook del bot: ${webhookResponse.statusText}. Detalle: ${responseBodyText}` }, { status: webhookResponse.status });
    }

    const webhookResult = JSON.parse(responseBodyText);
    console.log('[API SendMessage] Respuesta del webhook de Ubuntu:', webhookResult);

    return NextResponse.json({ success: true, message: "Mensaje enviado al bot de Ubuntu para procesamiento.", botResponse: webhookResult });

  } catch (error: any) {
    console.error('[API SendMessage CRITICAL RUNTIME ERROR] Error procesando la solicitud:', error.message, error.stack);
    return NextResponse.json({ success: false, message: `Error interno del servidor al enviar mensaje al bot: ${error.message}` }, { status: 500 });
  }
}
