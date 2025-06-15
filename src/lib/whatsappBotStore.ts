
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = []; // Esta cola es para mensajes que el bot externo debe recoger

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT'; // ID para el bot cuando responde en la UI

// Obtiene la conversación para un número de teléfono específico (usado por la UI del usuario web)
export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  console.log(`[WhatsAppStore DEBUG] getConversation llamado para userPhoneNumber: ${userPhoneNumber}`);
  const conversation = chatHistories[userPhoneNumber] || [];
  console.log(`[WhatsAppStore DEBUG] getConversation para ${userPhoneNumber} devuelve ${conversation.length} mensajes.`);
  return JSON.parse(JSON.stringify(conversation));
}

// Añade un mensaje al historial de chat de un usuario específico (usado por la UI y cuando el bot responde)
export function addMessageToConversation(
  userPhoneNumber: string, 
  messageData: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'> & { original_sender_id_if_user?: string }
): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToConversation llamado para userPhoneNumber: ${userPhoneNumber}, sender: ${messageData.sender}, text: "${messageData.text.substring(0, 50)}..."`);
  if (!chatHistories[userPhoneNumber]) {
    chatHistories[userPhoneNumber] = [];
  }
  
  const newMessage: WhatsAppMessage = {
    id: randomUUID(),
    telefono: userPhoneNumber, // Siempre es el teléfono del usuario web aquí
    text: messageData.text,
    sender: messageData.sender,
    timestamp: Date.now(),
    status: messageData.status,
    sender_id_override: messageData.sender === 'user' 
                        ? messageData.original_sender_id_if_user // El ID del usuario web real
                        : BOT_SENDER_ID, // El ID del bot para respuestas
  };

  chatHistories[userPhoneNumber].push(newMessage);
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a chatHistories[${userPhoneNumber}]. Nuevo total: ${chatHistories[userPhoneNumber].length}. Msg ID: ${newMessage.id}, Sender: ${newMessage.sender}, sender_id_override: ${newMessage.sender_id_override}`);
  return JSON.parse(JSON.stringify(newMessage));
}

// Añade un mensaje a la cola que el bot externo (Ubuntu) debe recoger
export function addMessageToPendingOutbound(
  botPhoneNumber: string, // El número del bot de WhatsApp al que el bot externo debe enviar
  text: string, 
  webUserId: string, // El ID del usuario web que originó este mensaje
  webUserPhoneNumber: string // El número del usuario web, para que el bot externo sepa a quién responder en Konecte
): WhatsAppMessage {
  console.log(`[WhatsAppStore DEBUG] addMessageToPendingOutbound llamado. Destino bot: ${botPhoneNumber}, Texto: "${text.substring(0,50)}...", Originador UserID: ${webUserId}, Teléfono Remitente Konecte: ${webUserPhoneNumber}`);
  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber, // El 'telefono' aquí es el destino para el bot de Ubuntu
    text,
    sender: 'user', // Desde la perspectiva del bot externo, este es un mensaje 'de usuario' (de la plataforma)
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId, // Quién lo originó en Konecte
    telefono_remitente_konecte: webUserPhoneNumber, // Crucial para que el bot de Ubuntu sepa a quién responder en la UI de Konecte
  };
  pendingOutboundMessages.push(message);
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a pendingOutboundMessages. Total pendientes: ${pendingOutboundMessages.length}.`);
  return JSON.parse(JSON.stringify(message));
}

// Obtiene los mensajes que el bot externo (Ubuntu) debe procesar y enviar a WhatsApp
export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot llamado. ${pendingOutboundMessages.length} mensajes en cola ANTES de filtrar.`);
  
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const remainingPendingMessages: WhatsAppMessage[] = [];

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp' && msg.telefono_remitente_konecte) {
      messagesToDeliver.push({
        id: msg.id,
        telefonoReceptorEnWhatsapp: msg.telefono, // Este es el número del bot de WhatsApp
        textoOriginal: msg.text,
        telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte, // Número del usuario web original
        userId: msg.sender_id_override!, // ID del usuario web original
      });
    } else {
      remainingPendingMessages.push(msg); // Conservar otros mensajes que no son para el bot
    }
  }
  
  pendingOutboundMessages = remainingPendingMessages;

  if (messagesToDeliver.length > 0) {
    console.log(`[WhatsAppStore DEBUG] Entregando ${messagesToDeliver.length} mensajes al bot externo. IDs: ${messagesToDeliver.map(m=>m.id).join(', ')}`);
  } else {
    console.log(`[WhatsAppStore DEBUG] No hay mensajes 'pending_to_whatsapp' para el bot externo esta vez.`);
  }
  return JSON.parse(JSON.stringify(messagesToDeliver));
}


// --- Funciones para el Visor de Admin ---
export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
    console.log(`[WhatsAppStore ADMIN_DEBUG] getAllConversationsForAdmin llamado.`);
    // Devuelve el historial de chats de los usuarios web, indexado por el número del usuario web.
    return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
    // Estos son los números de los usuarios web que tienen un historial de chat.
    const phoneNumbers = Object.keys(chatHistories);
    console.log(`[WhatsAppStore ADMIN_DEBUG] getUniquePhoneNumbersWithConversations llamado. Total números con historial: ${phoneNumbers.length}. Números: ${phoneNumbers.join(', ')}`);
    return phoneNumbers;
}
