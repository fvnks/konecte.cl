import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, messageText, source } = body;

        if (!userId || !messageText || source !== 'bot') {
            return NextResponse.json({ success: false, message: 'Datos inválidos o fuente no autorizada.' }, { status: 400 });
        }

        // 1. Registrar el mensaje de respuesta del bot en la base de datos
        const insertSql = `
            INSERT INTO whatsapp_messages (telefono, text, sender, timestamp, status, sender_id_override)
            SELECT phone_number, ?, 'bot', ?, 'delivered_to_web', ?
            FROM users WHERE id = ?
        `;
        const timestamp = new Date();
        await query(insertSql, [messageText, timestamp, 'bot-system', userId]);
        
        console.log(`[API_SEND_REPLY] Respuesta del bot para el usuario ${userId} registrada en la BD.`);

        // 2. Lógica futura: Notificar al frontend a través de WebSockets (Pusher, Socket.io, etc.)
        // Por ejemplo: await pusher.trigger(`user-chat-${userId}`, 'new-message', { messageText });

        return NextResponse.json({ success: true, message: 'Respuesta del bot recibida y procesada.' });

    } catch (error) {
        console.error('[API_SEND_REPLY] Error al procesar la respuesta del bot:', error);
        return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
} 