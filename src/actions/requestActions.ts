// src/actions/requestActions.ts
'use server';

import type { RequestFormValues, SubmitRequestResult } from "@/lib/types"; 
import type { SearchRequest, User, PropertyType, ListingCategory } from "@/lib/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { findMatchingPropertiesForNewRequest, type NewRequestInput } from '@/ai/flows/find-matching-properties-for-new-request-flow';
import { getUserByIdAction } from './userActions';
import { sendGenericWhatsAppMessageAction } from './otpActions';
import { db } from "@/lib/db";
import { searchRequests, users } from "@/lib/db/schema";
import { and, eq, count, sql, desc, asc, like, or, gte, lte, SQL } from "drizzle-orm";
import { SearchRequestOptional } from "@/lib/types";

// Helper function to generate a slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') 
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-'); 
};

function mapDbRowToSearchRequest(row: any): SearchRequest {
  const p = row;
  const authorData = row.user;
  const groupData = authorData?.primaryGroup;

  const desiredPropertyType: PropertyType[] = [];
  if (p.desiredPropertyTypeRent) desiredPropertyType.push('rent');
  if (p.desiredPropertyTypeSale) desiredPropertyType.push('sale');

  const desiredCategories: ListingCategory[] = [];
  if (p.desiredCategoryApartment) desiredCategories.push('apartment');
  if (p.desiredCategoryHouse) desiredCategories.push('house');
  if (p.desiredCategoryCondo) desiredCategories.push('condo');
  if (p.desiredCategoryLand) desiredCategories.push('land');
  if (p.desiredCategoryCommercial) desiredCategories.push('commercial');
  if (p.desiredCategoryOther) desiredCategories.push('other');
  
  const author: User | undefined = authorData ? {
    id: authorData.id,
    name: authorData.name,
    avatarUrl: authorData.avatarUrl || undefined,
    role_id: authorData.roleId || '',
    phone_number: authorData.phoneNumber,
    group_name: groupData?.name,
    group_avatar_url: groupData?.avatarUrl,
    group_badge_type: groupData?.postBadgeType,
  } : undefined;

  return {
    id: p.id,
    pub_id: p.publicationCode,
    user_id: p.userId,
    title: p.title,
    slug: p.slug,
    description: p.description,
    desiredPropertyType,
    desiredCategories,
    desiredLocation: {
      city: p.desiredLocationCity,
      region: p.desiredLocationRegion,
      neighborhood: p.desiredLocationNeighborhood || undefined,
    },
    minBedrooms: p.minBedrooms !== null ? Number(p.minBedrooms) : undefined,
    minBathrooms: p.minBathrooms !== null ? Number(p.minBathrooms) : undefined,
    budgetMax: p.budgetMax !== null ? Number(p.budgetMax) : undefined,
    open_for_broker_collaboration: Boolean(p.openForBrokerCollaboration),
    commentsCount: Number(p.commentsCount),
    upvotes: Number(p.upvotes || 0),
    isActive: Boolean(p.isActive),
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
    author,
  };
}

