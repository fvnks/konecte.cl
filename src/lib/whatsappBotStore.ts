
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = [];

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export function getConversation(telefono: string): WhatsAppMessage[] {
  console.log(`[WhatsAppStore DEBUG] getConversation llamado para telefono: ${telefono}`);
  const conversation = chatHistories[telefono] || [];
  console.log(`[WhatsAppStore DEBUG] getConversation para ${telefono} devuelve ${conversation.length} mensajes. Contenido:`, JSON.stringify(conversation.slice(-3))); // Log last 3 for brevity
  return JSON.parse(JSON.stringify(conversation)); // Return a deep copy
}

export function addMessageToConversation(telefono: string, message: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'>): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToConversation llamado para telefono: ${telefono}, sender: ${message.sender}, text: "${message.text.substring(0, 50)}..."`);
  if (!chatHistories[telefono]) {
    chatHistories[telefono] = [];
  }
  const newMessage: WhatsAppMessage = {
    ...message,
    id: randomUUID(),
    telefono,
    timestamp: Date.now(),
  };
  chatHistories[telefono].push(newMessage);
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a chatHistories[${telefono}]. Nuevo total: ${chatHistories[telefono].length}. Mensaje ID: ${newMessage.id}`);
  return JSON.parse(JSON.stringify(newMessage)); // Return a deep copy
}

export function addMessageToPendingOutbound(telefono: string, text: string): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToPendingOutbound llamado para telefono: ${telefono}, texto: "${text.substring(0,50)}..."`);
  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono,
    text,
    sender: 'user',
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
  };
  pendingOutboundMessages.push(message);
  // También reflejar en el historial del chat inmediatamente para UI optimista
  addMessageToConversation(telefono, { text, sender: 'user', status: 'pending_to_whatsapp' });
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a pendingOutboundMessages. Total pendientes: ${pendingOutboundMessages.length}. Contenido actual de pendingOutboundMessages:`, JSON.stringify(pendingOutboundMessages.map(m => ({id: m.id, text: m.text.substring(0,30), status: m.status}))));
  return JSON.parse(JSON.stringify(message)); // Return a deep copy
}

export function getPendingMessagesForBot(): PendingMessageForBot[] {
  console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot llamado. ${pendingOutboundMessages.length} mensajes en cola total ANTES de filtrar.`);
  console.log(`[WhatsAppStore DEBUG] Contenido COMPLETO de pendingOutboundMessages ANTES de filtrar:`, JSON.stringify(pendingOutboundMessages));

  const messagesToDeliver: PendingMessageForBot[] = [];
  
  // Filtrar solo los que están realmente pendientes para el bot
  const stillPendingForBot = pendingOutboundMessages.filter(msg => msg.status === 'pending_to_whatsapp');
  console.log(`[WhatsAppStore DEBUG] ${stillPendingForBot.length} mensajes con status 'pending_to_whatsapp'.`);

  for (const msg of stillPendingForBot) {
    messagesToDeliver.push({
      id: msg.id,
      telefono: msg.telefono,
      text: msg.text,
    });
  }

  if (messagesToDeliver.length > 0) {
    console.log(`[WhatsAppStore DEBUG] Entregando ${messagesToDeliver.length} mensajes al bot. Contenido:`, JSON.stringify(messagesToDeliver.map(m => ({id: m.id, text: m.text.substring(0,30)}))));
    // Actualizar la cola: eliminar los mensajes que se están entregando.
    const deliveredMessageIds = new Set(messagesToDeliver.map(m => m.id));
    pendingOutboundMessages = pendingOutboundMessages.filter(msg => !deliveredMessageIds.has(msg.id));
    console.log(`[WhatsAppStore DEBUG] ${pendingOutboundMessages.length} mensajes restantes en pendingOutboundMessages DESPUÉS de la entrega.`);
    console.log(`[WhatsAppStore DEBUG] Contenido de pendingOutboundMessages DESPUÉS de la entrega:`, JSON.stringify(pendingOutboundMessages.map(m => ({id: m.id, text: m.text.substring(0,30), status: m.status}))));
  } else {
    console.log(`[WhatsAppStore DEBUG] No hay mensajes 'pending_to_whatsapp' para entregar al bot esta vez.`);
  }

  return JSON.parse(JSON.stringify(messagesToDeliver)); // Return a deep copy
}

export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
    console.log(`[WhatsAppStore DEBUG] getAllConversationsForAdmin llamado.`);
    return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
    console.log(`[WhatsAppStore DEBUG] getUniquePhoneNumbersWithConversations llamado. Total números con historial: ${Object.keys(chatHistories).length}`);
    return Object.keys(chatHistories);
}
