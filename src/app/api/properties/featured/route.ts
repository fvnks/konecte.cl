import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const safeJsonParse = (jsonString: string | null) => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse images JSON, returning empty array:', jsonString);
    return [];
  }
};

export async function GET() {
  try {
    // Consulta para obtener datos reales de propiedades con información de usuario
    const properties = await query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.avatar_url as user_avatar_url,
        u.role_id as user_role_id,
        r.name as role_name
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY p.created_at DESC
      LIMIT 9
    `);

    // Si no hay propiedades en la base de datos, devolver array vacío
    if (!properties || properties.length === 0) {
      console.log('No properties found in database');
      return NextResponse.json([]);
    }

    // Si hay propiedades, las formateamos adecuadamente
    const formattedProperties = properties.map((property: any) => {
      // Usamos un try-catch aquí para que una propiedad con datos corruptos no rompa toda la lista
      try {
        return {
          id: property.id,
          title: property.title || 'Propiedad sin título',
          description: property.description || 'Sin descripción',
          price: Number(property.price) || 0,
          listingType: property.property_type || 'sale',
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          squareMeters: property.square_meters || 0,
          location: {
            city: property.city || 'Ciudad no especificada',
            region: property.region || 'Región no especificada',
          },
          images: safeJsonParse(property.images),
          user: {
            id: property.user_id || '0',
            name: property.user_name || 'Anunciante',
            role_id: property.user_role_id || '1',
            role_name: property.role_name || getRoleDisplayName(property.user_role_id),
            avatarUrl: property.user_avatar_url || null,
          },
          createdAt: property.created_at,
          updatedAt: property.updated_at,
          source: property.source || 'web',
          slug: property.slug || `${property.title?.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').substring(0, 60)}-${property.id}`,
          pub_id: property.publication_code,
        };
      } catch(e) {
        console.error(`Error processing property ${property.id}, skipping.`, e);
        return null;
      }
    }).filter(Boolean); // Filtramos los nulos que resultan de un error

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    // En caso de error, devolver array vacío
    return NextResponse.json([]);
  }
}

// Función auxiliar para obtener el nombre del rol
function getRoleDisplayName(roleId?: string): string {
  if (!roleId) return 'Usuario';
  switch (roleId) {
    case '1': return 'Usuario';
    case '2': return 'Corredor';
    case '3': return 'Administrador';
    default: return 'Usuario';
  }
} 