export async function submitRequestAction(
  data: RequestFormValues, 
  userId: string
): Promise<SubmitRequestResult> {
  console.log("[RequestAction] Request data received on server:", data, "UserID:", userId);

  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const requestId = randomUUID();
  const slug = generateSlug(data.title);
  const pubId = `S-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  try {
    
    await db.insert(searchRequests).values({
        id: requestId,
        userId: userId,
        title: data.title,
        slug: slug,
        description: data.description,
        desiredLocationCity: data.desiredLocationCity,
        desiredLocationRegion: data.desiredLocationRegion,
        isActive: true,
        commentsCount: 0,
        upvotes: 0,
        publicationCode: pubId,
        desiredPropertyTypeRent: data.desiredPropertyType.includes('rent'),
        desiredPropertyTypeSale: data.desiredPropertyType.includes('sale'),
        desiredCategoryApartment: data.desiredCategories.includes('apartment'),
        desiredCategoryHouse: data.desiredCategories.includes('house'),
        desiredCategoryCondo: data.desiredCategories.includes('condo'),
        desiredCategoryLand: data.desiredCategories.includes('land'),
        desiredCategoryCommercial: data.desiredCategories.includes('commercial'),
        desiredCategoryOther: data.desiredCategories.includes('other'),
        openForBrokerCollaboration: data.open_for_broker_collaboration || false,
        desiredLocationNeighborhood: data.desiredLocationNeighborhood && data.desiredLocationNeighborhood.trim() !== '' ? data.desiredLocationNeighborhood.trim() : null,
        minBedrooms: (data.minBedrooms !== undefined && data.minBedrooms !== '' && data.minBedrooms !== null) ? Number(data.minBedrooms) : null,
        minBathrooms: (data.minBathrooms !== undefined && data.minBathrooms !== '' && data.minBathrooms !== null) ? Number(data.minBathrooms) : null,
        budgetMax: (data.budgetMax !== undefined && data.budgetMax !== '' && data.budgetMax !== null) ? Number(data.budgetMax) : null,
    })

    console.log(`[RequestAction] Request submitted successfully. ID: ${requestId}, Slug: ${slug}, PubID: ${pubId}`);
    
    revalidatePath('/');
    revalidatePath('/requests');
    revalidatePath(`/requests/${slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/requests');

    let successMessage = "Solicitud publicada exitosamente.";
    let autoMatchesFoundCount = 0;

    try {
      const requestPublisher = await getUserByIdAction(userId);

      const requestForAIMatch: NewRequestInput = {
        id: requestId,
        title: data.title,
        description: data.description,
        desiredPropertyType: data.desiredPropertyType,
        desiredCategories: data.desiredCategories,
        desiredLocationCity: data.desiredLocationCity,
        desiredLocationRegion: data.desiredLocationRegion,
        desiredLocationNeighborhood: data.desiredLocationNeighborhood || undefined,
        minBedrooms: (data.minBedrooms !== undefined && data.minBedrooms !== '' && data.minBedrooms !== null) ? Number(data.minBedrooms) : undefined,
        minBathrooms: (data.minBathrooms !== undefined && data.minBathrooms !== '' && data.minBathrooms !== null) ? Number(data.minBathrooms) : undefined,
        budgetMax: (data.budgetMax !== undefined && data.budgetMax !== '' && data.budgetMax !== null) ? Number(data.budgetMax) : undefined,
      };
      const autoMatches = await findMatchingPropertiesForNewRequest(requestForAIMatch);

      for (const match of autoMatches) {
        if (match.matchScore >= 0.65 && match.propertyAuthorId && match.propertyAuthorId !== userId) {
            autoMatchesFoundCount++;

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://konecte.cl';
            const requestUrl = `${baseUrl}/requests/${slug}`;
            const propertyUrl = `${baseUrl}/properties/${match.propertySlug}`;

            const requestPublisherContact = requestPublisher?.phone_number ? `Contacto: ${requestPublisher.phone_number}.` : "Contáctalo/a a través de la plataforma.";
            const propertyAuthorContact = match.propertyAuthorPhoneNumber ? `Contacto: ${match.propertyAuthorPhoneNumber}.` : "Contáctalo/a a través de la plataforma.";
            
            // 1. Notify Property Owner (if they have a phone)
            if (match.propertyAuthorPhoneNumber) {
                const messageToPropertyOwner = `¡Hola ${match.propertyAuthorName}! La solicitud "${data.title}" de ${requestPublisher?.name || 'un usuario'} podría coincidir con tu propiedad. ${requestPublisherContact} Ver solicitud: ${requestUrl}`;
                await sendGenericWhatsAppMessageAction(match.propertyAuthorPhoneNumber, messageToPropertyOwner, match.propertyAuthorId);
            }
            
            // 2. Notify Request Publisher (if they have a phone)
            if (requestPublisher?.phone_number) {
                const messageToRequestPublisher = `¡Hola ${requestPublisher.name}! Tu solicitud "${data.title}" coincide con la propiedad "${match.propertyTitle}" de ${match.propertyAuthorName || 'un usuario'}. ${propertyAuthorContact} Ver propiedad: ${propertyUrl}`;
                await sendGenericWhatsAppMessageAction(requestPublisher.phone_number, messageToRequestPublisher, requestPublisher.id);
            }
        }
      }
      
    } catch (aiError: any) {
      console.error("[RequestAction] Error during auto-match AI flow or WhatsApp notification for new request:", aiError.message);
    }
    
    if (autoMatchesFoundCount > 0) {
      successMessage = `Solicitud publicada. ¡Encontramos ${autoMatchesFoundCount} propiedad(es) que podrían coincidir! Se han enviado notificaciones por WhatsApp a las partes con número de teléfono registrado.`;
    }

    return { success: true, message: successMessage, requestId, requestSlug: slug, autoMatchesCount: autoMatchesFoundCount };

  } catch (error: any) {
    console.error("[RequestAction] Error submitting request:", error);
    let message = `Error al publicar solicitud: ${error.message}`; 
     if (error.code === 'ER_DUP_ENTRY' && error.message.includes('slug')) {
        message = "Ya existe una solicitud con un título muy similar. Por favor, elige un título único.";
     }
    return { success: false, message };
  }
}

