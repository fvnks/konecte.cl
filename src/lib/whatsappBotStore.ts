
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

// In-memory store for chat histories (userPhoneNumber -> messages)
const chatHistories: Record<string, WhatsAppMessage[]> = {};
// In-memory store for messages pending to be sent by the external bot
let pendingOutboundMessages: WhatsAppMessage[] = [];

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT';

export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string') {
    console.warn(`[WhatsAppStore WARN getConversation] Invalid userPhoneNumber: ${userPhoneNumber}`);
    return [];
  }
  const conversation = chatHistories[userPhoneNumber] || [];
  return JSON.parse(JSON.stringify(conversation));
}

export function addMessageToConversation(
  userPhoneNumber: string,
  messageData: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'> & { original_sender_id_if_user?: string }
): WhatsAppMessage {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string' || userPhoneNumber.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] userPhoneNumber es inválido: '${userPhoneNumber}'. No se guardará en chatHistories.`);
    return { id: 'error-no-phone-history-' + randomUUID(), telefono: userPhoneNumber, text: '[ERROR: TELÉFONO INVÁLIDO EN HISTORIAL]', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }
  if (!messageData.text || typeof messageData.text !== 'string' || messageData.text.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] texto del mensaje es inválido para ${userPhoneNumber}. No se guardará en chatHistories.`);
    return { id: 'error-no-text-history-' + randomUUID(), telefono: userPhoneNumber, text: '[ERROR: TEXTO INVÁLIDO EN HISTORIAL]', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }

  if (!chatHistories[userPhoneNumber]) {
    chatHistories[userPhoneNumber] = [];
  }

  const newMessage: WhatsAppMessage = {
    id: randomUUID(),
    telefono: userPhoneNumber,
    text: messageData.text,
    sender: messageData.sender,
    timestamp: Date.now(),
    status: messageData.status,
    sender_id_override: messageData.sender === 'user'
      ? messageData.original_sender_id_if_user
      : BOT_SENDER_ID,
  };
  chatHistories[userPhoneNumber].push(newMessage);
  return JSON.parse(JSON.stringify(newMessage));
}

export function addMessageToPendingOutbound(
  botPhoneNumber: string, // Este es msg.telefono (destino WA para el bot de Ubuntu)
  text: string,           // Este es msg.text (contenido del mensaje)
  webUserId: string,      // Este es msg.sender_id_override (ID del usuario de Konecte)
  webUserPhoneNumber: string // Este es msg.telefono_remitente_konecte (teléfono del usuario de Konecte, para la respuesta)
): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG addMessageToPendingOutbound INCOMING PARAMS] botPhone: '${botPhoneNumber}', text: '${text ? text.substring(0,20)+"..." : text}', userId: '${webUserId}', userPhone: '${webUserPhoneNumber}'`);

  const botPhoneNumberIsValid = botPhoneNumber && typeof botPhoneNumber === 'string' && botPhoneNumber.trim() !== '';
  const textIsValid = text && typeof text === 'string' && text.trim() !== '';
  const webUserIdIsValid = webUserId && typeof webUserId === 'string' && webUserId.trim() !== '';
  const webUserPhoneNumberIsValid = webUserPhoneNumber && typeof webUserPhoneNumber === 'string' && webUserPhoneNumber.trim() !== '';

  if (!botPhoneNumberIsValid || !textIsValid || !webUserIdIsValid || !webUserPhoneNumberIsValid) {
    console.error(`[WhatsAppStore CRITICAL addMessageToPendingOutbound VALIDATION FAIL] Datos inválidos recibidos. Mensaje NO ENCOLADO.
      botPhoneNumber (destino WA): ${botPhoneNumber} (valido: ${botPhoneNumberIsValid})
      text (contenido): "${text ? text.substring(0,20)+"..." : text}" (valido: ${textIsValid})
      webUserId (originador Konecte): ${webUserId} (valido: ${webUserIdIsValid})
      webUserPhoneNumber (clave respuesta Konecte): ${webUserPhoneNumber} (valido: ${webUserPhoneNumberIsValid})`);
    return { id: 'error-add-invalid-data-' + randomUUID(), telefono: botPhoneNumber, text: '[ERROR AL ENCOLAR: DATOS INVÁLIDOS EN STORE]', sender: 'user', timestamp: Date.now(), status: 'failed', sender_id_override: webUserId, telefono_remitente_konecte: webUserPhoneNumber };
  }

  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber, // Número del bot de Ubuntu, a dónde debe enviar el mensaje
    text: text, // Contenido del mensaje
    sender: 'user', // Desde la perspectiva del bot, es un mensaje originado por un usuario (vía la plataforma)
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId, // Quién lo envió desde Konecte
    telefono_remitente_konecte: webUserPhoneNumber, // A quién responder en la UI de Konecte
  };
  console.log('[WhatsAppStore DEBUG addMessageToPendingOutbound SUCCESS] Mensaje encolado:', JSON.stringify(message));
  pendingOutboundMessages.push(message);
  return JSON.parse(JSON.stringify(message));
}


