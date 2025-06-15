
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
  return JSON.parse(JSON.stringify(conversation)); // Deep copy
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
  botPhoneNumber: string, // Número del bot de Ubuntu (destino WA)
  text: string,           // Contenido del mensaje
  webUserId: string,      // ID del usuario de Konecte
  webUserPhoneNumber: string // Número del usuario de Konecte (para la respuesta en UI Konecte)
): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG addMessageToPendingOutbound INCOMING PARAMS] botPhoneNumber (destino WA): '${botPhoneNumber}', text: '${text ? text.substring(0,30)+"..." : text}', webUserId: '${webUserId}', webUserPhoneNumber (para UI Konecte): '${webUserPhoneNumber}'`);

  const botPhoneNumberIsValid = botPhoneNumber && typeof botPhoneNumber === 'string' && botPhoneNumber.trim() !== '';
  const textIsValid = text && typeof text === 'string' && text.trim() !== '';
  const webUserIdIsValid = webUserId && typeof webUserId === 'string' && webUserId.trim() !== '';
  const webUserPhoneNumberIsValid = webUserPhoneNumber && typeof webUserPhoneNumber === 'string' && webUserPhoneNumber.trim() !== '';

  if (!botPhoneNumberIsValid || !textIsValid || !webUserIdIsValid || !webUserPhoneNumberIsValid) {
    const errorMsg = `[WhatsAppStore CRITICAL addMessageToPendingOutbound VALIDATION FAIL] Datos inválidos recibidos. Mensaje NO ENCOLADO.
      - botPhoneNumber (destino WA): ${botPhoneNumber} (valido: ${botPhoneNumberIsValid})
      - text (contenido): "${text ? text.substring(0,30)+"..." : text}" (valido: ${textIsValid})
      - webUserId (originador Konecte): ${webUserId} (valido: ${webUserIdIsValid})
      - webUserPhoneNumber (para UI Konecte): ${webUserPhoneNumber} (valido: ${webUserPhoneNumberIsValid})`;
    console.error(errorMsg);
    // Devolver un objeto de error claro, pero NO añadir a la cola.
    return { id: 'error-add-invalid-data-' + randomUUID(), telefono: botPhoneNumber, text: '[ERROR AL ENCOLAR: DATOS INVÁLIDOS EN STORE]', sender: 'user', timestamp: Date.now(), status: 'failed', sender_id_override: webUserId, telefono_remitente_konecte: webUserPhoneNumber };
  }

  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber, // Este es el número del bot de Ubuntu, el que recibirá el mensaje en WhatsApp
    text: text,               // Este es el contenido del mensaje a enviar
    sender: 'user', // Desde la perspectiva del bot, es un mensaje originado por un usuario (vía la plataforma)
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId, // ID del usuario web de Konecte que originó el mensaje
    telefono_remitente_konecte: webUserPhoneNumber, // Número del usuario web de Konecte, para la respuesta en la UI
  };
  pendingOutboundMessages.push(message);
  console.log('[WhatsAppStore DEBUG addMessageToPendingOutbound SUCCESS] Mensaje encolado:', JSON.stringify(message));
  return JSON.parse(JSON.stringify(message));
}


export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const stillPendingForNextCycle: WhatsAppMessage[] = [];

  // console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: Procesando ${pendingOutboundMessages.length} mensajes en cola.`);

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp') {
      // VALIDACIÓN MUY ESTRICTA aquí antes de considerar el mensaje para entrega
      // Campos requeridos para que el bot de Ubuntu funcione:
      // 1. msg.id (para seguimiento)
      // 2. msg.telefono (será PendingMessageForExternalBot.telefonoReceptorEnWhatsapp - el número del bot de Ubuntu)
      // 3. msg.text (será PendingMessageForExternalBot.textoOriginal)
      // 4. msg.telefono_remitente_konecte (será PendingMessageForExternalBot.telefonoRemitenteParaRespuestaKonecte - el teléfono del usuario web)
      // 5. msg.sender_id_override (será PendingMessageForExternalBot.userId - el ID del usuario web)

      const idValido = msg.id && typeof msg.id === 'string' && msg.id.trim() !== '';
      const telefonoReceptorEnWhatsappValido = msg.telefono && typeof msg.telefono === 'string' && msg.telefono.trim() !== '';
      const textoOriginalValido = msg.text && typeof msg.text === 'string' && msg.text.trim() !== '';
      const telefonoRemitenteParaRespuestaKonecteValido = msg.telefono_remitente_konecte && typeof msg.telefono_remitente_konecte === 'string' && msg.telefono_remitente_konecte.trim() !== '';
      const userIdValido = msg.sender_id_override && typeof msg.sender_id_override === 'string' && msg.sender_id_override.trim() !== '';

      const isValidForDelivery = idValido && telefonoReceptorEnWhatsappValido && textoOriginalValido && telefonoRemitenteParaRespuestaKonecteValido && userIdValido;

      if (isValidForDelivery) {
        messagesToDeliver.push({
          id: msg.id!, // Ya validado como string no vacío
          telefonoReceptorEnWhatsapp: msg.telefono!, // Número del bot de Ubuntu
          textoOriginal: msg.text!,                  // Mensaje del usuario web
          telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte!, // Teléfono del usuario web
          userId: msg.sender_id_override!,            // ID del usuario web
        });
        // El mensaje se ha "tomado" para entrega, por lo que no se añade a stillPendingForNextCycle.
        // Esto efectivametne lo elimina de la cola pendingOutboundMessages para el siguiente ciclo de polling de tu bot.
      } else {
        // Si está 'pending_to_whatsapp' pero es inválido, se descarta y se loguea.
        console.warn(`[WhatsAppStore CRITICAL getPendingMessagesForBot] Mensaje pendiente (ID: ${msg.id || 'SIN_ID_EN_MSG_OBJ'}) DESCARTADO de la entrega por datos inválidos o faltantes en el objeto almacenado. Este mensaje se elimina de la cola:
          - msg.id (para seguimiento): ${msg.id} (ID Válido: ${idValido})
          - msg.telefono (telefonoReceptorEnWhatsapp - número bot Ubuntu): ${msg.telefono} (Válido: ${telefonoReceptorEnWhatsappValido})
          - msg.text (textoOriginal): ${msg.text ? `"${msg.text.substring(0,30)}..."` : msg.text} (Válido: ${textoOriginalValido})
          - msg.telefono_remitente_konecte (telefonoRemitenteParaRespuestaKonecte - para UI Konecte): ${msg.telefono_remitente_konecte} (Válido: ${telefonoRemitenteValido})
          - msg.sender_id_override (userId Konecte): ${msg.sender_id_override} (Válido: ${userIdValido})`);
        // No se añade a stillPendingForNextCycle, eliminándolo de la cola permanentemente.
      }
    } else {
      // Si no estaba 'pending_to_whatsapp', o cualquier otro estado, se mantiene en la cola para futuros procesamientos si es que hubiera otra lógica para ellos.
      stillPendingForNextCycle.push(msg);
    }
  }

  pendingOutboundMessages = stillPendingForNextCycle; // Actualiza la cola solo con los que realmente quedaron pendientes y no fueron consumidos ni descartados.

  // if (messagesToDeliver.length > 0) {
  //   console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: Entregando ${messagesToDeliver.length} mensajes válidos. IDs: ${messagesToDeliver.map(m => m.id).join(', ')}`);
  // }
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
