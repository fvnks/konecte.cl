// src/actions/propertyActions.ts
'use server';

import type { PropertyFormValues } from "@/lib/types"; 
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq, and, or, desc, gte, lte, like, count, sql } from "drizzle-orm";
import type { PropertyListing, PropertyType, ListingCategory, SubmitPropertyResult, OrientationType } from "@/lib/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { findMatchingRequestsForNewProperty, type NewPropertyInput } from '@/ai/flows/find-matching-requests-for-new-property-flow';
import { getUserByIdAction } from './userActions';
import { sendGenericWhatsAppMessageAction } from './otpActions';
import { users, groups, roles, comments, plans } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

// Helper function to generate a slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') 
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-'); 
};

function mapDbRowToPropertyListing(row: any): PropertyListing {
  // This function now maps from a nested Drizzle result
  const p = row; // The row is the property object
  const authorData = row.user;
  const roleData = authorData?.role;
  const planData = authorData?.plan;
  const groupData = authorData?.primaryGroup;
  
  const authorIsBroker = roleData?.id === 'broker';
  const authorPlanName = planData?.name;

  // Asegurarnos de que el nombre del grupo se asigne correctamente
  const groupName = groupData?.name || null;
  console.log('mapDbRowToPropertyListing - row structure:', JSON.stringify({
    hasUser: !!authorData,
    hasPrimaryGroup: !!groupData,
    groupName
  }, null, 2));
  
  if (groupData) {
    console.log('Group data found:', JSON.stringify(groupData, null, 2));
  }

  return {
    id: p.id,
    pub_id: p.publicationCode,
    user_id: p.userId,
    source: p.source,
    title: p.title,
    slug: p.slug,
    description: p.description,
    listingType: p.propertyType,
    category: p.category,
    price: p.price ? Number(p.price) : 0,
    currency: p.currency,
    address: p.address,
    city: p.city,
    region: p.region,
    country: p.country,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    totalAreaSqMeters: p.totalAreaSqMeters ? Number(p.totalAreaSqMeters) : 0,
    usefulAreaSqMeters: p.usefulAreaSqMeters ? Number(p.usefulAreaSqMeters) : null,
    parkingSpaces: p.parkingSpaces,
    petsAllowed: p.petsAllowed,
    furnished: p.furnished,
    commercialUseAllowed: p.commercialUseAllowed,
    hasStorage: p.hasStorage,
    orientation: p.orientation as OrientationType | null,
    images: Array.isArray(p.images) ? p.images : [], 
    features: Array.isArray(p.features) ? p.features : [],
    upvotes: p.upvotes,
    commentsCount: p.commentsCount,
    views_count: p.viewsCount,
    inquiries_count: p.inquiriesCount,
    isActive: p.isActive,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
    author: authorData ? {
      id: authorData.id, 
      name: authorData.name,
      avatarUrl: authorData.avatarUrl || undefined,
      email: authorData.email, 
      phone_number: authorData.phoneNumber, 
      role_id: authorData.roleId,
      role_name: roleData?.name,
      plan_id: authorData.planId,
      plan_name: authorPlanName,
      plan_is_pro_or_premium: authorIsBroker && (authorPlanName?.toLowerCase().includes('pro') || authorPlanName?.toLowerCase().includes('premium')),
      plan_allows_contact_view: !!planData?.can_view_contact_data,
      plan_is_premium_broker: authorIsBroker && authorPlanName?.toLowerCase().includes('premium'),
      plan_automated_alerts_enabled: !!planData?.automated_alerts_enabled,
      plan_advanced_dashboard_access: !!planData?.advanced_dashboard_access,
      group_name: groupName,
      group_avatar_url: groupData?.avatarUrl || null,
      group_badge_type: groupData?.postBadgeType || null,
    } : undefined,
  };
}