export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const stillPendingForNextCycle: WhatsAppMessage[] = [];

  // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] START. Queue length: ${pendingOutboundMessages.length}. Full queue: ${JSON.stringify(pendingOutboundMessages)}`);

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp') {
      // Campos fuente del objeto WhatsAppMessage
      const sourceId = msg.id;
      const sourceTelefonoReceptorWA = msg.telefono; // El número del bot de Ubuntu
      const sourceTextoOriginal = msg.text;
      const sourceTelefonoRemitenteKonecte = msg.telefono_remitente_konecte; // El número del usuario web para la UI
      const sourceUserIdKonecte = msg.sender_id_override;

      // Validación estricta de cada campo necesario
      const isMsgIdValid = sourceId && typeof sourceId === 'string' && sourceId.trim() !== '';
      const isTelefonoReceptorWAValid = sourceTelefonoReceptorWA && typeof sourceTelefonoReceptorWA === 'string' && sourceTelefonoReceptorWA.trim() !== '';
      const isTextoOriginalValid = sourceTextoOriginal && typeof sourceTextoOriginal === 'string' && sourceTextoOriginal.trim() !== '';
      const isTelefonoRemitenteKonecteValid = sourceTelefonoRemitenteKonecte && typeof sourceTelefonoRemitenteKonecte === 'string' && sourceTelefonoRemitenteKonecte.trim() !== '';
      const isUserIdKonecteValid = sourceUserIdKonecte && typeof sourceUserIdKonecte === 'string' && sourceUserIdKonecte.trim() !== '';

      if (isMsgIdValid && isTelefonoReceptorWAValid && isTextoOriginalValid && isTelefonoRemitenteKonecteValid && isUserIdKonecteValid) {
        messagesToDeliver.push({
          id: sourceId,
          telefonoReceptorEnWhatsapp: sourceTelefonoReceptorWA,
          textoOriginal: sourceTextoOriginal,
          telefonoRemitenteParaRespuestaKonecte: sourceTelefonoRemitenteKonecte,
          userId: sourceUserIdKonecte,
        });
        // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] Message ID ${sourceId} ADDED to delivery.`);
      } else {
        console.warn(`[WhatsAppStore CRITICAL getPendingMessagesForBot] Mensaje pendiente (Source ID: ${sourceId || 'N/A'}) DESCARTADO por datos inválidos o faltantes en el objeto WhatsAppMessage fuente. No se entregará:
          - sourceId: ${sourceId} (Válido: ${isMsgIdValid})
          - sourceTelefonoReceptorWA (para bot Ubuntu): ${sourceTelefonoReceptorWA} (Válido: ${isTelefonoReceptorWAValid})
          - sourceTextoOriginal: ${sourceTextoOriginal ? `"${sourceTextoOriginal.substring(0,30)}..."` : sourceTextoOriginal} (Válido: ${isTextoOriginalValid})
          - sourceTelefonoRemitenteKonecte (para respuesta UI Konecte): ${sourceTelefonoRemitenteKonecte} (Válido: ${isTelefonoRemitenteKonecteValid})
          - sourceUserIdKonecte: ${sourceUserIdKonecte} (Válido: ${isUserIdKonecteValid})`);
        // Este mensaje malformado se descarta y no se añade a stillPendingForNextCycle.
      }
    } else {
      // Si el status no es 'pending_to_whatsapp', se mantiene en la cola.
      stillPendingForNextCycle.push(msg);
    }
  }

  pendingOutboundMessages = stillPendingForNextCycle;
  // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] END. Delivering ${messagesToDeliver.length} messages. ${pendingOutboundMessages.length} remain in queue.`);
  return JSON.parse(JSON.stringify(messagesToDeliver));
}

export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
  return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
  const phoneNumbers = Object.keys(chatHistories);
  return phoneNumbers;
}

export function DEV_ONLY_clearPendingOutboundMessages() {
  // console.warn("[WhatsAppStore DEV_ONLY] Limpiando todos los mensajes de pendingOutboundMessages.");
  // pendingOutboundMessages = [];
}

export function DEV_ONLY_getPendingOutboundMessagesState() {
  // console.log("[WhatsAppStore DEV_ONLY] Estado actual de pendingOutboundMessages:", JSON.stringify(pendingOutboundMessages, null, 2));
  // return JSON.parse(JSON.stringify(pendingOutboundMessages));
}
    
    