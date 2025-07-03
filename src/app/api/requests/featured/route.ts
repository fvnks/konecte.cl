import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchRequests, users, roles } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await db.select({
        request: searchRequests,
        user: users,
        role: roles,
    })
    .from(searchRequests)
    .leftJoin(users, eq(searchRequests.userId, users.id))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(searchRequests.isActive, true))
    .orderBy(sql`RAND()`)
    .limit(9);

    if (!results || results.length === 0) {
      console.log('No requests found in database');
      return NextResponse.json([]);
    }

    const formattedRequests = results.map(({ request, user, role }) => {
      return {
        id: request.id,
        title: request.title || 'Solicitud sin título',
        description: request.description || 'Sin descripción',
        budget: Number(request.budgetMax) || 0,
        listingType: request.desiredPropertyTypeRent ? 'rent' : 'sale',
        bedrooms: request.minBedrooms || 0,
        bathrooms: request.minBathrooms || 0,
        location: {
          city: request.desiredLocationCity || 'Ciudad no especificada',
          region: request.desiredLocationRegion || 'Región no especificada',
        },
        user: {
          id: user?.id || '0',
          name: user?.name || 'Solicitante',
          role_id: user?.roleId || '1',
          role_name: role?.name || 'Usuario',
          avatarUrl: user?.avatarUrl || null,
        },
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        slug: request.slug || `${request.title?.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').substring(0, 60)}-${request.id}`,
        pub_id: request.publicationCode,
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching featured requests:', error);
    return NextResponse.json([]);
  }
} 