export async function submitPropertyAction(
  data: PropertyFormValues,
  userId: string
): Promise<SubmitPropertyResult> {
  console.log("[PropertyAction] Property data received on server:", data, "UserID:", userId);

  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const propertyId = randomUUID();
  const slug = generateSlug(data.title);
  const pubId = `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  try {
    const imagesJson = data.images && data.images.length > 0 ? data.images : [];
    const featuresJson = data.features ? data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0) : [];

    await db.insert(properties).values({
      id: propertyId,
      userId: userId,
      title: data.title,
      slug,
      description: data.description,
      propertyType: data.listingType,
      category: data.category,
      price: data.price.toString(),
      currency: data.currency,
      address: data.address,
      city: data.city,
      region: data.region,
      country: data.country,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      totalAreaSqMeters: data.totalAreaSqMeters.toString(),
      usefulAreaSqMeters: data.usefulAreaSqMeters?.toString(),
      parkingSpaces: data.parkingSpaces,
      petsAllowed: data.petsAllowed,
      furnished: data.furnished,
      commercialUseAllowed: data.commercialUseAllowed,
      hasStorage: data.hasStorage,
      orientation: data.orientation,
      images: imagesJson,
      features: featuresJson,
      isActive: true,
      publicationCode: pubId,
    });
    console.log(`[PropertyAction] Property submitted successfully. ID: ${propertyId}, Slug: ${slug}, PubID: ${pubId}`);

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath(`/properties/${slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/properties');

    let successMessage = "Propiedad publicada exitosamente.";
    let autoMatchesFoundCount = 0;

    try {
      const propertyOwner = await getUserByIdAction(userId);
      
      const propertyForAIMatch: NewPropertyInput = {
        id: propertyId,
        title: data.title,
        description: data.description,
        propertyType: data.listingType,
        category: data.category,
        price: data.price,
        currency: data.currency,
        address: data.address,
        city: data.city,
        region: data.region,
        country: data.country,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        totalAreaSqMeters: data.totalAreaSqMeters,
        usefulAreaSqMeters: data.usefulAreaSqMeters === null ? undefined : Number(data.usefulAreaSqMeters),
        parkingSpaces: data.parkingSpaces === null ? undefined : Number(data.parkingSpaces),
        petsAllowed: data.petsAllowed ?? undefined,
        furnished: data.furnished ?? undefined,
        commercialUseAllowed: data.commercialUseAllowed ?? undefined,
        hasStorage: data.hasStorage ?? undefined,
        orientation: data.orientation === null ? undefined : data.orientation,
        features: data.features ? data.features.split(',').map(f => f.trim()).filter(f => f) : [],
      };
      const autoMatches = await findMatchingRequestsForNewProperty(propertyForAIMatch);
      
      for (const match of autoMatches) {
        if (match.matchScore >= 0.65 && match.requestAuthorId && match.requestAuthorId !== userId) {
            autoMatchesFoundCount++;
            
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://konecte.cl';
            const propertyUrl = `${baseUrl}/properties/${slug}`;
            const requestUrl = `${baseUrl}/requests/${match.requestSlug}`;

            const propertyOwnerContact = propertyOwner?.phone_number ? `Contacto: ${propertyOwner.phone_number}.` : "Contáctalo/a a través de la plataforma.";
            const requestAuthorContact = match.requestAuthorPhoneNumber ? `Contacto: ${match.requestAuthorPhoneNumber}.` : "Contáctalo/a a través de la plataforma.";

            // 1. Notify Request Owner (if they have a phone)
            if (match.requestAuthorPhoneNumber) {
                const messageToRequestOwner = `¡Hola ${match.requestAuthorName}! La propiedad "${data.title}" de ${propertyOwner?.name || 'un usuario'} podría interesarte. ${propertyOwnerContact} Ver propiedad: ${propertyUrl}`;
                await sendGenericWhatsAppMessageAction(match.requestAuthorPhoneNumber, messageToRequestOwner, match.requestAuthorId);
            }

            // 2. Notify Property Owner (if they have a phone)
            if (propertyOwner?.phone_number) {
                const messageToPropertyOwner = `¡Hola ${propertyOwner.name}! Tu propiedad "${data.title}" coincide con la búsqueda de ${match.requestAuthorName || 'un usuario'}. ${requestAuthorContact} Ver solicitud: ${requestUrl}`;
                await sendGenericWhatsAppMessageAction(propertyOwner.phone_number, messageToPropertyOwner, propertyOwner.id);
            }
        }
      }

    } catch (aiError: any) {
      console.error("[PropertyAction] Error during auto-match AI flow or WhatsApp notification for new property:", aiError.message);
    }
    
    if (autoMatchesFoundCount > 0) {
        successMessage = `Propiedad publicada. ¡Encontramos ${autoMatchesFoundCount} coincidencia(s)! Se han enviado notificaciones por WhatsApp a las partes con número de teléfono registrado.`;
    }
    
    return { success: true, message: successMessage, propertyId, propertySlug: slug, autoMatchesCount: autoMatchesFoundCount };

  } catch (error: any) {
    console.error("[PropertyAction] Error submitting property:", error);
    let message = "Ocurrió un error desconocido al publicar la propiedad.";
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('properties.slug')) {
        message = "Ya existe una propiedad con un título muy similar (slug duplicado). Intenta con un título ligeramente diferente.";
    } else if (error.code === 'ER_DUP_ENTRY' && error.message.includes('properties.pub_id')) {
        message = "Error al generar el ID público único. Por favor, intenta de nuevo.";
    } else if (error.message) {
      message = error.message;
    }
    return { success: false, message, autoMatchesCount: 0 };
  }
}

