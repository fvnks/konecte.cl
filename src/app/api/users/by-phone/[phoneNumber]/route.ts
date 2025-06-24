import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users, plans, roles, permissions } from '@/lib/db/schema';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';

interface UserWithPlan extends User {
    plan_whatsapp_integration_enabled?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  const phoneNumber = params.phoneNumber;

  if (!phoneNumber) {
    return NextResponse.json({ success: false, reason: 'Número de teléfono no proporcionado.' }, { status: 400 });
  }

  try {
    const sql = `
      SELECT u.*, p.whatsapp_integration as plan_whatsapp_integration_enabled
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.phone_number = ?
    `;
    
    const users: UserWithPlan[] = await query(sql, [phoneNumber]);

    if (users.length === 0) {
      return NextResponse.json({ success: false, hasWhatsAppAccess: false, reason: 'Usuario no encontrado con ese número de teléfono.' }, { status: 404 });
    }

    const user = users[0];

    if (user.plan_whatsapp_integration_enabled) {
      return NextResponse.json({ success: true, hasWhatsAppAccess: true, userId: user.id });
    } else {
      return NextResponse.json({ success: false, hasWhatsAppAccess: false, reason: 'El plan del usuario no incluye acceso a WhatsApp.' }, { status: 403 });
    }

  } catch (error) {
    console.error(`[API_USER_BY_PHONE] Error al verificar el usuario ${phoneNumber}:`, error);
    return NextResponse.json({ success: false, reason: 'Error interno del servidor al verificar permisos.' }, { status: 500 });
  }
} 