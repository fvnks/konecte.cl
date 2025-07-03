import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { properties, users, roles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const results = await db.select({
      property: properties,
      user: users,
      role: roles,
    })
    .from(properties)
    .leftJoin(users, eq(properties.userId, users.id))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .orderBy(desc(properties.createdAt))
    .limit(9);

    if (!results || results.length === 0) {
      console.log('No properties found in database');
      return NextResponse.json([]);
    }

    const formattedProperties = results.map(({ property, user, role }) => {
      try {
        return {
          id: property.id,
          title: property.title || 'Propiedad sin título',
          description: property.description || 'Sin descripción',
          price: Number(property.price) || 0,
          listingType: property.propertyType || 'sale',
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          squareMeters: property.totalAreaSqMeters || 0,
          location: {
            city: property.city || 'Ciudad no especificada',
            region: property.region || 'Región no especificada',
          },
          images: safeJsonParse(property.images as string | null),
          user: {
            id: user?.id || '0',
            name: user?.name || 'Anunciante',
            role_id: user?.roleId || '1',
            role_name: role?.name || 'Usuario',
            avatarUrl: user?.avatarUrl || null,
          },
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
          source: property.source || 'web',
          slug: property.slug || `${property.title?.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').substring(0, 60)}-${property.id}`,
          pub_id: property.publicationCode,
        };
      } catch(e) {
        console.error(`Error processing property ${property.id}, skipping.`, e);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return NextResponse.json([]);
  }
} 