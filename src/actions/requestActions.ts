// src/actions/requestActions.ts
'use server';

import type { RequestFormValues, SubmitRequestResult } from "@/lib/types"; 
import { query } from "@/lib/db";
import type { SearchRequest, User, PropertyType, ListingCategory } from "@/lib/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { findMatchingPropertiesForNewRequest, type NewRequestInput } from '@/ai/flows/find-matching-properties-for-new-request-flow';
import { getUserByIdAction } from './userActions';
import { sendGenericWhatsAppMessageAction } from './otpActions';


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
  const desiredPropertyType: PropertyType[] = [];
  if (row.desired_property_type_rent) desiredPropertyType.push('rent');
  if (row.desired_property_type_sale) desiredPropertyType.push('sale');

  const desiredCategories: ListingCategory[] = [];
  if (row.desired_category_apartment) desiredCategories.push('apartment');
  if (row.desired_category_house) desiredCategories.push('house');
  if (row.desired_category_condo) desiredCategories.push('condo');
  if (row.desired_category_land) desiredCategories.push('land');
  if (row.desired_category_commercial) desiredCategories.push('commercial');
  if (row.desired_category_other) desiredCategories.push('other');
  
  const author: User | undefined = row.author_name ? {
    id: row.user_id,
    name: row.author_name,
    avatarUrl: row.author_avatar_url || undefined,
    role_id: row.author_role_id || '',
    phone_number: row.author_phone_number,
  } : undefined;

  return {
    id: row.id,
    pub_id: row.pub_id,
    user_id: row.user_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    desiredPropertyType,
    desiredCategories,
    desiredLocation: {
      city: row.desired_location_city,
      region: row.desired_location_region,
      neighborhood: row.desired_location_neighborhood || undefined,
    },
    minBedrooms: row.min_bedrooms !== null ? Number(row.min_bedrooms) : undefined,
    minBathrooms: row.min_bathrooms !== null ? Number(row.min_bathrooms) : undefined,
    budgetMax: row.budget_max !== null ? Number(row.budget_max) : undefined,
    open_for_broker_collaboration: Boolean(row.open_for_broker_collaboration),
    commentsCount: Number(row.comments_count),
    upvotes: Number(row.upvotes || 0), // Ensure upvotes is a number
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
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
    const columns: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    // Campos obligatorios o que siempre se establecen
    columns.push('id', 'user_id', 'title', 'slug', 'description', 'desired_location_city', 'desired_location_region', 'is_active', 'created_at', 'updated_at', 'comments_count', 'upvotes', 'pub_id');
    values.push(requestId, userId, data.title, slug, data.description, data.desiredLocationCity, data.desiredLocationRegion, true, new Date(), new Date(), 0, 0, pubId); // upvotes defaults to 0
    placeholders.push('?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?');


    // Campos booleanos para tipos de transacción y categorías
    // Para cada uno, si es true en `data`, se añade la columna y TRUE, sino se añade y FALSE
    columns.push('desired_property_type_rent'); values.push(data.desiredPropertyType.includes('rent')); placeholders.push('?');
    columns.push('desired_property_type_sale'); values.push(data.desiredPropertyType.includes('sale')); placeholders.push('?');
    columns.push('desired_category_apartment'); values.push(data.desiredCategories.includes('apartment')); placeholders.push('?');
    columns.push('desired_category_house'); values.push(data.desiredCategories.includes('house')); placeholders.push('?');
    columns.push('desired_category_condo'); values.push(data.desiredCategories.includes('condo')); placeholders.push('?');
    columns.push('desired_category_land'); values.push(data.desiredCategories.includes('land')); placeholders.push('?');
    columns.push('desired_category_commercial'); values.push(data.desiredCategories.includes('commercial')); placeholders.push('?');
    columns.push('desired_category_other'); values.push(data.desiredCategories.includes('other')); placeholders.push('?');
    columns.push('open_for_broker_collaboration'); values.push(data.open_for_broker_collaboration || false); placeholders.push('?');
    
    // Campos opcionales (siempre añadir, pero con valor o NULL)
    columns.push('desired_location_neighborhood');
    values.push(data.desiredLocationNeighborhood && data.desiredLocationNeighborhood.trim() !== '' ? data.desiredLocationNeighborhood.trim() : null);
    placeholders.push('?');

    const minBedroomsValue = (data.minBedrooms !== undefined && data.minBedrooms !== '' && data.minBedrooms !== null) ? Number(data.minBedrooms) : null;
    columns.push('min_bedrooms'); values.push(minBedroomsValue); placeholders.push('?');
    
    const minBathroomsValue = (data.minBathrooms !== undefined && data.minBathrooms !== '' && data.minBathrooms !== null) ? Number(data.minBathrooms) : null;
    columns.push('min_bathrooms'); values.push(minBathroomsValue); placeholders.push('?');
    
    const budgetMaxValue = (data.budgetMax !== undefined && data.budgetMax !== '' && data.budgetMax !== null) ? Number(data.budgetMax) : null;
    columns.push('budget_max'); values.push(budgetMaxValue); placeholders.push('?');


    const sql = `
      INSERT INTO property_requests (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;
    
    console.log(`[RequestAction DEBUG] SQL: ${sql}`);
    console.log(`[RequestAction DEBUG] Params:`, values);

    await query(sql, values);
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
        minBedrooms: minBedroomsValue !== null ? minBedroomsValue : undefined,
        minBathrooms: minBathroomsValue !== null ? minBathroomsValue : undefined,
        budgetMax: budgetMaxValue !== null ? budgetMaxValue : undefined,
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
     if (error.code === 'ER_DUP_ENTRY' && error.message.includes('property_requests.slug')) {
        message = "Ya existe una solicitud con un título muy similar (slug duplicado). Intenta con un título ligeramente diferente.";
    } else if (error.code === 'ER_DUP_ENTRY' && error.message.includes('property_requests.pub_id')) {
        message = "Error al generar el ID público único. Por favor, intenta de nuevo.";
    }
    return { success: false, message, autoMatchesCount: 0 };
  }
}

interface GetRequestsActionOptions {
  includeInactive?: boolean;
  userId?: string; 
  onlyOpenForCollaboration?: boolean; 
  limit?: number;
  orderBy?: 'createdAt_desc' | 'relevance';
  searchTerm?: string;
}

export async function getRequestsAction(options: GetRequestsActionOptions = {}): Promise<SearchRequest[]> {
  const { 
    includeInactive = false, 
    userId, 
    onlyOpenForCollaboration = false, 
    limit, 
    orderBy = 'createdAt_desc', 
    searchTerm 
  } = options;

  try {
    let sql = `
      SELECT 
        pr.*, 
        u.name as author_name, 
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id,
        u.phone_number as author_phone_number
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
    `;
    
    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (!includeInactive) {
      whereClauses.push('pr.is_active = TRUE');
    }
    if (userId) {
        whereClauses.push('pr.user_id = ?');
        queryParams.push(userId);
    }
    if (onlyOpenForCollaboration) {
        whereClauses.push('pr.open_for_broker_collaboration = TRUE');
    }
    if (searchTerm) {
        whereClauses.push('(pr.title LIKE ? OR pr.description LIKE ? OR pr.desired_location_city LIKE ?)');
        const searchTermLike = `%${searchTerm}%`;
        queryParams.push(searchTermLike, searchTermLike, searchTermLike);
    }
    
    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    if (orderBy === 'relevance' && searchTerm) {
      sql += ` ORDER BY 
        CASE 
          WHEN pr.desired_location_city = ? THEN 1
          WHEN pr.desired_location_city LIKE ? THEN 2
          WHEN pr.title LIKE ? THEN 3
          ELSE 4
        END, 
        pr.created_at DESC`;
      const searchTermLike = `%${searchTerm}%`;
      queryParams.push(searchTerm, searchTermLike, searchTermLike);
    } else {
        sql += ' ORDER BY pr.created_at DESC';
    }
    
    if (limit) {
        sql += ' LIMIT ?';
        queryParams.push(limit);
    }

    const rows = await query(sql, queryParams);
    if (!Array.isArray(rows)) {
        console.error("[RequestAction] Expected array from getRequestsAction, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToSearchRequest);
  } catch (error: any) {
    console.error("[RequestAction] Error fetching requests:", error);
    return [];
  }
}

export async function getRequestBySlugAction(slug: string): Promise<SearchRequest | null> {
  try {
    const sql = `
      SELECT 
        pr.*, 
        u.name as author_name, 
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id,
        u.phone_number as author_phone_number
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.slug = ? AND pr.is_active = TRUE
    `;
    const rows = await query(sql, [slug]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }
    return mapDbRowToSearchRequest(rows[0]);
  } catch (error: any) {
    console.error(`[RequestAction] Error fetching request by slug ${slug}:`, error);
    return null;
  }
}

export async function getUserRequestsAction(userId: string): Promise<SearchRequest[]> {
  return getRequestsAction({ userId, includeInactive: true });
}

export async function updateRequestStatusAction(requestId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
  if (!requestId) {
    return { success: false, message: "ID de solicitud no proporcionado." };
  }
  try {
    await query('UPDATE property_requests SET is_active = ? WHERE id = ?', [isActive, requestId]);
    revalidatePath('/admin/requests');
    revalidatePath('/requests'); 
    revalidatePath(`/requests/[slug]`, 'layout'); 
    return { success: true, message: `Solicitud ${isActive ? 'activada' : 'desactivada'} correctamente.` };
  } catch (error: any) {
    console.error("Error al cambiar estado de la solicitud:", error);
    return { success: false, message: `Error al cambiar estado de la solicitud: ${error.message}` };
  }
}

export async function adminDeleteRequestAction(requestId: string): Promise<{ success: boolean; message?: string }> {
  if (!requestId) {
    return { success: false, message: "ID de solicitud no proporcionado." };
  }

  try {
    // Primero eliminar comentarios asociados
    await query('DELETE FROM comments WHERE request_id = ?', [requestId]);
    // Luego eliminar interacciones de usuario asociadas
    await query('DELETE FROM user_listing_interactions WHERE listing_id = ? AND listing_type = "request"', [requestId]);
    // Luego eliminar colaboraciones de broker asociadas
    await query('DELETE FROM broker_collaborations WHERE property_request_id = ?', [requestId]);
    // Finalmente, eliminar la solicitud
    const result: any = await query('DELETE FROM property_requests WHERE id = ?', [requestId]);

    if (result.affectedRows > 0) {
      revalidatePath('/admin/requests');
      revalidatePath('/requests');
      revalidatePath('/'); 
      revalidatePath(`/requests/[slug]`, 'layout');
      return { success: true, message: "Solicitud y datos asociados eliminados exitosamente." };
    } else {
      return { success: false, message: "La solicitud no fue encontrada o no se pudo eliminar." };
    }
  } catch (error: any) {
    console.error("Error al eliminar solicitud por admin:", error);
    return { success: false, message: `Error al eliminar solicitud: ${error.message}` };
  }
}

export async function getRequestByIdForAdminAction(requestId: string): Promise<SearchRequest | null> {
  if (!requestId) return null;
  try {
    const sql = `
      SELECT 
        pr.*, 
        u.name as author_name, 
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id,
        u.phone_number as author_phone_number
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.id = ?
    `; 
    const rows = await query(sql, [requestId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }
    return mapDbRowToSearchRequest(rows[0]);
  } catch (error: any) {
    console.error(`[RequestAction Admin] Error fetching request by ID ${requestId}:`, error);
    return null;
  }
}

export async function adminUpdateRequestAction(
  requestId: string,
  data: RequestFormValues
): Promise<{ success: boolean; message?: string; requestSlug?: string }> {
  console.log("[RequestAction Admin] Request update data received:", data, "RequestID:", requestId);

  if (!requestId) {
    return { success: false, message: "ID de solicitud no proporcionado para la actualización." };
  }

  try {
    // Similar dynamic query construction as in submitRequestAction
    const columnsToUpdate: string[] = [];
    const valuesToUpdate: any[] = [];

    // Campos que siempre se actualizan si se proporcionan en 'data'
    if (data.title) { columnsToUpdate.push('title = ?'); valuesToUpdate.push(data.title); }
    if (data.description) { columnsToUpdate.push('description = ?'); valuesToUpdate.push(data.description); }
    if (data.desiredLocationCity) { columnsToUpdate.push('desired_location_city = ?'); valuesToUpdate.push(data.desiredLocationCity); }
    if (data.desiredLocationRegion) { columnsToUpdate.push('desired_location_region = ?'); valuesToUpdate.push(data.desiredLocationRegion); }
    
    columnsToUpdate.push('desired_location_neighborhood = ?');
    valuesToUpdate.push(data.desiredLocationNeighborhood && data.desiredLocationNeighborhood.trim() !== '' ? data.desiredLocationNeighborhood.trim() : null);

    // Booleanos para tipos y categorías
    columnsToUpdate.push('desired_property_type_rent = ?'); valuesToUpdate.push(data.desiredPropertyType.includes('rent'));
    columnsToUpdate.push('desired_property_type_sale = ?'); valuesToUpdate.push(data.desiredPropertyType.includes('sale'));
    columnsToUpdate.push('desired_category_apartment = ?'); valuesToUpdate.push(data.desiredCategories.includes('apartment'));
    columnsToUpdate.push('desired_category_house = ?'); valuesToUpdate.push(data.desiredCategories.includes('house'));
    columnsToUpdate.push('desired_category_condo = ?'); valuesToUpdate.push(data.desiredCategories.includes('condo'));
    columnsToUpdate.push('desired_category_land = ?'); valuesToUpdate.push(data.desiredCategories.includes('land'));
    columnsToUpdate.push('desired_category_commercial = ?'); valuesToUpdate.push(data.desiredCategories.includes('commercial'));
    columnsToUpdate.push('desired_category_other = ?'); valuesToUpdate.push(data.desiredCategories.includes('other'));
    
    columnsToUpdate.push('open_for_broker_collaboration = ?');
    valuesToUpdate.push(data.open_for_broker_collaboration || false);


    const minBedroomsValue = (data.minBedrooms !== undefined && data.minBedrooms !== '' && data.minBedrooms !== null) ? Number(data.minBedrooms) : null;
    columnsToUpdate.push('min_bedrooms = ?'); valuesToUpdate.push(minBedroomsValue);
    
    const minBathroomsValue = (data.minBathrooms !== undefined && data.minBathrooms !== '' && data.minBathrooms !== null) ? Number(data.minBathrooms) : null;
    columnsToUpdate.push('min_bathrooms = ?'); valuesToUpdate.push(minBathroomsValue);

    const budgetMaxValue = (data.budgetMax !== undefined && data.budgetMax !== '' && data.budgetMax !== null) ? Number(data.budgetMax) : null;
    columnsToUpdate.push('budget_max = ?'); valuesToUpdate.push(budgetMaxValue);

    if (columnsToUpdate.length === 0) {
      return { success: true, message: "No se proporcionaron datos para actualizar." };
    }
    
    columnsToUpdate.push('updated_at = NOW()'); // Siempre actualizar timestamp

    const sql = `
      UPDATE property_requests SET
        ${columnsToUpdate.join(', ')}
      WHERE id = ?
    `;
    valuesToUpdate.push(requestId); // Añadir el ID para la cláusula WHERE
    
    const result: any = await query(sql, valuesToUpdate);

    if (result.affectedRows === 0) {
      return { success: false, message: "Solicitud no encontrada o los datos eran los mismos." };
    }
    
    const requestDetails = await getRequestByIdForAdminAction(requestId);
    const currentSlug = requestDetails?.slug;

    console.log(`[RequestAction Admin] Request updated. ID: ${requestId}, Slug: ${currentSlug}`);

    revalidatePath('/admin/requests');
    revalidatePath('/requests'); 
    if (currentSlug) {
      revalidatePath(`/requests/${currentSlug}`); 
    } else {
       revalidatePath(`/requests/[slug]`, 'layout'); 
    }
    revalidatePath('/'); 

    return { success: true, message: "Solicitud actualizada exitosamente.", requestSlug: currentSlug };

  } catch (error: any) {
    console.error(`[RequestAction Admin] Error updating request ${requestId}:`, error);
    return { success: false, message: `Error al actualizar solicitud: ${error.message}` };
  }
}

export async function getRequestsCountAction(activeOnly: boolean = false): Promise<number> {
  try {
    let sql = 'SELECT COUNT(*) as count FROM property_requests';
    if (activeOnly) {
      sql += ' WHERE is_active = TRUE';
    }
    const result: any[] = await query(sql);
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error al obtener el conteo de solicitudes:", error);
    return 0;
  }
}
    
