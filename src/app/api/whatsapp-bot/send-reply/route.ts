import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { WhatsAppMessage } from '@/lib/types';

async function notifyFrontend(userId: string, message: WhatsAppMessage) {
    const emitterUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/socket-emitter`;
    try {
        await fetch(emitterUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, message }),
        });
        console.log(`[API_SEND_REPLY] Notificación enviada al frontend para el usuario ${userId}`);
    } catch (error) {
        console.error(`[API_SEND_REPLY] Error al notificar al frontend:`, error);
        // No bloqueamos la respuesta por un fallo en la notificación en tiempo real
    }
}

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
        const result: any = await query(insertSql, [messageText, timestamp, 'bot-system', userId]);
        
        console.log(`[API_SEND_REPLY] Respuesta del bot para el usuario ${userId} registrada en la BD.`);

        // 2. Notificar al frontend a través de WebSockets
        if (result.insertId) {
            const newMessage: WhatsAppMessage = {
                id: result.insertId,
                telefono: '', // El número no es necesario para el frontend en este punto
                text: messageText,
                sender: 'bot',
                timestamp: timestamp.toISOString(),
                status: 'delivered_to_web',
                sender_id_override: 'bot-system'
            };
            await notifyFrontend(userId, newMessage);
        }

        return NextResponse.json({ success: true, message: 'Respuesta del bot recibida y procesada.' });

    } catch (error) {
        console.error('[API_SEND_REPLY] Error al procesar la respuesta del bot:', error);
        return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
} 