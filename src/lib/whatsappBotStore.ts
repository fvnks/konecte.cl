
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

// In-memory store for chat histories (userPhoneNumber -> messages)
const chatHistories: Record<string, WhatsAppMessage[]> = {};
// In-memory store for messages pending to be sent by the external bot
let pendingOutboundMessages: WhatsAppMessage[] = [];

// console.log('[WhatsAppStore] Store inicializado/reiniciado.');

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
  botPhoneNumber: string, // Este es el telefonoReceptorEnWhatsapp (número del bot de Ubuntu)
  text: string,           // Este es el textoOriginal
  webUserId: string,      // Este es el userId
  webUserPhoneNumber: string // Este es el telefonoRemitenteParaRespuestaKonecte
): WhatsAppMessage {
  
  console.log(`[WhatsAppStore DEBUG addMessageToPendingOutbound INCOMING PARAMS] 
    botPhoneNumber (destino WA): ${botPhoneNumber}, 
    text (contenido): "${text}", 
    webUserId (originador Konecte): ${webUserId}, 
    webUserPhoneNumber (clave respuesta Konecte): ${webUserPhoneNumber}`);

  // Validación aún más estricta aquí
  const textIsValid = text && typeof text === 'string' && text.trim() !== '';
  const webUserPhoneNumberIsValid = webUserPhoneNumber && typeof webUserPhoneNumber === 'string' && webUserPhoneNumber.trim() !== '';
  const webUserIdIsValid = webUserId && typeof webUserId === 'string' && webUserId.trim() !== '';
  const botPhoneNumberIsValid = botPhoneNumber && typeof botPhoneNumber === 'string' && botPhoneNumber.trim() !== '';

  if (!textIsValid || !webUserPhoneNumberIsValid || !webUserIdIsValid || !botPhoneNumberIsValid) {
    console.error(`[WhatsAppStore CRITICAL addMessageToPendingOutbound VALIDATION FAIL] Datos inválidos. Mensaje NO ENCOLADO.
      botPhoneNumber: ${botPhoneNumber} (valido: ${botPhoneNumberIsValid})
      text: "${text}" (valido: ${textIsValid})
      webUserId: ${webUserId} (valido: ${webUserIdIsValid})
      webUserPhoneNumber: ${webUserPhoneNumber} (valido: ${webUserPhoneNumberIsValid})`);
      
    return { 
      id: 'error-store-invalid-data-add-' + randomUUID(), 
      telefono: botPhoneNumber || "INVALID_BOT_PHONE", 
      text: text || '[ERROR AL ENCOLAR: DATOS INVÁLIDOS EN STORE]', 
      sender: 'user', 
      timestamp: Date.now(), 
      status: 'failed', 
      sender_id_override: webUserId || "INVALID_USER_ID", 
      telefono_remitente_konecte: webUserPhoneNumber || "INVALID_USER_PHONE_RESP"
    };
  }

  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber, 
    text: text,               
    sender: 'user',
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId, 
    telefono_remitente_konecte: webUserPhoneNumber, 
  };
  pendingOutboundMessages.push(message);
  console.log(`[WhatsAppStore DEBUG addMessageToPendingOutbound SUCCESS] Mensaje encolado. ID: ${message.id}. Total en cola: ${pendingOutboundMessages.length}. Datos encolados: ${JSON.stringify(message)}`);
  return JSON.parse(JSON.stringify(message));
}


export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const stillPendingForNextCycle: WhatsAppMessage[] = [];

  // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] INICIO. Procesando ${pendingOutboundMessages.length} mensajes en cola.`);

  for (const msg of pendingOutboundMessages) {
    // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] Evaluando msg ID ${msg.id}:`, JSON.stringify(msg));
    if (msg.status === 'pending_to_whatsapp') {
      
      // Loguear valores ANTES de validar
      // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] Validando msg ID ${msg.id}:
      //   msg.id: ${msg.id} (tipo: ${typeof msg.id})
      //   msg.telefono (para bot Ubuntu): ${msg.telefono} (tipo: ${typeof msg.telefono})
      //   msg.text (original): ${msg.text} (tipo: ${typeof msg.text})
      //   msg.telefono_remitente_konecte (para respuesta Konecte): ${msg.telefono_remitente_konecte} (tipo: ${typeof msg.telefono_remitente_konecte})
      //   msg.sender_id_override (userId Konecte): ${msg.sender_id_override} (tipo: ${typeof msg.sender_id_override})`);

      const idValido = msg.id && typeof msg.id === 'string' && msg.id.trim() !== '';
      const telefonoReceptorValido = msg.telefono && typeof msg.telefono === 'string' && msg.telefono.trim() !== '';
      const textoOriginalValido = msg.text && typeof msg.text === 'string' && msg.text.trim() !== '';
      const telefonoRemitenteValido = msg.telefono_remitente_konecte && typeof msg.telefono_remitente_konecte === 'string' && msg.telefono_remitente_konecte.trim() !== '';
      const userIdValido = msg.sender_id_override && typeof msg.sender_id_override === 'string' && msg.sender_id_override.trim() !== '';

      const isValidForDelivery = idValido && telefonoReceptorValido && textoOriginalValido && telefonoRemitenteValido && userIdValido;

      if (isValidForDelivery) {
        const messageForBot: PendingMessageForExternalBot = {
          id: msg.id, // No usar !, ya validamos
          telefonoReceptorEnWhatsapp: msg.telefono,
          textoOriginal: msg.text,
          telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte,
          userId: msg.sender_id_override,
        };
        messagesToDeliver.push(messageForBot);
        // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] Mensaje ID ${msg.id} AÑADIDO para entrega. Objeto: ${JSON.stringify(messageForBot)}`);
      } else {
        console.warn(`[WhatsAppStore CRITICAL getPendingMessagesForBot] Mensaje pendiente (ID: ${msg.id || 'SIN_ID_EN_MSG_OBJ'}) DESCARTADO de la entrega por datos inválidos o faltantes en el objeto almacenado:
          - msg.id: ${msg.id} (Válido: ${idValido})
          - msg.telefono (telefonoReceptorEnWhatsapp): ${msg.telefono} (Válido: ${telefonoReceptorValido})
          - msg.text (textoOriginal): "${msg.text || '[VACÍO/UNDEFINED]'}" (Válido: ${textoOriginalValido})
          - msg.telefono_remitente_konecte (telefonoRemitenteParaRespuestaKonecte): ${msg.telefono_remitente_konecte} (Válido: ${telefonoRemitenteValido})
          - msg.sender_id_override (userId): ${msg.sender_id_override} (Válido: ${userIdValido})
          Este mensaje no se entregará y se elimina de la cola.`);
      }
    } else {
      stillPendingForNextCycle.push(msg);
    }
  }

  pendingOutboundMessages = stillPendingForNextCycle; 
  
  // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] FIN. Entregando ${messagesToDeliver.length} mensajes. ${pendingOutboundMessages.length} mensajes restantes en cola.`);
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

