
// src/app/api/whatsapp-bot/conversation/[telefono]/route.ts
import { NextResponse } from 'next/server';
import { getConversation } from '@/lib/whatsappBotStore';

interface Params {
  telefono: string;
}

export async function GET(request: Request, context: { params: Params }) {
  // TODO: Considerar autenticación para este endpoint si no es público.
  // Actualmente, se asume que el usuario logueado solo puede pedir su propia conversación.
  // Si es llamado por el frontend, el frontend debe asegurar que el usuario
  // solo pide su propio número de teléfono.
  try {
    const telefono = context.params.telefono;

    if (!telefono) {
      return NextResponse.json({ success: false, message: 'Número de teléfono no proporcionado.' }, { status: 400 });
    }

    const conversationMessages = getConversation(telefono);
    return NextResponse.json(conversationMessages); // Devuelve directamente el array de mensajes
  } catch (error: any) {
    console.error('[API GetConversation] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al obtener conversación.' }, { status: 500 });
  }
}
