// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

// In-memory store for chat histories (userPhoneNumber -> messages)
const chatHistories: Record<string, WhatsAppMessage[]> = {};
// In-memory store for messages pending to be sent by the external bot
let pendingOutboundMessages: WhatsAppMessage[] = [];

// console.log('[WhatsAppStore] Store inicializado/reiniciado.'); // Keep this for Vercel cold start check

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT';

export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string') {
    console.warn(`[WhatsAppStore WARN getConversation] Invalid userPhoneNumber: ${userPhoneNumber}`);
    return [];
  }
  const conversation = chatHistories[userPhoneNumber] || [];
  // console.log(`[WhatsAppStore DEBUG getConversation] For ${userPhoneNumber}, found ${conversation.length} messages.`);
  return JSON.parse(JSON.stringify(conversation)); // Deep copy
}

export function addMessageToConversation(
  userPhoneNumber: string,
  messageData: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'> & { original_sender_id_if_user?: string }
): WhatsAppMessage {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string' || userPhoneNumber.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] userPhoneNumber es inválido: '${userPhoneNumber}'. No se guardará en chatHistories.`);
    return { id: 'error-no-phone-history', telefono: userPhoneNumber, text: '[ERROR: TELÉFONO INVÁLIDO EN HISTORIAL]', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }
  if (!messageData.text || typeof messageData.text !== 'string' || messageData.text.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] texto del mensaje es inválido para ${userPhoneNumber}. No se guardará en chatHistories.`);
    return { id: 'error-no-text-history', telefono: userPhoneNumber, text: '[ERROR: TEXTO INVÁLIDO EN HISTORIAL]', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
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
      ? messageData.original_sender_id_if_user // This should be the webUserId
      : BOT_SENDER_ID,
  };
  chatHistories[userPhoneNumber].push(newMessage);
  // console.log(`[WhatsAppStore DEBUG addMessageToConversation] Mensaje añadido a chatHistories para ${userPhoneNumber}. Total: ${chatHistories[userPhoneNumber].length}. Sender: ${newMessage.sender}, SenderIDOverride: ${newMessage.sender_id_override}`);
  return JSON.parse(JSON.stringify(newMessage));
}

export function addMessageToPendingOutbound(
  botPhoneNumber: string, // Este es telefonoReceptorBot (el número de TU bot de WA)
  text: string,
  webUserId: string,
  webUserPhoneNumber: string // Este es telefonoRemitenteUsuarioWeb (el número del usuario de Konecte)
): WhatsAppMessage {
  // Esta validación es redundante si la API ya valida, pero es una salvaguarda.
  if (!text || typeof text !== 'string' || text.trim() === '' ||
      !webUserPhoneNumber || typeof webUserPhoneNumber !== 'string' || webUserPhoneNumber.trim() === '' ||
      !webUserId || typeof webUserId !== 'string' || webUserId.trim() === '' ||
      !botPhoneNumber || typeof botPhoneNumber !== 'string' || botPhoneNumber.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToPendingOutbound] Datos inválidos recibidos. botPhone: '${botPhoneNumber}', text: '${text ? text.substring(0,20) + "..." : text}', userId: '${webUserId}', userPhone: '${webUserPhoneNumber}'. Mensaje NO ENCOLADO.`);
    return { id: 'error-store-invalid-data-add', telefono: botPhoneNumber, text: '[ERROR AL ENCOLAR: DATOS INVÁLIDOS]', sender: 'user', timestamp: Date.now(), status: 'failed', sender_id_override: webUserId, telefono_remitente_konecte: webUserPhoneNumber };
  }

  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber,         // Para `telefonoReceptorEnWhatsapp` en el bot externo
    text: text,                        // Para `textoOriginal` en el bot externo
    sender: 'user',                    // Desde la perspectiva del store, es un mensaje originado por un usuario de la plataforma
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId,     // Para `userId` en el bot externo
    telefono_remitente_konecte: webUserPhoneNumber, // Para `telefonoRemitenteParaRespuestaKonecte` en el bot externo
  };
  pendingOutboundMessages.push(message);
  // console.log(`[WhatsAppStore DEBUG addMessageToPendingOutbound] Mensaje encolado. ID: ${message.id}, Destino Bot Ubuntu (telefono): ${message.telefono}, Texto: "${message.text.substring(0,20)}...", Remitente Konecte (telefono_remitente_konecte): ${message.telefono_remitente_konecte}, UserID Konecte (sender_id_override): ${message.sender_id_override}. Total en cola: ${pendingOutboundMessages.length}`);
  return JSON.parse(JSON.stringify(message));
}


