
// src/lib/whatsappBotStore.ts
import type { WhatsAppMessage, PendingMessageForBot } from './types';
import { randomUUID } from 'crypto';

/**
 * Simulación de una base de datos en memoria para el chat del bot de WhatsApp.
 * ¡ADVERTENCIA! Esto es solo para fines de demostración/desarrollo.
 * Los datos se perderán cada vez que el servidor se reinicie.
 * Para producción, usa una base de datos persistente.
 */

// Almacena el historial de chat para cada número de teléfono.
// La clave es el número de teléfono del usuario.
const chatHistories: Record<string, WhatsAppMessage[]> = {};

// Almacena los mensajes enviados desde el frontend web que el bot de WhatsApp aún no ha procesado.
const pendingOutboundMessages: WhatsAppMessage[] = [];

export function getConversation(telefono: string): WhatsAppMessage[] {
  return chatHistories[telefono] || [];
}

export function addMessageToConversation(telefono: string, message: Omit<WhatsAppMessage, 'id' | 'telefono' | 'timestamp'>): WhatsAppMessage {
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
  return newMessage;
}

export function addMessageToPendingOutbound(telefono: string, text: string): WhatsAppMessage {
  const message: WhatsAppMessage = {
    id: randomUUID(),
    telefono,
    text,
    sender: 'user',
    status: 'pending_to_whatsapp',
    timestamp: Date.now(),
  };
  pendingOutboundMessages.push(message);
  // También lo agregamos al historial general del chat
  addMessageToConversation(telefono, { text, sender: 'user', status: 'pending_to_whatsapp' });
  return message;
}

export function getPendingMessagesForBot(): PendingMessageForBot[] {
  const messagesToSend: PendingMessageForBot[] = [];
  // Iterar en reversa para poder eliminar elementos de forma segura mientras se itera, o filtrar después
  const stillPending: WhatsAppMessage[] = [];

  for (const msg of pendingOutboundMessages) {
    if (msg.status === 'pending_to_whatsapp') {
      messagesToSend.push({
        id: msg.id,
        telefono: msg.telefono,
        text: msg.text,
      });
      // Marcar como enviado al bot para evitar reenvíos
      // En un sistema real, esto requeriría un mecanismo de ACK/NACK o lease.
      // Por simplicidad, lo marcaremos aquí y luego lo eliminaremos.
      // O, para ser más precisos, solo devolvemos y el bot debe confirmar/eliminar.
      // Para este ejemplo, modificaremos el estado.
      msg.status = 'sent_to_whatsapp'; // Marcar como procesado por esta llamada
    }
    // Conservar los que no se enviaron o los que están en otros estados (si los hubiera)
    if (msg.status !== 'sent_to_whatsapp') {
      stillPending.push(msg);
    }
  }
  // Actualizar la cola de pendientes (esto es una simplificación)
  // En un sistema real, no se modificaría directamente aquí, sino que el bot confirmaría.
  // Por ahora, para evitar re-procesamiento simple, vaciaremos los enviados.
  // Una mejor aproximación sería que el bot llame a otro endpoint para marcar como "recibido/procesando".
  // Esta implementación simple asume que si el bot los obtiene, los procesará.
  // Para que el bot no los vuelva a obtener, los filtramos de `pendingOutboundMessages`.
  // Esta lógica es delicada para un sistema real.
  //
  // REFINAMIENTO: Para este prototipo, una vez que el bot obtiene los mensajes,
  // los eliminaremos de la cola de pendientes para que no los vuelva a obtener.
  // El bot es responsable de asegurar que los envía.
  // Si el bot falla después de obtenerlos pero antes de enviarlos, el mensaje se perdería.
  
  // Filtramos los mensajes que fueron enviados al bot
  const idsSentToBot = messagesToSend.map(m => m.id);
  const remainingPending = pendingOutboundMessages.filter(msg => !idsSentToBot.includes(msg.id));
  
  // Reasignar pendingOutboundMessages (no es ideal para concurrencia, pero ok para in-memory)
  pendingOutboundMessages.length = 0; // Vaciar el array
  pendingOutboundMessages.push(...remainingPending); // Añadir los que quedan

  return messagesToSend;
}

export function getAllConversationsForAdmin(): Record<string, WhatsAppMessage[]> {
    // Devuelve una copia para evitar modificaciones externas
    return JSON.parse(JSON.stringify(chatHistories));
}

export function getUniquePhoneNumbersWithConversations(): string[] {
    return Object.keys(chatHistories);
}

// Podríamos añadir más funciones según sea necesario, como marcar mensajes como leídos, etc.
// Este es un almacén muy básico.
