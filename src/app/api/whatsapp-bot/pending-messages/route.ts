
// src/app/api/whatsapp-bot/pending-messages/route.ts
import { NextResponse } from 'next/server';
import { getPendingMessagesForBot } from '@/lib/whatsappBotStore';

export async function GET(request: Request) {
  console.log('[API PendingMessages] Recibida solicitud GET.');
  try {
    const pendingMessages = getPendingMessagesForBot();
    
    if (pendingMessages.length > 0) {
      console.log(`[API PendingMessages] Entregando ${pendingMessages.length} mensajes pendientes al bot:`, JSON.stringify(pendingMessages));
    } else {
      console.log(`[API PendingMessages] No hay mensajes pendientes para entregar.`);
    }

    return NextResponse.json({ success: true, messages: pendingMessages });
  } catch (error: any) {
    console.error('[API PendingMessages] Error procesando la solicitud:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al obtener mensajes pendientes.' }, { status: 500 });
  }
}