export interface GetPropertiesActionOptions {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  searchTerm?: string;
  propertyType?: PropertyType;
  category?: ListingCategory;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  orderBy?: 'createdAt_desc' | 'price_asc' | 'price_desc' | 'popularity_desc' | 'random';
}

export async function getPropertiesAction(options: GetPropertiesActionOptions = {}): Promise<PropertyListing[]> {
  const {
    limit = 10,
    offset = 0,
    includeInactive = false,
    searchTerm,
    propertyType,
    category,
    city,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    orderBy = 'createdAt_desc',
  } = options;

  try {
    const query = db
      .select({
        // Select all fields from properties and the related tables
        ...properties,
        user: users,
        role: roles,
        plan: plans,
        primaryGroup: groups,
      })
      .from(properties)
      .leftJoin(users, eq(properties.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(plans, eq(users.planId, plans.id))
      .leftJoin(groups, eq(users.primaryGroupId, groups.id));

    const conditions = [];
    if (!includeInactive) {
      conditions.push(eq(properties.isActive, true));
    }
    if (searchTerm) {
        const keywords = searchTerm.split(' ').filter(kw => kw.length > 2);
        if (keywords.length > 0) {
            const keywordConditions = keywords.map(kw => 
                or(
                    like(properties.title, `%${kw}%`),
                    like(properties.description, `%${kw}%`)
                )
            );
            conditions.push(and(...keywordConditions));
        }
    }
    if (propertyType) {
      conditions.push(eq(properties.propertyType, propertyType));
    }
    if (category) {
      conditions.push(eq(properties.category, category));
    }
    if (city) {
      conditions.push(eq(properties.city, city));
    }
    if (minPrice !== undefined) {
      conditions.push(gte(properties.price, String(minPrice)));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(properties.price, String(maxPrice)));
    }
    if (minBedrooms !== undefined) {
      conditions.push(gte(properties.bedrooms, minBedrooms));
    }
    if (minBathrooms !== undefined) {
      conditions.push(gte(properties.bathrooms, minBathrooms));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    // Sorting logic
    if (orderBy === 'random') {
      query.orderBy(sql`RAND()`);
    } else if (orderBy === 'popularity_desc') {
      query.orderBy(desc(properties.upvotes), desc(properties.viewsCount));
    } else {
      // Default sorting for price and createdAt
      const [field, direction] = orderBy.split('_');
      const column = properties[field as keyof typeof properties];
      if (column) {
         // The price is stored as a string, so we need to cast it to a number for correct sorting
         if (field === 'price') {
            const priceColumn = sql`CAST(${properties.price} AS DECIMAL(15,2))`;
            query.orderBy(direction === 'asc' ? asc(priceColumn) : desc(priceColumn));
         } else {
            query.orderBy(direction === 'asc' ? asc(column) : desc(column));
         }
      } else {
        query.orderBy(desc(properties.createdAt)); // Default sort
      }
    }

    if (limit !== undefined) {
      query.limit(limit);
    }
    if (offset !== undefined) {
      query.offset(offset);
    }

    const rows = await query.execute();
    
    return rows.map(row => mapDbRowToPropertyListing(row));
    
  } catch (error) {
    console.error("Error in getPropertiesAction:", error);
    throw new Error(`Failed to fetch properties: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getPropertyBySlugAction(slug: string): Promise<PropertyListing | null> {
  if (!slug) {
    return null;
  }

  try {
    const result = await db.query.properties.findFirst({
      where: eq(properties.slug, slug),
      with: {
        user: {
          with: {
            role: true,
            plan: true,
            primaryGroup: true,
          }
        }
      }
    });

    if (!result) {
      return null;
    }
    
    return mapDbRowToPropertyListing(result);

  } catch (error: any) {
    console.error(`[DB_ERROR] Failed to get property by slug ${slug}:`, error);
    return null;
  }
}

export async function getUserPropertiesAction(userId: string): Promise<PropertyListing[]> {
  try {
    const userProperties = await db.query.properties.findMany({
      where: eq(properties.userId, userId),
      orderBy: [desc(properties.createdAt)],
      with: {
        user: {
          with: {
            role: true,
            plan: true,
            primaryGroup: true,
          }
        }
      }
    });
    return userProperties.map(mapDbRowToPropertyListing);
  } catch (error) {
    console.error(`[DB_ERROR] Failed to get user properties for user ${userId}:`, error);
    return [];
  }
}

export async function updatePropertyStatusAction(propertyId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
  try {
    await db.update(properties).set({ isActive }).where(eq(properties.id, propertyId));
    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath('/dashboard');
    return { success: true, message: `Estado de la propiedad actualizado a ${isActive ? 'activa' : 'inactiva'}.` };
  } catch (error: any) {
    return { success: false, message: `Error al actualizar la propiedad: ${error.message}` };
  }
}

export async function deletePropertyByAdminAction(propertyId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await db.delete(properties).where(eq(properties.id, propertyId));
    if (result.rowsAffected > 0) {
        revalidatePath('/');
        revalidatePath('/properties');
        revalidatePath('/dashboard');
        revalidatePath('/admin/properties');
        return { success: true, message: "Propiedad eliminada exitosamente." };
    }
    return { success: false, message: "No se encontró la propiedad para eliminar." };
  } catch (error: any) {
    return { success: false, message: `Error al eliminar la propiedad: ${error.message}` };
  }
}

export async function getPropertyByIdForAdminAction(propertyId: string): Promise<PropertyListing | null> {
    if (!propertyId) return null;
    try {
        const row = await db.query.properties.findFirst({
            where: eq(properties.id, propertyId),
            with: { user: { with: { role: true, plan: true, primaryGroup: true } } }
        });
        return row ? mapDbRowToPropertyListing(row) : null;
    } catch (error: any) {
        console.error(`[PropertyAction] Error fetching property by ID ${propertyId}:`, error);
        return null;
    }
}

export async function adminUpdatePropertyAction(
  propertyId: string,
  data: PropertyFormValues 
): Promise<SubmitPropertyResult> { 
  try {
    const imagesJson = data.images && data.images.length > 0 ? data.images : [];
    const featuresJson = data.features ? data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0) : [];
    
    await db.update(properties).set({
      title: data.title,
      description: data.description,
      propertyType: data.listingType,
      category: data.category,
      price: data.price.toString(),
      currency: data.currency,
      address: data.address,
      city: data.city,
      region: data.region,
      country: data.country,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      totalAreaSqMeters: data.totalAreaSqMeters.toString(),
      usefulAreaSqMeters: data.usefulAreaSqMeters?.toString(),
      parkingSpaces: data.parkingSpaces,
      petsAllowed: data.petsAllowed,
      furnished: data.furnished,
      commercialUseAllowed: data.commercialUseAllowed,
      hasStorage: data.hasStorage,
      orientation: data.orientation,
      images: imagesJson,
      features: featuresJson,
    }).where(eq(properties.id, propertyId));

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath(`/properties/${data.slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/properties');

    return { success: true, message: "Propiedad actualizada exitosamente.", propertyId, propertySlug: data.slug };
  } catch (error: any) {
    console.error(`[PropertyAction] Error updating property by admin:`, error);
    return { success: false, message: `Error del servidor: ${error.message}` };
  }
}

export async function userUpdatePropertyAction(
  userId: string, 
  propertyId: string,
  data: PropertyFormValues 
): Promise<SubmitPropertyResult> {
  try {
    const existingProperty = await db.query.properties.findFirst({
      where: and(eq(properties.id, propertyId), eq(properties.userId, userId))
    });

    if (!existingProperty) {
      return { success: false, message: "No tienes permiso para editar esta propiedad o no existe." };
    }

    const imagesJson = data.images && data.images.length > 0 ? data.images : [];
    const featuresJson = data.features ? data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0) : [];
    
    await db.update(properties).set({
      title: data.title,
      description: data.description,
      propertyType: data.listingType,
      category: data.category,
      price: data.price.toString(),
      currency: data.currency,
      address: data.address,
      city: data.city,
      region: data.region,
      country: data.country,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      totalAreaSqMeters: data.totalAreaSqMeters.toString(),
      usefulAreaSqMeters: data.usefulAreaSqMeters?.toString(),
      parkingSpaces: data.parkingSpaces,
      petsAllowed: data.petsAllowed,
      furnished: data.furnished,
      commercialUseAllowed: data.commercialUseAllowed,
      hasStorage: data.hasStorage,
      orientation: data.orientation,
      images: imagesJson,
      features: featuresJson,
    }).where(eq(properties.id, propertyId));

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath(`/properties/${data.slug}`);
    revalidatePath('/dashboard');

    return { success: true, message: "Propiedad actualizada exitosamente.", propertyId, propertySlug: data.slug };
  } catch (error: any) {
    console.error(`[PropertyAction] Error updating property by user:`, error);
    return { success: false, message: `Error del servidor: ${error.message}` };
  }
}

export async function deletePropertyByUserAction(propertyId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const result = await db.delete(properties).where(and(eq(properties.id, propertyId), eq(properties.userId, userId)));
        if (result.rowsAffected > 0) {
            revalidatePath('/');
            revalidatePath('/properties');
            revalidatePath('/dashboard/my-listings');
            return { success: true, message: "Propiedad eliminada exitosamente." };
        }
        return { success: false, message: "No se pudo eliminar la propiedad. O no fue encontrada o no tienes permiso." };
    } catch (error: any) {
        console.error(`[PropertyAction] Error deleting property by user ${userId}:`, error);
        return { success: false, message: `Error del servidor: ${error.message}` };
    }
}

export async function getPropertiesCountAction(activeOnly: boolean = false): Promise<number> {
    try {
        const query = db.select({ value: count() }).from(properties);
        if (activeOnly) {
            query.where(eq(properties.isActive, true));
        }
        const result = await query;
        return result[0]?.value ?? 0;
    } catch (error) {
        console.error("Error al obtener el conteo de propiedades:", error);
        return 0;
    }
}

export async function searchPropertiesAction(
  searchTerm: string
): Promise<{ id: string; title: string; address: string }[]> {
  try {
    const results = await db.select({
      id: properties.id,
      title: properties.title,
      address: properties.address,
    })
    .from(properties)
    .where(
      and(
        eq(properties.isActive, true),
        or(
          like(properties.title, `%${searchTerm}%`),
          like(properties.description, `%${searchTerm}%`),
          like(properties.address, `%${searchTerm}%`),
          like(properties.city, `%${searchTerm}%`)
        )
      )
    )
    .limit(10);
    return results;
  } catch (error) {
    console.error("Error al buscar propiedades:", error);
    return [];
  }
}

export async function searchMyPropertiesAction(
  userId: string,
  searchTerm: string
): Promise<{ id: string; title: string; address: string }[]> {
  try {
    const results = await db.select({
      id: properties.id,
      title: properties.title,
      address: properties.address,
    })
    .from(properties)
    .where(
      and(
        eq(properties.userId, userId),
        or(
          like(properties.title, `%${searchTerm}%`),
          like(properties.description, `%${searchTerm}%`),
          like(properties.address, `%${searchTerm}%`),
          like(properties.city, `%${searchTerm}%`)
        )
      )
    )
    .limit(10);
    return results;
  } catch (error) {
    console.error("Error al buscar mis propiedades:", error);
    return [];
  }
}

export async function getPropertyByCodeAction(code: string): Promise<PropertyListing | null> {
  try {
      const row = await db.query.properties.findFirst({
          where: eq(properties.publicationCode, code),
          with: { user: { with: { role: true, plan: true, primaryGroup: true } } }
      });
      return row ? mapDbRowToPropertyListing(row) : null;
  } catch (error: any) {
      console.error(`[PropertyAction] Error fetching property by code ${code}:`, error);
      return null;
  }
}