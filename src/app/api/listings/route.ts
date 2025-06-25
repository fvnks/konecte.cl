import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, properties, searchRequests } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const publicationSchema = z.object({
  telefono: z.string(),
  tipo: z.enum(['publicacion', 'solicitud']),
  source: z.enum(['web', 'bot']).optional(),
  titulo: z.string(),
  descripcion: z.string(),
  propertyType: z.enum(['rent', 'sale']).optional(),
  category: z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other']).optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  parkingSpaces: z.number().optional(),
  hasStorage: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  furnished: z.boolean().optional(),
  // SearchRequest specific
  desiredPropertyType: z.array(z.enum(['rent', 'sale'])).optional(),
  desiredCategories: z.array(z.enum(['apartment', 'house', 'condo', 'land', 'commercial', 'other'])).optional(),
  desiredLocation: z.object({
    city: z.string(),
    region: z.string(),
  }).optional(),
  budgetMax: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization')?.split(' ')[1];
    if (authToken !== process.env.WHATSAPP_BOT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = publicationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { telefono, tipo, ...data } = validation.data;

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
      return NextResponse.json({ error: `User with phone ${telefono} not found` }, { status: 404 });
    }

    if (tipo === 'publicacion') {
      if (!data.propertyType || !data.category) {
        return NextResponse.json({ error: 'propertyType and category are required for a publication' }, { status: 400 });
      }
      
      const newPropertyId = uuidv4();
      await db.insert(properties).values({
        id: newPropertyId,
        userId: user.id,
        source: data.source || 'web',
        title: data.titulo,
        description: data.descripcion,
        propertyType: data.propertyType,
        category: data.category,
        price: data.price ? String(data.price) : undefined,
        currency: data.currency,
        address: data.address,
        city: data.city,
        region: data.region,
        country: 'Chile',
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parkingSpaces: data.parkingSpaces,
        hasStorage: data.hasStorage,
        petsAllowed: data.petsAllowed,
        furnished: data.furnished,
        slug: `${data.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}-${newPropertyId.substring(0, 8)}`,
      });
      return NextResponse.json({ success: true, type: 'property', data: { id: newPropertyId } });

    } else if (tipo === 'solicitud') {
        const newRequestId = uuidv4();
        await db.insert(searchRequests).values({
            id: newRequestId,
            userId: user.id,
            title: data.titulo,
            description: data.descripcion,
            desiredPropertyType: data.desiredPropertyType,
            desiredCategories: data.desiredCategories,
            desiredLocation: data.desiredLocation,
            budgetMax: data.budgetMax ? String(data.budgetMax) : null,
            slug: `${data.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}-${newRequestId.substring(0, 8)}`,
        });
      return NextResponse.json({ success: true, type: 'searchRequest', data: { id: newRequestId } });
    }
    
    return NextResponse.json({ error: 'Invalid tipo' }, { status: 400 });

  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 