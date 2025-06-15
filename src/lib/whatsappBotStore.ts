
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = []; // Cambiado a let para reasignación

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export function getConversation(telefono: string): WhatsAppMessage[] {
  console.log(`[WhatsAppStore DEBUG] getConversation llamado para telefono: ${telefono}`);
  const conversation = chatHistories[telefono] || [];
  console.log(`[WhatsAppStore DEBUG] getConversation para ${telefono} devuelve ${conversation.length} mensajes.`);
  return conversation;
}

export function addMessageToConversation(telefono: string, message: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'>): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToConversation llamado para telefono: ${telefono}, sender: ${message.sender}`);
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
  return newMessage;
}

export function addMessageToPendingOutbound(telefono: string, text: string): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToPendingOutbound llamado para telefono: ${telefono}, texto: "${text}"`);
  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono,
    text,
    sender: 'user', // Mensajes desde el frontend al bot son 'user'
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
  };
  pendingOutboundMessages.push(message);
  addMessageToConversation(telefono, { text, sender: 'user', status: 'pending_to_whatsapp' }); // También reflejar en el historial del chat
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a pendingOutboundMessages. Total pendientes: ${pendingOutboundMessages.length}. Mensaje ID: ${message.id}`);
  return message;
}

export function getPendingMessagesForBot(): PendingMessageForBot[] {
  console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot llamado. ${pendingOutboundMessages.length} mensajes en cola total.`);
  
  const messagesToDeliver: PendingMessageForBot[] = [];
  const remainingMessages: WhatsAppMessage[] = [];

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp') {
      messagesToDeliver.push({
        id: msg.id,
        telefono: msg.telefono,
        text: msg.text,
      });
      // No cambiamos el estado aquí; el bot es responsable de confirmar.
      // Si quisiéramos marcarlo como "entregado al bot", lo haríamos, pero
      // la lógica actual es eliminarlos una vez entregados.
    } else {
      // Conservar mensajes que no están listos para el bot o ya fueron procesados (en un sistema más complejo)
      remainingMessages.push(msg);
    }
  }

  if (messagesToDeliver.length > 0) {
    console.log(`[WhatsAppStore DEBUG] Entregando ${messagesToDeliver.length} mensajes al bot.`);
    // Actualizar la cola: eliminar los mensajes que se están entregando.
    // Esto asume que el bot los procesará. Si falla, el mensaje se pierde.
    const deliveredMessageIds = new Set(messagesToDeliver.map(m => m.id));
    pendingOutboundMessages = pendingOutboundMessages.filter(msg => !deliveredMessageIds.has(msg.id));
    console.log(`[WhatsAppStore DEBUG] ${pendingOutboundMessages.length} mensajes restantes en pendingOutboundMessages después de la entrega.`);
  } else {
    console.log(`[WhatsAppStore DEBUG] No hay mensajes 'pending_to_whatsapp' para entregar al bot.`);
  }

  return messagesToDeliver;
}

export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
    console.log(`[WhatsAppStore DEBUG] getAllConversationsForAdmin llamado.`);
    return JSON.parse(JSON.stringify(chatHistories)); // Devuelve una copia profunda
}

export function getUniquePhoneNumbersWithConversations(): string[] {
    console.log(`[WhatsAppStore DEBUG] getUniquePhoneNumbersWithConversations llamado.`);
    return Object.keys(chatHistories);
}
