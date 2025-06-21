// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage } from './types';
import { randomUUID } from 'crypto';

// In-memory store for chat histories (userPhoneNumber -> messages)
const chatHistories: Record<string, WhatsAppMessage[]> = {};

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

export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
  return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
  const phoneNumbers = Object.keys(chatHistories);
  return phoneNumbers;
}
