import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, whatsappMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

        // 1. Get user's phone number
        const userResult = await db.select({ phoneNumber: users.phoneNumber }).from(users).where(eq(users.id, userId));
        if (userResult.length === 0 || !userResult[0].phoneNumber) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado o sin número de teléfono.' }, { status: 404 });
        }
        const userPhoneNumber = userResult[0].phoneNumber;

        // 2. Registrar el mensaje de respuesta del bot en la base de datos
        const timestamp = new Date();
        const result = await db.insert(whatsappMessages).values({
            telefono: userPhoneNumber,
            text: messageText,
            sender: 'bot',
            timestamp: timestamp,
            status: 'delivered_to_web',
            senderIdOverride: 'bot-system',
        });
        
        console.log(`[API_SEND_REPLY] Respuesta del bot para el usuario ${userId} registrada en la BD.`);

        // 3. Notificar al frontend a través de WebSockets
        const insertId = result.insertId;
        if (insertId) {
            const newMessage: WhatsAppMessage = {
                id: insertId,
                telefono: userPhoneNumber,
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