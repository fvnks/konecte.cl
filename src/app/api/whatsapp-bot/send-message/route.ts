
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
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

  const { telefonoReceptorBot, text, userId, telefonoRemitenteUsuarioWeb } = payload;
  const missingOrInvalidFields: string[] = [];

  if (!text || typeof text !== 'string' || text.trim() === "") {
    missingOrInvalidFields.push("text (debe ser un string no vacío)");
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === "") {
    missingOrInvalidFields.push("userId (debe ser un string no vacío)");
  }
  if (!telefonoRemitenteUsuarioWeb || typeof telefonoRemitenteUsuarioWeb !== 'string' || telefonoRemitenteUsuarioWeb.trim() === "") {
    missingOrInvalidFields.push("telefonoRemitenteUsuarioWeb (debe ser un string no vacío)");
  }

  const ubuntuBotWebhookUrl = process.env.WHATSAPP_BOT_UBUNTU_WEBHOOK_URL;
  if (!ubuntuBotWebhookUrl || typeof ubuntuBotWebhookUrl !== 'string' || ubuntuBotWebhookUrl.trim() === "") {
    missingOrInvalidFields.push("WHATSAPP_BOT_UBUNTU_WEBHOOK_URL (variable de entorno no configurada en el servidor de Konecte)");
  }

  if (missingOrInvalidFields.length > 0) {
    const errorMessage = `[API SendMessage VALIDATION FAIL] Faltan datos válidos o requeridos: ${missingOrInvalidFields.join('; ')}. Payload original: ${JSON.stringify(payload)}. Mensaje NO se procesará.`;
    console.error(errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  console.log(`[API SendMessage] Payload VALIDADO. Intentando enviar a webhook: ${ubuntuBotWebhookUrl}.`);

  try {
    // 1. Guardar en el historial de chat de Konecte (UI optimista)
    addMessageToConversation(telefonoRemitenteUsuarioWeb, { // telefonoRemitenteUsuarioWeb es la clave para el historial del usuario
      text: text,
      sender: 'user',
      status: 'pending_to_whatsapp', // O un nuevo estado como 'pending_to_webhook'
      original_sender_id_if_user: userId,
    });
    console.log(`[API SendMessage] Mensaje del usuario ${userId} reflejado en su historial de chat local de Konecte (clave: ${telefonoRemitenteUsuarioWeb}).`);

    // 2. Enviar el mensaje al webhook del bot de Ubuntu
    const webhookPayload = {
      konecteUserId: userId,
      targetUserWhatsAppNumber: telefonoRemitenteUsuarioWeb, // El bot de Ubuntu debe enviar el mensaje a este número
      messageText: text,
      // Puedes añadir más info si tu bot la necesita, como el ID del mensaje de Konecte
      // konecteMessageId: internalMessage.id, // internalMessage ya no se crea aquí directamente
    };

    console.log(`[API SendMessage] Enviando POST al webhook de Ubuntu: ${ubuntuBotWebhookUrl} con payload:`, JSON.stringify(webhookPayload));

    const webhookResponse = await fetch(ubuntuBotWebhookUrl!, { // El '!' es seguro por la validación anterior
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Podrías añadir un token de autenticación aquí si tu webhook lo requiere
        // 'Authorization': `Bearer ${process.env.UBUNTU_WEBHOOK_SECRET}`
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      console.error(`[API SendMessage] Error al enviar al webhook de Ubuntu. Status: ${webhookResponse.status}. Body: ${errorBody}`);
      // No se revierte el mensaje en la UI de Konecte, se asume que el webhook podría reintentar o manejar el error.
      // O podrías tener una lógica para marcar el mensaje en Konecte como 'failed_to_webhook'
      return NextResponse.json({ success: false, message: `Error al contactar el webhook del bot: ${webhookResponse.statusText}. Detalle: ${errorBody}` }, { status: webhookResponse.status });
    }

    const webhookResult = await webhookResponse.json();
    console.log('[API SendMessage] Respuesta del webhook de Ubuntu:', webhookResult);

    return NextResponse.json({ success: true, message: "Mensaje enviado al bot para procesamiento.", botResponse: webhookResult });

  } catch (error: any) {
    console.error('[API SendMessage CRITICAL RUNTIME ERROR] Error procesando la solicitud:', error.message, error.stack);
    // Aquí tampoco se revierte el mensaje en la UI optimista, ya que el error es en la comunicación.
    return NextResponse.json({ success: false, message: `Error interno del servidor al enviar mensaje al bot: ${error.message}` }, { status: 500 });
  }
}
