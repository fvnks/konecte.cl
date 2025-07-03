import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, properties, searchRequests } from '@/lib/db/schema';
import { eq, or, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

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

    console.log(`[DEBUG] /api/listings - Recibida solicitud de tipo: ${tipo}`);
    console.log(`[DEBUG] /api/listings - Título: "${data.titulo}"`);
    
    // Asegurarnos de que no hay fechas futuras en el título
    const currentYear = new Date().getFullYear();
    if (data.titulo.includes(String(currentYear + 1)) || 
        data.titulo.includes(String(currentYear + 2)) || 
        data.titulo.includes(String(currentYear + 3))) {
      console.log(`[DEBUG] /api/listings - ADVERTENCIA: El título contiene un año futuro`);
    }

    // Extraer los últimos 9 dígitos para una búsqueda más flexible
    const last9Digits = telefono.slice(-9);

    const userResult = await db.select({ id: users.id }).from(users).where(
      like(users.phoneNumber, `%${last9Digits}`)
    ).limit(1);

    const user = userResult[0];

    if (!user) {
      console.log(`[DEBUG] /api/listings - ERROR: Usuario no encontrado para teléfono: ${telefono}`);
      return NextResponse.json({ error: `User with phone ${telefono} not found` }, { status: 404 });
    }

    console.log(`[DEBUG] /api/listings - Usuario encontrado: ${user.id}`);

    // Obtener la fecha actual para usar en created_at
    const now = new Date();
    console.log(`[DEBUG] /api/listings - Fecha actual: ${now.toISOString()}`);

    if (tipo === 'publicacion') {
      if (!data.propertyType || !data.category) {
        return NextResponse.json({ error: 'propertyType and category are required for a publication' }, { status: 400 });
      }
      
      const newPropertyId = uuidv4();
      const pubId = `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const slug = `${data.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}-${newPropertyId.substring(0, 8)}`;
      
      await db.insert(properties).values({
        id: newPropertyId,
        userId: user.id,
        publicationCode: pubId,
        source: data.source || 'bot',
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
        slug: slug,
        isActive: true, // Asegurarnos de que isActive sea true
        createdAt: now, // Establecer la fecha actual
        updatedAt: now, // Establecer la fecha actual
      });
      
      console.log(`[DEBUG] /api/listings - Propiedad creada con ID: ${newPropertyId}, pubId: ${pubId}`);
      console.log(`[DEBUG] /api/listings - Revalidando rutas...`);
      
      // Revalidar la página principal y las páginas de propiedades para mostrar inmediatamente la nueva publicación
      revalidatePath('/');
      revalidatePath('/properties');
      
      return NextResponse.json({ success: true, type: 'property', data: { id: newPropertyId, pubId, slug } });

    } else if (tipo === 'solicitud') {
        const newRequestId = uuidv4();
        const pubId = `S-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const slug = `${data.titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}-${newRequestId.substring(0, 8)}`;
        
        await db.insert(searchRequests).values({
            id: newRequestId,
            userId: user.id,
            publicationCode: pubId,
            title: data.titulo,
            description: data.descripcion,
            desiredPropertyType: data.desiredPropertyType,
            desiredCategories: data.desiredCategories,
            desiredLocation: data.desiredLocation,
            budgetMax: data.budgetMax ? String(data.budgetMax) : null,
            slug: slug,
            isActive: true, // Asegurarnos de que isActive sea true
            createdAt: now, // Establecer la fecha actual
            updatedAt: now, // Establecer la fecha actual
        });
        
        console.log(`[DEBUG] /api/listings - Solicitud creada con ID: ${newRequestId}, pubId: ${pubId}`);
        console.log(`[DEBUG] /api/listings - Revalidando rutas...`);
        
        // Revalidar la página principal y las páginas de solicitudes para mostrar inmediatamente la nueva solicitud
        revalidatePath('/');
        revalidatePath('/requests');
        
      return NextResponse.json({ success: true, type: 'searchRequest', data: { id: newRequestId, pubId, slug } });
    }
    
    return NextResponse.json({ error: 'Invalid tipo' }, { status: 400 });

  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 