export interface GetRequestsActionOptions {
  includeInactive?: boolean;
  userId?: string; 
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt_desc' | 'relevance' | 'random';
  searchTerm?: string;
  propertyType?: 'rent' | 'sale';
  category?: 'apartment' | 'house' | 'condo' | 'land' | 'commercial' | 'other';
  city?: string;
  minBedrooms?: number;
  minBathrooms?: number;
  maxBudget?: number;
}

export async function getRequestsAction(options: GetRequestsActionOptions = {}) {
  try {
    const {
      includeInactive = false,
      userId,
      limit = 10,
      offset = 0,
      orderBy = 'createdAt_desc',
      searchTerm,
      propertyType,
      category,
      city,
      minBedrooms,
      minBathrooms,
      maxBudget,
    } = options;

    // Condiciones básicas (siempre se aplican)
    let baseConditions: (SQL<unknown> | undefined)[] = [];
    if (!includeInactive) {
      baseConditions.push(eq(searchRequests.isActive, true));
    }
    
    // Búsqueda por texto (solo si no hay filtros estructurados)
    if (searchTerm && !city && !category && !propertyType) {
      const keywords = searchTerm.split(' ').filter(kw => kw.length > 2);
      if (keywords.length > 0) {
        const keywordConditions = keywords.map(kw =>
          or(
            like(searchRequests.title, `%${kw}%`),
            like(searchRequests.description, `%${kw}%`)
          )
        );
        baseConditions.push(and(...keywordConditions));
      }
    }

    // Condiciones para filtros específicos
    let filterConditions: (SQL<unknown> | undefined)[] = [];
    
    // Filtro por tipo de propiedad (rent/sale)
    if (propertyType === 'rent') {
      filterConditions.push(eq(searchRequests.desiredPropertyTypeRent, true));
    } else if (propertyType === 'sale') {
      filterConditions.push(eq(searchRequests.desiredPropertyTypeSale, true));
    }
    
    // Filtro por categoría
    if (category) {
      switch (category) {
        case 'apartment': filterConditions.push(eq(searchRequests.desiredCategoryApartment, true)); break;
        case 'house': filterConditions.push(eq(searchRequests.desiredCategoryHouse, true)); break;
        case 'condo': filterConditions.push(eq(searchRequests.desiredCategoryCondo, true)); break;
        case 'land': filterConditions.push(eq(searchRequests.desiredCategoryLand, true)); break;
        case 'commercial': filterConditions.push(eq(searchRequests.desiredCategoryCommercial, true)); break;
        case 'other': filterConditions.push(eq(searchRequests.desiredCategoryOther, true)); break;
      }
    }
    
    // Condición para ciudad (siempre se aplica si está presente)
    if (city) {
      baseConditions.push(sql`LOWER(${searchRequests.desiredLocationCity}) LIKE LOWER(${'%' + city + '%'})`);
    }
    
    // Otras condiciones
    if (minBedrooms) {
      baseConditions.push(gte(searchRequests.minBedrooms, minBedrooms));
    }
    if (minBathrooms) {
      baseConditions.push(gte(searchRequests.minBathrooms, minBathrooms));
    }
    if (maxBudget) {
      baseConditions.push(lte(searchRequests.budgetMax, String(maxBudget)));
    }

    // Construir la consulta
    const query = db.select({
      request: searchRequests,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(searchRequests)
    .leftJoin(users, eq(searchRequests.userId, users.id));

    // Aplicar condiciones de manera flexible:
    // - Siempre aplicar las condiciones básicas
    // - Si hay filtros específicos, mostrar resultados que coincidan con AL MENOS UNO de ellos
    const conditions = [...baseConditions];
    if (filterConditions.length > 0) {
      conditions.push(or(...filterConditions));
    }
    
    query.where(and(...conditions.filter(c => c !== undefined)));

    // Ordenamiento
    switch (orderBy) {
      case 'relevance':
        query.orderBy(desc(searchRequests.upvotes));
        break;
      case 'random':
        query.orderBy(sql`RAND()`);
        break;
      case 'createdAt_desc':
      default:
        query.orderBy(desc(searchRequests.createdAt));
        break;
    }
    
    const results = await query.limit(limit).offset(offset);
    return results.map(row => mapDbRowToSearchRequest(row));

  } catch (error) {
    console.error('Error in getRequestsAction:', error);
    return [];
  }
}

export async function getRequestBySlugAction(slug: string): Promise<SearchRequest | null> {
    if (!slug) return null;
    try {
        const result = await db.select().from(searchRequests).where(eq(searchRequests.slug, slug));
        if (result.length > 0) {
            return mapDbRowToSearchRequest(result[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching request by slug ${slug}:`, error);
        return null;
    }
}

export async function getRequestByCodeAction(code: string): Promise<SearchRequest | null> {
    if (!code) return null;
    try {
        const result = await db.select().from(searchRequests).where(eq(searchRequests.publicationCode, code));
        if (result.length > 0) {
            return mapDbRowToSearchRequest(result[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching request by code ${code}:`, error);
        return null;
    }
}

export async function getUserRequestsAction(userId: string): Promise<SearchRequest[]> {
    if (!userId) return [];
    try {
        const results = await db.query.searchRequests.findMany({
            where: eq(searchRequests.userId, userId),
            orderBy: [desc(searchRequests.createdAt)],
            with: {
                user: {
                    with: {
                        primaryGroup: true,
                    }
                }
            }
        });
        return results.map(mapDbRowToSearchRequest);
    } catch (error) {
        console.error(`Error fetching requests for user ${userId}:`, error);
        return [];
    }
}

export async function updateRequestStatusAction(requestId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
    try {
        const result = await db.update(searchRequests).set({ isActive }).where(eq(searchRequests.id, requestId));
        if (result.rowsAffected > 0) {
            revalidatePath('/requests');
            revalidatePath('/admin/requests');
            return { success: true, message: 'Estado de la solicitud actualizado.' };
        }
        return { success: false, message: 'No se encontró la solicitud.' };
    } catch (error: any) {
        console.error('Error updating request status:', error);
        return { success: false, message: `Error del servidor: ${error.message}` };
    }
}

export async function adminDeleteRequestAction(requestId: string): Promise<{ success: boolean; message?: string }> {
    if (!requestId) {
        return { success: false, message: 'ID de solicitud no proporcionado.' };
    }
    try {
        const result = await db.delete(searchRequests).where(eq(searchRequests.id, requestId));
        if (result.rowsAffected > 0) {
            revalidatePath('/requests');
            revalidatePath('/admin/requests');
            return { success: true, message: 'Solicitud eliminada exitosamente.' };
        }
        return { success: false, message: 'No se encontró la solicitud a eliminar.' };
    } catch (error: any) {
        console.error(`Error deleting request ${requestId}:`, error);
        return { success: false, message: `Error del servidor: ${error.message}` };
    }
}

export async function getRequestByIdForAdminAction(requestId: string): Promise<SearchRequest | null> {
    if (!requestId) return null;
    try {
        const result = await db.select({
            ...searchRequests,
            author_name: users.name,
            author_avatar_url: users.avatarUrl,
            author_phone_number: users.phoneNumber,
        })
        .from(searchRequests)
        .leftJoin(users, eq(searchRequests.userId, users.id))
        .where(eq(searchRequests.id, requestId));

        if (result.length > 0) {
            return mapDbRowToSearchRequest(result[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching request by ID ${requestId} for admin:`, error);
        return null;
    }
}

export async function adminUpdateRequestAction(
  requestId: string,
  data: RequestFormValues
): Promise<{ success: boolean; message?: string; requestSlug?: string }> {
  const slug = generateSlug(data.title);
  try {
    const result = await db.update(searchRequests).set({
        title: data.title,
        slug: slug,
        description: data.description,
        desiredLocationCity: data.desiredLocationCity,
        desiredLocationRegion: data.desiredLocationRegion,
        desiredPropertyTypeRent: data.desiredPropertyType.includes('rent'),
        desiredPropertyTypeSale: data.desiredPropertyType.includes('sale'),
        desiredCategoryApartment: data.desiredCategories.includes('apartment'),
        desiredCategoryHouse: data.desiredCategories.includes('house'),
        desiredCategoryCondo: data.desiredCategories.includes('condo'),
        desiredCategoryLand: data.desiredCategories.includes('land'),
        desiredCategoryCommercial: data.desiredCategories.includes('commercial'),
        desiredCategoryOther: data.desiredCategories.includes('other'),
        openForBrokerCollaboration: data.open_for_broker_collaboration || false,
        desiredLocationNeighborhood: data.desiredLocationNeighborhood && data.desiredLocationNeighborhood.trim() !== '' ? data.desiredLocationNeighborhood.trim() : null,
        minBedrooms: (data.minBedrooms !== undefined && data.minBedrooms !== '' && data.minBedrooms !== null) ? Number(data.minBedrooms) : null,
        minBathrooms: (data.minBathrooms !== undefined && data.minBathrooms !== '' && data.minBathrooms !== null) ? Number(data.minBathrooms) : null,
        budgetMax: (data.budgetMax !== undefined && data.budgetMax !== '' && data.budgetMax !== null) ? Number(data.budgetMax) : null,
        updatedAt: new Date(),
    }).where(eq(searchRequests.id, requestId));

    if (result.rowsAffected > 0) {
      revalidatePath('/requests');
      revalidatePath(`/requests/${slug}`);
      revalidatePath('/admin/requests');
      return { success: true, message: 'Solicitud actualizada.', requestSlug: slug };
    }
    return { success: false, message: 'No se encontró la solicitud para actualizar.' };
  } catch (error: any) {
    console.error(`Error updating request ${requestId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('slug')) {
      return { success: false, message: 'Ya existe una solicitud con un título muy similar. Elige otro.' };
    }
    return { success: false, message: `Error del servidor: ${error.message}` };
  }
}

export async function getRequestsCountAction(onlyActive: boolean = false): Promise<number> {
    try {
        const query = db.select({ value: count() }).from(searchRequests);
        if (onlyActive) {
            query.where(eq(searchRequests.isActive, true));
        }
        const result = await query;
        return result[0]?.value ?? 0;
    } catch (error) {
        console.error('Error getting requests count:', error);
        return 0;
    }
}

export async function deleteRequestByUserAction(requestId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    if (!requestId || !userId) {
        return { success: false, message: 'Faltan datos para eliminar la solicitud.' };
    }
    try {
        const result = await db.delete(searchRequests).where(and(eq(searchRequests.id, requestId), eq(searchRequests.userId, userId)));
        if (result.rowsAffected > 0) {
            revalidatePath('/requests');
            revalidatePath('/dashboard');
            revalidatePath('/admin/requests');
            return { success: true, message: 'Solicitud eliminada exitosamente.' };
        }
        return { success: false, message: 'No se encontró tu solicitud para eliminar o no tienes permiso.' };
    } catch (error: any) {
        console.error(`Error deleting request ${requestId} by user ${userId}:`, error);
        return { success: false, message: `Error del servidor: ${error.message}` };
    }
}
    
