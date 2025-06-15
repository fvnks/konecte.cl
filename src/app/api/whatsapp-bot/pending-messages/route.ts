
// src/app/api/whatsapp-bot/pending-messages/route.ts
import { NextResponse } from 'next/server';
import { getPendingMessagesForBot } from '@/lib/whatsappBotStore';

export async function GET(request: Request) {
  // TODO: Considerar añadir algún tipo de autenticación para el bot
  // (ej. API Key en headers) para proteger este endpoint.
  try {
    const pendingMessages = getPendingMessagesForBot();
    
    if (pendingMessages.length > 0) {
      console.log(`[API PendingMessages] Entregando ${pendingMessages.length} mensajes pendientes al bot.`);
    }

    return NextResponse.json({ success: true, messages: pendingMessages });
  } catch (error: any) {
    console.error('[API PendingMessages] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al obtener mensajes pendientes.' }, { status: 500 });
  }
}
