
// src/actions/requestActions.ts
'use server';

import type { RequestFormValues } from "@/components/request/RequestForm";
import { query } from "@/lib/db";
import type { SearchRequest, User, PropertyType, ListingCategory } from "@/lib/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

// Helper function to generate a slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
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
    role_id: '', // No es crucial para mostrar la tarjeta de solicitud, se puede añadir si es necesario.
  } : undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    desiredPropertyType,
    desiredCategories,
    desiredLocation: {
      city: row.desired_location_city,
      neighborhood: row.desired_location_neighborhood || undefined,
    },
    minBedrooms: row.min_bedrooms !== null ? Number(row.min_bedrooms) : undefined,
    minBathrooms: row.min_bathrooms !== null ? Number(row.min_bathrooms) : undefined,
    budgetMax: row.budget_max !== null ? Number(row.budget_max) : undefined,
    commentsCount: Number(row.comments_count),
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    author,
  };
}

export async function submitRequestAction(
  data: RequestFormValues,
  userId: string
): Promise<{ success: boolean; message?: string; requestId?: string, requestSlug?: string }> {
  console.log("[RequestAction] Request data received on server:", data, "UserID:", userId);

  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  try {
    const requestId = randomUUID();
    const slug = generateSlug(data.title);

    const sql = `
      INSERT INTO property_requests (
        id, user_id, title, slug, description,
        desired_property_type_rent, desired_property_type_sale,
        desired_category_apartment, desired_category_house, desired_category_condo,
        desired_category_land, desired_category_commercial, desired_category_other,
        desired_location_city, desired_location_neighborhood,
        min_bedrooms, min_bathrooms, budget_max,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    const params = [
      requestId,
      userId,
      data.title,
      slug,
      data.description,
      data.desiredPropertyType.includes('rent'),
      data.desiredPropertyType.includes('sale'),
      data.desiredCategories.includes('apartment'),
      data.desiredCategories.includes('house'),
      data.desiredCategories.includes('condo'),
      data.desiredCategories.includes('land'),
      data.desiredCategories.includes('commercial'),
      data.desiredCategories.includes('other'),
      data.desiredLocationCity,
      data.desiredLocationNeighborhood || null,
      data.minBedrooms !== undefined && data.minBedrooms !== '' ? data.minBedrooms : null,
      data.minBathrooms !== undefined && data.minBathrooms !== '' ? data.minBathrooms : null,
      data.budgetMax !== undefined && data.budgetMax !== '' ? data.budgetMax : null,
    ];
    
    await query(sql, params);
    console.log(`[RequestAction] Request submitted successfully. ID: ${requestId}, Slug: ${slug}`);

    revalidatePath('/');
    revalidatePath('/requests');
    revalidatePath(`/requests/${slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/requests');


    return { success: true, message: "Solicitud publicada exitosamente.", requestId, requestSlug: slug };

  } catch (error: any) {
    console.error("[RequestAction] Error submitting request:", error);
    let message = "Ocurrió un error desconocido al publicar la solicitud.";
     if (error.code === 'ER_DUP_ENTRY' && error.message.includes('property_requests.slug')) {
        message = "Ya existe una solicitud con un título muy similar (slug duplicado). Intenta con un título ligeramente diferente.";
    } else if (error.message) {
      message = error.message;
    }
    return { success: false, message };
  }
}

interface GetRequestsActionOptions {
  includeInactive?: boolean;
  // Add other filter/sort options here later if needed
}

export async function getRequestsAction(options: GetRequestsActionOptions = {}): Promise<SearchRequest[]> {
  const { includeInactive = false } = options;
  try {
    let sql = `
      SELECT 
        pr.*, 
        u.name as author_name, 
        u.avatar_url as author_avatar_url 
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
    `;
    
    const queryParams: any[] = [];

    if (!includeInactive) {
      sql += ' WHERE pr.is_active = TRUE';
    }
    
    sql += ' ORDER BY pr.created_at DESC';

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
        u.avatar_url as author_avatar_url
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
  if (!userId) return [];
  try {
    const sql = `
      SELECT 
        pr.*,
        u.name as author_name,
        u.avatar_url as author_avatar_url
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
    `;
    const rows = await query(sql, [userId]);
     if (!Array.isArray(rows)) {
        console.error("[RequestAction] Expected array from getUserRequestsAction, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToSearchRequest);
  } catch (error: any) {
    console.error(`[RequestAction] Error fetching requests for user ${userId}:`, error);
    return [];
  }
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
    // Comentarios asociados se eliminan por ON DELETE CASCADE desde la tabla 'comments'
    const result: any = await query('DELETE FROM property_requests WHERE id = ?', [requestId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/requests');
      revalidatePath('/requests');
      revalidatePath('/'); 
      revalidatePath(`/requests/[slug]`, 'layout');
      return { success: true, message: "Solicitud eliminada exitosamente." };
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
        u.avatar_url as author_avatar_url
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
    const sql = `
      UPDATE property_requests SET
        title = ?, description = ?,
        desired_property_type_rent = ?, desired_property_type_sale = ?,
        desired_category_apartment = ?, desired_category_house = ?, desired_category_condo = ?,
        desired_category_land = ?, desired_category_commercial = ?, desired_category_other = ?,
        desired_location_city = ?, desired_location_neighborhood = ?,
        min_bedrooms = ?, min_bathrooms = ?, budget_max = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      data.title,
      data.description,
      data.desiredPropertyType.includes('rent'),
      data.desiredPropertyType.includes('sale'),
      data.desiredCategories.includes('apartment'),
      data.desiredCategories.includes('house'),
      data.desiredCategories.includes('condo'),
      data.desiredCategories.includes('land'),
      data.desiredCategories.includes('commercial'),
      data.desiredCategories.includes('other'),
      data.desiredLocationCity,
      data.desiredLocationNeighborhood || null,
      data.minBedrooms !== undefined && data.minBedrooms !== '' ? data.minBedrooms : null,
      data.minBathrooms !== undefined && data.minBathrooms !== '' ? data.minBathrooms : null,
      data.budgetMax !== undefined && data.budgetMax !== '' ? data.budgetMax : null,
      requestId
    ];
    
    const result: any = await query(sql, params);

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
    
