import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Consulta para obtener datos reales de solicitudes con información de usuario
    const requests = await query(`
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar_url as user_avatar_url,
        u.role_id as user_role_id,
        ro.name as role_name
      FROM property_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN roles ro ON u.role_id = ro.id
      WHERE r.is_active = 1
      ORDER BY RAND()
      LIMIT 9
    `);

    // Si no hay solicitudes en la base de datos, devolver array vacío
    if (!requests || requests.length === 0) {
      console.log('No requests found in database');
      return NextResponse.json([]);
    }

    // Si hay solicitudes, las formateamos adecuadamente
    const formattedRequests = requests.map((request: any) => {
      return {
        id: request.id,
        title: request.title || 'Solicitud sin título',
        description: request.description || 'Sin descripción',
        budget: Number(request.budget_max) || 0,
        listingType: request.desired_property_type || 'sale',
        bedrooms: request.min_bedrooms || 0,
        bathrooms: request.min_bathrooms || 0,
        location: {
          city: request.desired_location_city || 'Ciudad no especificada',
          region: request.desired_location_region || 'Región no especificada',
        },
        user: {
          id: request.user_id || '0',
          name: request.user_name || 'Solicitante',
          role_id: request.user_role_id || '1',
          role_name: request.role_name || getRoleDisplayName(request.user_role_id),
          avatarUrl: request.user_avatar_url || null,
        },
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        source: request.source || 'web',
        slug: request.slug || `${request.title?.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').substring(0, 60)}-${request.id}`,
        pub_id: request.publication_code,
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching featured requests:', error);
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