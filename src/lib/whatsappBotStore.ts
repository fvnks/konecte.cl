
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForExternalBot } from './types';
import { randomUUID } from 'crypto';

const chatHistories: Record<string, WhatsAppMessage[]> = {};
let pendingOutboundMessages: WhatsAppMessage[] = [];

console.log('[WhatsAppStore] Store inicializado/reiniciado.');

export const BOT_SENDER_ID = 'KONECTE_WHATSAPP_BOT_ASSISTANT';

export function getConversation(userPhoneNumber: string): WhatsAppMessage[] {
  const conversation = chatHistories[userPhoneNumber] || [];
  return JSON.parse(JSON.stringify(conversation));
}

export function addMessageToConversation(
  userPhoneNumber: string,
  messageData: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'> & { original_sender_id_if_user?: string }
): WhatsAppMessage {
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
  botPhoneNumber: string, // Número del bot de WhatsApp al que el bot externo debe enviar el mensaje
  text: string,           // Texto del mensaje
  webUserId: string,      // ID del usuario web que originó este mensaje
  webUserPhoneNumber: string // Número del usuario web, para que el bot externo sepa a quién responder en Konecte
): WhatsAppMessage {
  
  // Asegurarse de que los datos cruciales no sean undefined o vacíos aquí también,
  // aunque la API route debería haberlos validado.
  if (!text || text.trim() === "") {
    console.error("[WhatsAppStore CRITICAL] addMessageToPendingOutbound: 'text' es vacío o nulo. No se añadirá a la cola.");
    // Podríamos lanzar un error o devolver null/undefined si esta situación es inaceptable.
    // Por ahora, solo logueamos y no añadimos.
    // Devolvemos un objeto con error para que el llamador pueda reaccionar.
    // En la práctica, la API route ya debería haber prevenido esto.
    return { 
        id: randomUUID(), 
        telefono: botPhoneNumber, 
        text: "[ERROR: TEXTO FALTANTE]", 
        sender: 'user', 
        timestamp: Date.now(), 
        status: 'failed' 
    };
  }
  if (!webUserPhoneNumber || webUserPhoneNumber.trim() === "") {
    console.error("[WhatsAppStore CRITICAL] addMessageToPendingOutbound: 'webUserPhoneNumber' (telefono_remitente_konecte) es vacío o nulo. No se añadirá a la cola.");
    return { 
        id: randomUUID(), 
        telefono: botPhoneNumber, 
        text: text, 
        sender: 'user', 
        timestamp: Date.now(), 
        status: 'failed' 
    };
  }


  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono: botPhoneNumber, // Este es el 'telefonoReceptorEnWhatsapp' para el bot de Ubuntu
    text: text, // Este es el 'textoOriginal'
    sender: 'user', // Desde la perspectiva del bot de Ubuntu, la plataforma Konecte es un 'user' que le da un mensaje para enviar
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
    sender_id_override: webUserId, // El ID del usuario web que originó el mensaje
    telefono_remitente_konecte: webUserPhoneNumber, // Crucial: A quién responder en la UI de Konecte
  };
  pendingOutboundMessages.push(message);
  console.log(`[WhatsAppStore DEBUG] Mensaje añadido a pendingOutboundMessages. Total pendientes: ${pendingOutboundMessages.length}. Datos: telefono=${message.telefono}, text=${message.text.substring(0,20)}..., remitente_konecte=${message.telefono_remitente_konecte}`);
  return JSON.parse(JSON.stringify(message));
}

export function getPendingMessagesForBot(): PendingMessageForExternalBot[] {
  const messagesToDeliver: PendingMessageForExternalBot[] = [];
  const remainingPendingMessages: WhatsAppMessage[] = [];

  for (const msg of pendingOutboundMessages) {
    // Solo procesar mensajes que están explícitamente pendientes para WhatsApp Y tienen los campos necesarios
    if (
      msg.status === 'pending_to_whatsapp' &&
      msg.telefono && typeof msg.telefono === 'string' && msg.telefono.trim() !== '' &&                          // El número del bot de WhatsApp
      msg.text && typeof msg.text === 'string' && msg.text.trim() !== '' &&                                      // El texto del mensaje
      msg.telefono_remitente_konecte && typeof msg.telefono_remitente_konecte === 'string' && msg.telefono_remitente_konecte.trim() !== '' && // El número del usuario web
      msg.sender_id_override && typeof msg.sender_id_override === 'string' && msg.sender_id_override.trim() !== '' // El ID del usuario web
    ) {
      messagesToDeliver.push({
        id: msg.id,
        telefonoReceptorEnWhatsapp: msg.telefono, // Número del bot de WhatsApp al que se debe enviar el mensaje
        textoOriginal: msg.text,
        telefonoRemitenteParaRespuestaKonecte: msg.telefono_remitente_konecte, // Número del usuario web para la respuesta
        userId: msg.sender_id_override, // ID del usuario web
      });
      // Marcar como procesado (o eliminarlo de la cola, según la estrategia)
      // Por ahora, simplemente no lo añadimos a remainingPendingMessages si es válido para entrega
    } else if (msg.status === 'pending_to_whatsapp') {
      // Mensaje pendiente pero malformado o con datos faltantes
      console.warn(`[WhatsAppStore WARN] Omitiendo mensaje pendiente malformado o incompleto de getPendingMessagesForBot: ID=${msg.id}, telefono=${msg.telefono}, text=${msg.text ? msg.text.substring(0,20) + '...' : '[SIN TEXTO]'}, remitente_konecte=${msg.telefono_remitente_konecte}`);
      // Estos mensajes malformados se quedan en la cola o se mueven a una cola de "fallidos"
      // Por simplicidad, los dejamos fuera de la entrega actual pero los mantenemos en remaining si queremos reintentar/revisar.
      // O mejor, si no son válidos para entrega, se descartan de `pendingOutboundMessages` para evitar bucles.
      // Para esta iteración, los omitiremos de la entrega pero no los re-añadiremos a la cola principal si están malformados y son 'pending_to_whatsapp'.
      // Si el mensaje no es 'pending_to_whatsapp' o no tiene telefono_remitente_konecte, se mantiene:
    } else {
       remainingPendingMessages.push(msg);
    }
  }

  // Actualizar la cola de mensajes pendientes solo con los que no fueron entregados O no eran para el bot
  pendingOutboundMessages = remainingPendingMessages;

  if (messagesToDeliver.length > 0) {
    console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: Entregando ${messagesToDeliver.length} mensajes al bot. IDs: ${messagesToDeliver.map(m => m.id).join(', ')}`);
  } else {
    console.log(`[WhatsAppStore DEBUG] getPendingMessagesForBot: No hay mensajes válidos para entregar al bot esta vez.`);
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
