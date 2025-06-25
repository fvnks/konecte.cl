import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Datos de ejemplo para mostrar cuando no hay solicitudes en la base de datos
const sampleRequests = [
  {
    id: '1',
    title: 'Busco departamento en arriendo en Providencia',
    description: 'Busco departamento de 2 dormitorios en Providencia, idealmente cerca del metro. Presupuesto máximo de 500.000 pesos.',
    budget: 500000,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    location: {
      city: 'Providencia',
      region: 'Metropolitana',
    },
    user: {
      id: '201',
      name: 'Roberto Sánchez',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Interesado en comprar casa en Viña del Mar',
    description: 'Familia busca casa en Viña del Mar, mínimo 3 dormitorios, con jardín y cerca de colegios.',
    budget: 180000000,
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    location: {
      city: 'Viña del Mar',
      region: 'Valparaíso',
    },
    user: {
      id: '202',
      name: 'Patricia Muñoz',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Busco oficina pequeña en Las Condes',
    description: 'Profesional independiente busca oficina pequeña en Las Condes, idealmente edificio con buena conectividad.',
    budget: 400000,
    listingType: 'rent',
    bedrooms: 0,
    bathrooms: 1,
    location: {
      city: 'Las Condes',
      region: 'Metropolitana',
    },
    user: {
      id: '203',
      name: 'Felipe Torres',
    },
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    // Intentamos una consulta más simple para ver si hay solicitudes
    const requests = await query(`
      SELECT 
        r.*
      FROM property_requests r
      LIMIT 5
    `);

    // Si no hay solicitudes en la base de datos, devolver datos de ejemplo
    if (!requests || requests.length === 0) {
      console.log('No requests found in database, returning sample data');
      return NextResponse.json(sampleRequests);
    }

    // Si hay solicitudes, las formateamos adecuadamente
    const formattedRequests = requests.map((request: any) => {
      return {
        id: request.id,
        title: request.title || 'Solicitud sin título',
        description: request.description || 'Sin descripción',
        budget: request.price || 0, // Asumiendo que se usa 'price' en lugar de 'budget'
        listingType: request.listing_type || 'rent',
        bedrooms: request.bedrooms || 0,
        bathrooms: request.bathrooms || 0,
        location: {
          city: request.location_city || 'Ciudad no especificada',
          region: request.location_region || 'Región no especificada',
        },
        user: {
          id: request.user_id || '0',
          name: 'Usuario',
        },
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching featured requests:', error);
    // En caso de error, devolver los datos de ejemplo
    console.log('Error occurred, returning sample data');
    return NextResponse.json(sampleRequests);
  }
} 