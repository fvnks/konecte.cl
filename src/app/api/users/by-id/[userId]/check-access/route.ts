import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';

interface UserWithPlan extends User {
    plan_whatsapp_integration_enabled?: boolean;
}

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const userId = params.userId;

    if (!userId) {
        return NextResponse.json({ success: false, reason: 'ID de usuario no proporcionado.' }, { status: 400 });
    }

    try {
        const sql = `
            SELECT u.*, p.whatsapp_integration as plan_whatsapp_integration_enabled
            FROM users u
            LEFT JOIN plans p ON u.plan_id = p.id
            WHERE u.id = ?
        `;
        
        const users: UserWithPlan[] = await query(sql, [userId]);

        if (users.length === 0) {
            return NextResponse.json({ success: false, hasWhatsAppAccess: false, reason: 'Usuario no encontrado con ese ID.' }, { status: 404 });
        }

        const user = users[0];

        if (user.plan_whatsapp_integration_enabled) {
            return NextResponse.json({ success: true, hasWhatsAppAccess: true, userId: user.id });
        } else {
            return NextResponse.json({ success: false, hasWhatsAppAccess: false, reason: 'El plan del usuario no incluye acceso a WhatsApp.' }, { status: 403 });
        }

    } catch (error) {
        console.error(`[API_USER_BY_ID] Error al verificar el usuario ${userId}:`, error);
        return NextResponse.json({ success: false, reason: 'Error interno del servidor al verificar permisos.' }, { status: 500 });
    }
} 