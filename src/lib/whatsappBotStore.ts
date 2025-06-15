
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = [];

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT';

export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string') {
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
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] userPhoneNumber es inválido: '${userPhoneNumber}'. No se guardará el mensaje en chatHistories.`);
    return { id: 'error-no-phone', telefono: '', text: 'Error: Teléfono de usuario inválido para historial', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }
  if (!messageData.text || typeof messageData.text !== 'string' || messageData.text.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] el texto del mensaje es inválido para ${userPhoneNumber}. No se guardará el mensaje en chatHistories.`);
    return { id: 'error-no-text', telefono: userPhoneNumber, text: 'Error: Texto de mensaje inválido para historial', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }

  if (!chatHistories[userPhoneNumber]) {
    chatHistories[userPhoneNumber] = [];
  }

  const newMessage: WhatsAppMessage = {
    id: randomUUID(),
    telefono: userPhoneNumber, // La clave de esta conversación es el userPhoneNumber
    text: messageData.text,
    sender: messageData.sender,
    timestamp: Date.now(),
    status: messageData.status,
    sender_id_override: messageData.sender === 'user'
      ? messageData.original_sender_id_if_user
      : BOT_SENDER_ID,
  };

  chatHistories[userPhoneNumber].push(newMessage);
  // console.log(`[WhatsAppStore DEBUG] Mensaje añadido a chatHistories para ${userPhoneNumber}. Total: ${chatHistories[userPhoneNumber].length}. Sender: ${newMessage.sender}`);
  return JSON.parse(JSON.stringify(newMessage));
}

export function addMessageToPendingOutbound(
  botPhoneNumber: string, // Número del bot de WhatsApp (destino para el bot de Ubuntu)
  text: string,
  webUserId: string,
  webUserPhoneNumber: string // Teléfono del usuario web (para la respuesta)
): WhatsAppMessage {
  // Validaciones (aunque la API debería haberlas hecho, defensa en profundidad)
  if (!botPhoneNumber || typeof botPhoneNumber !== 'string' || botPhoneNumber.trim() === '') {
    console.error("[WhatsAppStore CRITICAL addMessageToPendingOutbound] 'botPhoneNumber' (destino para bot Ubuntu) es inválido. No se encolará.");
    return { id: 'error-store-no-bot-phone', telefono: '', text, sender: 'user', timestamp: Date.now(), status: 'failed' };
  }
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.error("[WhatsAppStore CRITICAL addMessageToPendingOutbound] 'text' es inválido. No se encolará.");
    return { id: 'error-store-no-text', telefono: botPhoneNumber, text: '[ERROR STORE: TEXTO FALTANTE]', sender: 'user', timestamp: Date.now(), status: 'failed' };
  }
  if (!webUserId || typeof webUserId !== 'string' || webUserId.trim() === '') {
    console.error("[WhatsAppStore CRITICAL addMessageToPendingOutbound] 'webUserId' es inválido. No se encolará.");
    return { id: 'error-store-no-userid', telefono: botPhoneNumber, text, sender: 'user', timestamp: Date.now(), status: 'failed' };
  }
  if (!webUserPhoneNumber || typeof webUserPhoneNumber !== 'string' || webUserPhoneNumber.trim() === '') {
    console.error("[WhatsAppStore CRITICAL addMessageToPendingOutbound] 'webUserPhoneNumber' (remitente Konecte) es inválido. No se encolará.");
    return { id: 'error-store-no-userphone', telefono: botPhoneNumber, text, sender: 'user', timestamp: Date.now(), status: 'failed' };
  }

  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber, // Este es el "telefonoReceptorEnWhatsapp" para el bot Ubuntu
    text: text,
    sender: 'user', // Desde la perspectiva del store, es un mensaje de "usuario" de la plataforma
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId, // ID del usuario de Konecte
    telefono_remitente_konecte: webUserPhoneNumber, // Número del usuario de Konecte para la respuesta
  };
  pendingOutboundMessages.push(message);
  // console.log(`[WhatsAppStore DEBUG] addMessageToPendingOutbound: Mensaje encolado. Total: ${pendingOutboundMessages.length}. Destino Ubuntu: ${message.telefono}, Remitente Konecte: ${message.telefono_remitente_konecte}, Texto: "${message.text.substring(0,20)}..."`);
  return JSON.parse(JSON.stringify(message));
}

export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const remainingPendingMessages: WhatsAppMessage[] = [];

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp') {
      // Validación MUY ESTRICTA aquí antes de considerar el mensaje para entrega
      const telefonoReceptorValido = msg.telefono && typeof msg.telefono === 'string' && msg.telefono.trim() !== '';
      const textoValido = msg.text && typeof msg.text === 'string' && msg.text.trim() !== '';
      const remitenteKonecteValido = msg.telefono_remitente_konecte && typeof msg.telefono_remitente_konecte === 'string' && msg.telefono_remitente_konecte.trim() !== '';
      const userIdValido = msg.sender_id_override && typeof msg.sender_id_override === 'string' && msg.sender_id_override.trim() !== '';

      const isValidForDelivery = telefonoReceptorValido && textoValido && remitenteKonecteValido && userIdValido;

      if (isValidForDelivery) {
        messagesToDeliver.push({
          id: msg.id,
          telefonoReceptorEnWhatsapp: msg.telefono!, // Número del bot, destino para whatsapp-web.js
          textoOriginal: msg.text!,                 // Mensaje del usuario web
          telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte!, // Número del usuario web, para que el bot sepa a quién responder en Konecte
          userId: msg.sender_id_override!,          // ID del usuario web
        });
        // El mensaje válido se entrega, no se añade a remainingPendingMessages.
      } else {
        console.warn(`[WhatsAppStore CRITICAL getPendingMessagesForBot] Mensaje pendiente (ID: ${msg.id}) DESCARTADO de la cola por datos inválidos/faltantes:
          - msg.telefono (telefonoReceptorEnWhatsapp): ${msg.telefono} (Tipo: ${typeof msg.telefono})
          - msg.text (textoOriginal): ${msg.text ? `"${msg.text.substring(0,30)}..."` : msg.text} (Tipo: ${typeof msg.text})
          - msg.telefono_remitente_konecte (telefonoRemitenteParaRespuestaKonecte): ${msg.telefono_remitente_konecte} (Tipo: ${typeof msg.telefono_remitente_konecte})
          - msg.sender_id_override (userId): ${msg.sender_id_override} (Tipo: ${typeof msg.sender_id_override})
          Este mensaje no se entregará al bot de Ubuntu y se elimina de la cola.`);
        // No se añade a remainingPendingMessages, eliminándolo de la cola para evitar reintentos.
      }
    } else {
      // Si no estaba 'pending_to_whatsapp', se mantiene en la cola para futuros procesamientos (si aplica).
      remainingPendingMessages.push(msg);
    }
  }

  pendingOutboundMessages = remainingPendingMessages;

  if (messagesToDeliver.length > 0) {
    // console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: Entregando ${messagesToDeliver.length} mensajes válidos.`);
  }
  return JSON.parse(JSON.stringify(messagesToDeliver));
}


export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
  return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
  const phoneNumbers = Object.keys(chatHistories);
  return phoneNumbers;
}
