import { NextRequest, NextResponse } from 'next/server';
import { getPropertiesAction, type GetPropertiesActionOptions } from '@/actions/propertyActions';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

// Esquema de validación para los parámetros de búsqueda
const searchParamsSchema = z.object({
  telefono: z.string().min(5, { message: "Phone number is required" }),
  searchTerm: z.string().optional(),
  propertyType: z.enum(['rent', 'sale']).optional(),
  category: z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other']).optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minBedrooms: z.coerce.number().int().min(0).optional(),
  minBathrooms: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  orderBy: z.enum(['createdAt_desc', 'price_asc', 'price_desc', 'popularity_desc', 'random']).optional().default('createdAt_desc'),
});

export async function GET(req: NextRequest) {
  // 1. Verificar Autorización del Bot
  const authToken = req.headers.get('authorization')?.split(' ')[1];
  if (authToken !== process.env.WHATSAPP_BOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  // 2. Validar Parámetros
  const validation = searchParamsSchema.safeParse(params);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid search parameters', details: validation.error.flatten() }, { status: 400 });
  }
  
  const { telefono, ...searchOptions } = validation.data;
  
  // 3. Verificar que el Usuario exista
  try {
    const phoneWithPlus = telefono.startsWith('+') ? telefono : `+${telefono}`;
    const userResult = await db.select({ id: users.id }).from(users).where(
      or(
        eq(users.phoneNumber, telefono),
        eq(users.phoneNumber, phoneWithPlus)
      )
    ).limit(1);
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch(error) {
     console.error('[API /properties/search] Error verifying user:', error);
     return NextResponse.json({ error: 'Internal Server Error during user verification' }, { status: 500 });
  }

  // 4. Llamar a la Acción de Búsqueda
  try {
    const properties = await getPropertiesAction(searchOptions);
    
    // 5. Devolver Resultados
    return NextResponse.json(properties);

  } catch (error) {
    console.error('[API /properties/search] Error fetching properties:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 