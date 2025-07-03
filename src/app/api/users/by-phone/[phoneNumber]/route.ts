import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { like } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { phoneNumber: string } }
) {
  const rawPhoneNumber = params.phoneNumber;

  if (!rawPhoneNumber) {
    return NextResponse.json({ success: false, reason: 'Número de teléfono no proporcionado.' }, { status: 400 });
  }

  const last9Digits = rawPhoneNumber.slice(-9);

  if (last9Digits.length < 9) {
    return NextResponse.json({ success: false, reason: 'Formato de número no válido.' }, { status: 400 });
  }

  try {
    const results = await db.select({
        id: users.id,
        phoneVerified: users.phoneVerified
    })
    .from(users)
    .where(like(users.phoneNumber, `%${last9Digits}`));

    if (results.length === 0) {
      return NextResponse.json({ success: false, hasWhatsAppAccess: false, reason: `Usuario no encontrado con un número que termine en ${last9Digits}.` }, { status: 404 });
    }

    const user = results[0];

    if (user.phoneVerified) {
      return NextResponse.json({ success: true, hasWhatsAppAccess: true, userId: user.id });
    } else {
      return NextResponse.json({ success: false, hasWhatsAppAccess: false, reason: 'El número de teléfono del usuario no está verificado.' }, { status: 403 });
    }

  } catch (error) {
    console.error(`[API_USER_BY_PHONE] Error al verificar el usuario que termina en ${last9Digits}:`, error);
    return NextResponse.json({ success: false, reason: 'Error interno del servidor al verificar permisos.' }, { status: 500 });
  }
} 