export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const stillPendingForNextCycle: WhatsAppMessage[] = [];

  // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] Procesando ${pendingOutboundMessages.length} mensajes en cola.`);

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp') {
      // VALIDACIÓN ESTRICTA DE LOS CAMPOS QUE SE USARÁN PARA PendingMessageForExternalBot
      const isIdValid = msg.id && typeof msg.id === 'string' && msg.id.trim() !== '';
      const isBotPhoneNumberValid = msg.telefono && typeof msg.telefono === 'string' && msg.telefono.trim() !== ''; // Este es el telefonoReceptorEnWhatsapp (número del bot de Ubuntu)
      const isTextValid = msg.text && typeof msg.text === 'string' && msg.text.trim() !== '';             // Este es el textoOriginal
      const isUserPhoneNumberValid = msg.telefono_remitente_konecte && typeof msg.telefono_remitente_konecte === 'string' && msg.telefono_remitente_konecte.trim() !== ''; // Este es el telefonoRemitenteParaRespuestaKonecte
      const isUserIdValid = msg.sender_id_override && typeof msg.sender_id_override === 'string' && msg.sender_id_override.trim() !== ''; // Este es el userId

      const isValidForDelivery = isIdValid && isBotPhoneNumberValid && isTextValid && isUserPhoneNumberValid && isUserIdValid;

      if (isValidForDelivery) {
        messagesToDeliver.push({
          id: msg.id!, // Ya validado como string no vacío
          telefonoReceptorEnWhatsapp: msg.telefono!, // Ya validado
          textoOriginal: msg.text!, // Ya validado
          telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte!, // Ya validado
          userId: msg.sender_id_override!, // Ya validado
        });
        // Marcamos como "procesado" conceptualmente al no re-añadirlo a la cola de este ciclo.
        // Si tuviéramos persistencia, aquí se actualizaría el estado del mensaje.
      } else {
        // Si está 'pending_to_whatsapp' pero es inválido, se descarta y se loguea.
        console.warn(`[WhatsAppStore CRITICAL getPendingMessagesForBot] Mensaje pendiente (ID: ${msg.id || 'SIN_ID_EN_MSG_OBJ'}) DESCARTADO de la entrega por datos inválidos o faltantes en el objeto almacenado:
          - msg.id: ${msg.id} (Válido: ${isIdValid})
          - msg.telefono (telefonoReceptorEnWhatsapp): ${msg.telefono} (Válido: ${isBotPhoneNumberValid})
          - msg.text (textoOriginal): ${msg.text ? `"${msg.text.substring(0,20)}..."` : msg.text} (Válido: ${isTextValid})
          - msg.telefono_remitente_konecte (telefonoRemitenteParaRespuestaKonecte): ${msg.telefono_remitente_konecte} (Válido: ${isUserPhoneNumberValid})
          - msg.sender_id_override (userId): ${msg.sender_id_override} (Válido: ${isUserIdValid})
          Este mensaje no se entregará y se elimina de la cola.`);
        // Este mensaje malformado no se añade a stillPendingForNextCycle, eliminándolo de la cola.
      }
    } else {
      // Si el mensaje no estaba 'pending_to_whatsapp', se mantiene en la cola para futuros procesamientos si es que hubiera otra lógica para ellos.
      stillPendingForNextCycle.push(msg);
    }
  }

  pendingOutboundMessages = stillPendingForNextCycle; // Actualiza la cola solo con los que realmente quedaron pendientes y no fueron consumidos ni descartados.

  if (messagesToDeliver.length > 0) {
    // console.log(`[WhatsAppStore DEBUG getPendingMessagesForBot] Entregando ${messagesToDeliver.length} mensajes válidos. IDs: ${messagesToDeliver.map(m => m.id).join(', ')}`);
  }
  return JSON.parse(JSON.stringify(messagesToDeliver));
}


export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
  // console.log(`[WhatsAppStore DEBUG getAllConversationsForAdmin] Devolviendo ${Object.keys(chatHistories).length} historiales de chat.`);
  return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
  const phoneNumbers = Object.keys(chatHistories);
  // console.log(`[WhatsAppStore DEBUG getUniquePhoneNumbersWithConversations] Números únicos con conversaciones: ${phoneNumbers.join(', ')}`);
  return phoneNumbers;
}

// Helper para limpiar la cola de pendientes (solo para desarrollo/depuración, no usar en producción sin cuidado)
export function DEV_ONLY_clearPendingOutboundMessages() {
  // console.warn("[WhatsAppStore DEV_ONLY] Limpiando todos los mensajes de pendingOutboundMessages.");
  // pendingOutboundMessages = [];
}

// Helper para ver el estado de la cola (solo para desarrollo/depuración)
export function DEV_ONLY_getPendingOutboundMessagesState() {
  // console.log("[WhatsAppStore DEV_ONLY] Estado actual de pendingOutboundMessages:", JSON.stringify(pendingOutboundMessages, null, 2));
  // return JSON.parse(JSON.stringify(pendingOutboundMessages));
}
