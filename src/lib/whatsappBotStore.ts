// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage } from './types';

// In-memory store for chat histories (userPhoneNumber -> messages)
const chatHistories: Record<string, WhatsAppMessage[]> = {};

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

// Simple unique ID generator that works in both Node and browser environments
const generateId = () => `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT';

export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string') {
    console.warn(`[WhatsAppStore WARN getConversation] Invalid userPhoneNumber: ${userPhoneNumber}`);
    return [];
  }
  const conversation = chatHistories[userPhoneNumber] || [];
  
  // SOLUCIÓN TEMPORAL: Limitar el historial para evitar crash del navegador.
  // Esto previene que una conversación larga en memoria colapse el frontend.
  // La solución a largo plazo es migrar esto a una base de datos con paginación.
  const limitedConversation = conversation.slice(-50);

  return JSON.parse(JSON.stringify(limitedConversation)); // Deep copy
}

export function addMessageToConversation(
  userPhoneNumber: string,
  messageData: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'> & { original_sender_id_if_user?: string }
): WhatsAppMessage {
  if (!userPhoneNumber || typeof userPhoneNumber !== 'string' || userPhoneNumber.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] userPhoneNumber es inválido: '${userPhoneNumber}'. No se guardará en chatHistories.`);
    return { id: 'error-no-phone-history-' + generateId(), telefono: userPhoneNumber, text: '[ERROR: TELÉFONO INVÁLIDO EN HISTORIAL]', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }
  if (!messageData.text || typeof messageData.text !== 'string' || messageData.text.trim() === '') {
    console.error(`[WhatsAppStore CRITICAL addMessageToConversation] texto del mensaje es inválido para ${userPhoneNumber}. No se guardará en chatHistories.`);
    return { id: 'error-no-text-history-' + generateId(), telefono: userPhoneNumber, text: '[ERROR: TEXTO INVÁLIDO EN HISTORIAL]', sender: messageData.sender, timestamp: Date.now(), status: 'failed' };
  }

  if (!chatHistories[userPhoneNumber]) {
    chatHistories[userPhoneNumber] = [];
  }

  const newMessage: WhatsAppMessage = {
    id: generateId(),
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
