
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = [];

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export const BOT_SENDER_ID = 'KONECTE_EXTERNAL_WHATSAPP_BOT'; // ID para el bot cuando envía respuestas a la UI

export function getConversation(telefono: string): WhatsAppMessage[] {
  console.log(`[WhatsAppStore DEBUG] getConversation llamado para telefono: ${telefono}`);
  const conversation = chatHistories[telefono] || [];
  console.log(`[WhatsAppStore DEBUG] getConversation para ${telefono} devuelve ${conversation.length} mensajes. Contenido:`, JSON.stringify(conversation.slice(-3)));
  return JSON.parse(JSON.stringify(conversation));
}

export function addMessageToConversation(
  telefono: string, 
  messageData: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp' | 'sender_id_override'> & { original_sender_id_if_user?: string }
): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToConversation llamado para telefono: ${telefono}, sender: ${messageData.sender}, text: "${messageData.text.substring(0, 50)}..."`);
  if (!chatHistories[telefono]) {
    chatHistories[telefono] = [];
  }
  
  const newMessage: WhatsAppMessage = {
    id: randomUUID(),
    telefono,
    text: messageData.text,
    sender: messageData.sender,
    timestamp: Date.now(),
    status: messageData.status,
  };

  if (messageData.sender === 'bot') {
    newMessage.sender_id_override = BOT_SENDER_ID;
  } else if (messageData.sender === 'user' && messageData.original_sender_id_if_user) {
    newMessage.sender_id_override = messageData.original_sender_id_if_user;
  }

  chatHistories[telefono].push(newMessage);
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a chatHistories[${telefono}]. Nuevo total: ${chatHistories[telefono].length}. Mensaje ID: ${newMessage.id}, Sender: ${newMessage.sender}, Sender ID Override: ${newMessage.sender_id_override}`);
  return JSON.parse(JSON.stringify(newMessage));
}

export function addMessageToPendingOutbound(telefono: string, text: string, userId: string): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToPendingOutbound llamado para telefono: ${telefono}, texto: "${text.substring(0,50)}...", userId: ${userId}`);
  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono,
    text,
    sender: 'user', // Este mensaje es del usuario web, destinado al bot externo
    status: 'pending_to_whatsapp', // Indica que el bot externo debe recogerlo
    timestamp: Date.now(),
    sender_id_override: userId, // El ID del usuario web que envió el mensaje
  };
  pendingOutboundMessages.push(message);
  
  // También reflejar en el historial del chat inmediatamente para UI optimista
  addMessageToConversation(telefono, { 
    text, 
    sender: 'user', 
    status: 'pending_to_whatsapp',
    original_sender_id_if_user: userId // Pasar el ID del usuario real
  });
  
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a pendingOutboundMessages. Total pendientes: ${pendingOutboundMessages.length}.`);
  console.log(`[WhatsAppStore DEBUG] Contenido ACTUAL de pendingOutboundMessages:`, JSON.stringify(pendingOutboundMessages.map(m => ({id: m.id, text: m.text.substring(0,30), status: m.status, telefono: m.telefono, sender_id_override: m.sender_id_override }))));
  return JSON.parse(JSON.stringify(message));
}

export function getPendingMessagesForBot(): PendingMessageForBot[] {
  console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot llamado. ${pendingOutboundMessages.length} mensajes en cola total ANTES de filtrar.`);
  console.log(`[WhatsAppStore DEBUG] Contenido COMPLETO de pendingOutboundMessages ANTES de filtrar:`, JSON.stringify(pendingOutboundMessages));

  const messagesToDeliver: PendingMessageForBot[] = [];
  
  // Filtrar solo los que están realmente pendientes para el bot (status 'pending_to_whatsapp')
  const stillPendingForBot = pendingOutboundMessages.filter(msg => msg.status === 'pending_to_whatsapp');
  console.log(`[WhatsAppStore DEBUG] ${stillPendingForBot.length} mensajes con status 'pending_to_whatsapp'.`);

  for (const msg of stillPendingForBot) {
    messagesToDeliver.push({
      id: msg.id,
      telefono: msg.telefono, // Este es el userPhoneNumber del usuario web, para que el bot sepa a quién responder.
      text: msg.text,
      // userId: msg.sender_id_override, // Opcional: enviar el ID del usuario web al bot
    });
  }

  if (messagesToDeliver.length > 0) {
    console.log(`[WhatsAppStore DEBUG] Entregando ${messagesToDeliver.length} mensajes al bot. Contenido:`, JSON.stringify(messagesToDeliver.map(m => ({id: m.id, text: m.text.substring(0,30), telefono: m.telefono}))));
    const deliveredMessageIds = new Set(messagesToDeliver.map(m => m.id));
    pendingOutboundMessages = pendingOutboundMessages.filter(msg => !deliveredMessageIds.has(msg.id));
    console.log(`[WhatsAppStore DEBUG] ${pendingOutboundMessages.length} mensajes restantes en pendingOutboundMessages DESPUÉS de la entrega.`);
  } else {
    console.log(`[WhatsAppStore DEBUG] No hay mensajes 'pending_to_whatsapp' para entregar al bot esta vez.`);
  }
  console.log(`[WhatsAppStore DEBUG] Contenido FINAL de pendingOutboundMessages DESPUÉS de la entrega:`, JSON.stringify(pendingOutboundMessages.map(m => ({id: m.id, text: m.text.substring(0,30), status: m.status}))));
  return JSON.parse(JSON.stringify(messagesToDeliver));
}

// --- Funciones para el Visor de Admin ---
export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
    console.log(`[WhatsAppStore ADMIN_DEBUG] getAllConversationsForAdmin llamado.`);
    return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
    const phoneNumbers = Object.keys(chatHistories);
    console.log(`[WhatsAppStore ADMIN_DEBUG] getUniquePhoneNumbersWithConversations llamado. Total números con historial: ${phoneNumbers.length}. Números: ${phoneNumbers.join(', ')}`);
    return phoneNumbers;
}
