
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = [];

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT';

export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string') {
    // console.warn('[WhatsAppStore WARN] getConversation llamado con userPhoneNumber inválido:', userPhoneNumber);
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
    console.error(`[WhatsAppStore CRITICAL] addMessageToConversation: userPhoneNumber es inválido: '${userPhoneNumber}'. No se guardará el mensaje.`);
    // Devolver un mensaje de error o un objeto que indique fallo
    return { id: 'error-no-phone', telefono: '', text: 'Error: Teléfono de usuario inválido', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }
  if (!messageData.text || typeof messageData.text !== 'string' || messageData.text.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL] addMessageToConversation: el texto del mensaje es inválido para ${userPhoneNumber}. No se guardará el mensaje.`);
    return { id: 'error-no-text', telefono: userPhoneNumber, text: 'Error: Texto de mensaje inválido', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
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
  // console.log(`[WhatsAppStore DEBUG] Mensaje añadido a chatHistories para ${userPhoneNumber}. Total: ${chatHistories[userPhoneNumber].length}`);
  return JSON.parse(JSON.stringify(newMessage));
}

export function addMessageToPendingOutbound(
  botPhoneNumber: string, // Número del bot de WhatsApp al que el bot externo debe enviar el mensaje
  text: string,           // Texto del mensaje
  webUserId: string,      // ID del usuario web que originó este mensaje
  webUserPhoneNumber: string // Número del usuario web, para que el bot externo sepa a quién responder en Konecte
): WhatsAppMessage {
  // Validación estricta aquí también, aunque la API ya debería haberlo hecho
  if (!botPhoneNumber || typeof botPhoneNumber !== 'string' || botPhoneNumber.trim() === '') {
    console.error("[WhatsAppStore CRITICAL] addMessageToPendingOutbound: 'botPhoneNumber' es inválido. No se añadirá a la cola.");
    return { id: 'error-no-bot-phone', telefono: '', text, sender: 'user', timestamp: Date.now(), status: 'failed' };
  }
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.error("[WhatsAppStore CRITICAL] addMessageToPendingOutbound: 'text' es inválido. No se añadirá a la cola.");
    return { id: 'error-no-text', telefono: botPhoneNumber, text: '[ERROR: TEXTO FALTANTE EN STORE]', sender: 'user', timestamp: Date.now(), status: 'failed' };
  }
  if (!webUserId || typeof webUserId !== 'string' || webUserId.trim() === '') {
    console.error("[WhatsAppStore CRITICAL] addMessageToPendingOutbound: 'webUserId' es inválido. No se añadirá a la cola.");
    return { id: 'error-no-userid', telefono: botPhoneNumber, text, sender: 'user', timestamp: Date.now(), status: 'failed' };
  }
  if (!webUserPhoneNumber || typeof webUserPhoneNumber !== 'string' || webUserPhoneNumber.trim() === '') {
    console.error("[WhatsAppStore CRITICAL] addMessageToPendingOutbound: 'webUserPhoneNumber' es inválido. No se añadirá a la cola.");
    return { id: 'error-no-userphone', telefono: botPhoneNumber, text, sender: 'user', timestamp: Date.now(), status: 'failed' };
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
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a pendingOutboundMessages. Total pendientes: ${pendingOutboundMessages.length}. Datos: telefono=${message.telefono}, text="${message.text.substring(0,20)}...", remitente_konecte=${message.telefono_remitente_konecte}`);
  return JSON.parse(JSON.stringify(message));
}

export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const remainingPendingMessages: WhatsAppMessage[] = [];

  for (const msg of pendingOutboundMessages) {
    // Validación estricta de los campos necesarios para crear un PendingMessageForExternalBot
    const isValidForDelivery =
      msg.status === 'pending_to_whatsapp' &&
      msg.id && typeof msg.id === 'string' && msg.id.trim() !== '' &&
      msg.telefono && typeof msg.telefono === 'string' && msg.telefono.trim() !== '' && // Este es el numero del bot de WhatsApp
      msg.text && typeof msg.text === 'string' && msg.text.trim() !== '' &&
      msg.telefono_remitente_konecte && typeof msg.telefono_remitente_konecte === 'string' && msg.telefono_remitente_konecte.trim() !== '' &&
      msg.sender_id_override && typeof msg.sender_id_override === 'string' && msg.sender_id_override.trim() !== '';

    if (isValidForDelivery) {
      messagesToDeliver.push({
        id: msg.id,
        telefonoReceptorEnWhatsapp: msg.telefono,
        textoOriginal: msg.text,
        telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte!, // El ! es seguro por la validación
        userId: msg.sender_id_override!, // El ! es seguro por la validación
      });
      // No añadir a remainingPendingMessages si se va a entregar
    } else {
      if (msg.status === 'pending_to_whatsapp') { // Si era para entregar pero falló la validación
        console.warn(`[WhatsAppStore WARN] Omitiendo mensaje pendiente malformado o incompleto de getPendingMessagesForBot: ID=${msg.id}, telefonoBot=${msg.telefono}, text=${msg.text ? `"${msg.text.substring(0,20)}..."` : '[SIN TEXTO]'}, remitente_konecte=${msg.telefono_remitente_konecte}, sender_override=${msg.sender_id_override}`);
        // Estos mensajes malformados se descartan de la cola para no reintentar indefinidamente
      } else {
        // Si el status no era 'pending_to_whatsapp', o por alguna otra razón no es para entregar ahora, se mantiene
        remainingPendingMessages.push(msg);
      }
    }
  }

  pendingOutboundMessages = remainingPendingMessages;

  if (messagesToDeliver.length > 0) {
    console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: Entregando ${messagesToDeliver.length} mensajes al bot. IDs: ${messagesToDeliver.map(m => m.id).join(', ')}`);
  } else {
    // console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: No hay mensajes válidos para entregar al bot esta vez.`);
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
