import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Datos de ejemplo para mostrar cuando no hay propiedades en la base de datos
const sampleProperties = [
  {
    id: '1',
    title: 'Departamento en Arriendo en Santiago Centro',
    description: 'Hermoso departamento de 2 dormitorios en pleno centro de Santiago, cercano a metro y servicios.',
    price: 450000,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    squareMeters: 65,
    location: {
      city: 'Santiago',
      region: 'Metropolitana',
    },
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    ],
    user: {
      id: '101',
      name: 'Ana Martínez',
    },
  },
  {
    id: '2',
    title: 'Casa en Venta en La Reina',
    description: 'Amplia casa familiar con jardín y piscina, 4 dormitorios y 3 baños, en sector residencial.',
    price: 280000000,
    listingType: 'sale',
    bedrooms: 4,
    bathrooms: 3,
    squareMeters: 180,
    location: {
      city: 'La Reina',
      region: 'Metropolitana',
    },
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    ],
    user: {
      id: '102',
      name: 'Carlos Rodríguez',
    },
  },
  {
    id: '3',
    title: 'Oficina en Arriendo en Las Condes',
    description: 'Moderna oficina implementada en edificio de categoría, con estacionamiento y seguridad 24/7.',
    price: 850000,
    listingType: 'rent',
    bedrooms: 0,
    bathrooms: 1,
    squareMeters: 45,
    location: {
      city: 'Las Condes',
      region: 'Metropolitana',
    },
    images: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2301&q=80',
    ],
    user: {
      id: '103',
      name: 'María González',
    },
  },
];

export async function GET() {
  try {
    // Intentamos una consulta más simple para ver si hay propiedades
    const properties = await query(`
      SELECT 
        p.*
      FROM properties p
      LIMIT 8
    `);

    // Si no hay propiedades en la base de datos, devolver datos de ejemplo
    if (!properties || properties.length === 0) {
      console.log('No properties found in database, returning sample data');
      return NextResponse.json(sampleProperties);
    }

    // Si hay propiedades, las formateamos adecuadamente
    const formattedProperties = properties.map((property: any) => {
      return {
        id: property.id,
        title: property.title || 'Propiedad sin título',
        description: property.description || 'Sin descripción',
        price: property.price || 0,
        listingType: property.listing_type || 'rent',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        squareMeters: property.square_meters || 0,
        location: {
          city: property.location_city || 'Ciudad no especificada',
          region: property.location_region || 'Región no especificada',
        },
        images: [],
        user: {
          id: property.user_id || '0',
          name: 'Usuario',
        },
        createdAt: property.created_at,
        updatedAt: property.updated_at,
      };
    });

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    // En caso de error, devolver los datos de ejemplo
    console.log('Error occurred, returning sample data');
    return NextResponse.json(sampleProperties);
  }
} 