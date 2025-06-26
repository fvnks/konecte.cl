import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, properties, searchRequests } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization')?.split(' ')[1];
    if (authToken !== process.env.WHATSAPP_BOT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const telefono = searchParams.get('telefono');

    if (!telefono) {
      return NextResponse.json({ error: 'Missing telefono query parameter' }, { status: 400 });
    }

    // Buscar al usuario con y sin el prefijo '+' para asegurar la coincidencia
    const phoneWithPlus = `+${telefono}`;
    const userResult = await db.select({ id: users.id }).from(users).where(
      or(
        eq(users.phoneNumber, telefono),
        eq(users.phoneNumber, phoneWithPlus)
      )
    ).limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const listings = await db
      .select()
      .from(properties)
      .where(eq(properties.userId, user.id));

    const requests = await db
        .select()
        .from(searchRequests)
        .where(eq(searchRequests.userId, user.id));

    return NextResponse.json({ success: true, listings, requests });

  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 