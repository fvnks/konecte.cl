
// src/app/api/whatsapp-bot/send-message/route.ts
import { NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/whatsappBotStore';
import type { SendMessageToBotPayload } from '@/lib/types';

export async function POST(request: Request) {
  let payload: SendMessageToBotPayload;

  console.log('[API SendMessage] Received POST request.'); // Log de inicio

  try {
    payload = (await request.json()) as SendMessageToBotPayload;
    console.log('[API SendMessage] Payload CRUDO recibido del frontend:', JSON.stringify(payload));
  } catch (error: any) {
    console.error('[API SendMessage] Error parseando JSON del payload:', error.message);
    return NextResponse.json({ success: false, message: 'Error en el formato del payload JSON.' }, { status: 400 });
  }

  // Validaciones de campos
  const { telefonoReceptorBot, text, userId, telefonoRemitenteUsuarioWeb } = payload;
  const missingOrInvalidFields: string[] = [];

  // Validar telefonoReceptorBot (número del bot de Ubuntu, aunque ahora se lee de env var)
  // En realidad, este campo no se usa si WHATSAPP_BOT_UBUNTU_WEBHOOK_URL está presente, pero lo mantenemos por si se revierte.
  if (!telefonoReceptorBot || typeof telefonoReceptorBot !== 'string' || telefonoReceptorBot.trim() === "") {
    // Considerar si este campo sigue siendo necesario en el payload si la URL del webhook es fija vía env var.
    // Por ahora, lo mantenemos para consistencia con la definición de SendMessageToBotPayload.
    // missingOrInvalidFields.push("telefonoReceptorBot (número del bot de WhatsApp al que la plataforma Konecte enviaría el mensaje, ahora se usa WHATSAPP_BOT_UBUNTU_WEBHOOK_URL)");
  }
  if (!text || typeof text !== 'string' || text.trim() === "") {
    missingOrInvalidFields.push("text (debe ser un string no vacío)");
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === "") {
    missingOrInvalidFields.push("userId (debe ser un string no vacío)");
  }
  if (!telefonoRemitenteUsuarioWeb || typeof telefonoRemitenteUsuarioWeb !== 'string' || telefonoRemitenteUsuarioWeb.trim() === "") {
    missingOrInvalidFields.push("telefonoRemitenteUsuarioWeb (debe ser un string no vacío, es el teléfono del usuario web)");
  }

  const ubuntuBotWebhookUrl = process.env.WHATSAPP_BOT_UBUNTU_WEBHOOK_URL;
  if (!ubuntuBotWebhookUrl || typeof ubuntuBotWebhookUrl !== 'string' || ubuntuBotWebhookUrl.trim() === "") {
    missingOrInvalidFields.push("WHATSAPP_BOT_UBUNTU_WEBHOOK_URL (variable de entorno no configurada en el servidor de Konecte para la URL del webhook del bot de Ubuntu)");
  }

  if (missingOrInvalidFields.length > 0) {
    const errorMessage = `[API SendMessage VALIDATION FAIL] Faltan datos válidos o requeridos: ${missingOrInvalidFields.join('; ')}. Payload original: ${JSON.stringify(payload)}. Mensaje NO se procesará.`;
    console.error(errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
  }

  console.log(`[API SendMessage] Payload VALIDADO. Intentando enviar a webhook: ${ubuntuBotWebhookUrl}.`);

  try {
    // 1. Guardar mensaje en la UI de Konecte para UX optimista
    addMessageToConversation(telefonoRemitenteUsuarioWeb, { // telefonoRemitenteUsuarioWeb es la clave para el historial del usuario
      text: text,
      sender: 'user',
      status: 'pending_to_whatsapp', // Indica que se está intentando enviar al bot externo
      original_sender_id_if_user: userId,
    });
    console.log(`[API SendMessage] Mensaje del usuario ${userId} (tel: ${telefonoRemitenteUsuarioWeb}) reflejado en su historial de chat local de Konecte.`);

    // 2. Preparar y enviar el payload al webhook de tu bot de Ubuntu
    const webhookPayload = {
      konecteUserId: userId,
      targetUserWhatsAppNumber: telefonoRemitenteUsuarioWeb, // El número del usuario web, a quien tu bot debe enviar el mensaje en WA
      messageText: text, // El texto que el usuario web escribió
    };

    console.log(`[API SendMessage] Enviando POST al webhook de Ubuntu: ${ubuntuBotWebhookUrl} con payload:`, JSON.stringify(webhookPayload));

    const webhookResponse = await fetch(ubuntuBotWebhookUrl!, { // '!' es seguro por la validación anterior
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      console.error(`[API SendMessage] Error al enviar al webhook de Ubuntu. Status: ${webhookResponse.status}. Body: ${errorBody}`);
      // Aquí podrías actualizar el status del mensaje en chatHistories a 'failed_to_webhook' si lo deseas
      return NextResponse.json({ success: false, message: `Error al contactar el webhook del bot: ${webhookResponse.statusText}. Detalle: ${errorBody}` }, { status: webhookResponse.status });
    }

    const webhookResult = await webhookResponse.json();
    console.log('[API SendMessage] Respuesta del webhook de Ubuntu:', webhookResult);
    // Aquí podrías actualizar el status del mensaje en chatHistories a 'sent_to_webhook' o similar
    // si el webhookResult indica éxito por parte de tu bot de Ubuntu.

    return NextResponse.json({ success: true, message: "Mensaje enviado al bot de Ubuntu para procesamiento.", botResponse: webhookResult });

  } catch (error: any) {
    console.error('[API SendMessage CRITICAL RUNTIME ERROR] Error procesando la solicitud:', error.message, error.stack);
    // Aquí también podrías actualizar el status del mensaje en chatHistories a 'failed_to_webhook'
    return NextResponse.json({ success: false, message: `Error interno del servidor al enviar mensaje al bot: ${error.message}` }, { status: 500 });
  }
}
