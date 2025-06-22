
// src/actions/propertyActions.ts
'use server';

import type { PropertyFormValues } from "@/lib/types"; 
import { query } from "@/lib/db";
import type { PropertyListing, User, PropertyType, ListingCategory, SubmitPropertyResult, OrientationType } from "@/lib/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { findMatchingRequestsForNewProperty, type NewPropertyInput } from '@/ai/flows/find-matching-requests-for-new-property-flow';
import { getOrCreateConversationAction, sendMessageAction } from './chatActions';

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
  const parseJsonString = (jsonString: string | null): string[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse JSON string:", jsonString, e);
      return [];
    }
  };
  
  const authorPlanName = row.author_plan_name_from_db;
  const authorIsBroker = row.author_role_id === 'broker';

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    propertyType: row.property_type,
    category: row.category,
    price: Number(row.price),
    currency: row.currency,
    address: row.address,
    city: row.city,
    region: row.region,
    country: row.country,
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    totalAreaSqMeters: Number(row.total_area_sq_meters), // Renamed
    usefulAreaSqMeters: row.useful_area_sq_meters !== null ? Number(row.useful_area_sq_meters) : null,
    parkingSpaces: row.parking_spaces !== null ? Number(row.parking_spaces) : 0,
    petsAllowed: Boolean(row.pets_allowed),
    furnished: Boolean(row.furnished),
    commercialUseAllowed: Boolean(row.commercial_use_allowed),
    hasStorage: Boolean(row.has_storage),
    orientation: row.orientation as OrientationType | null,
    images: parseJsonString(row.images), 
    features: parseJsonString(row.features),
    upvotes: Number(row.upvotes),
    commentsCount: Number(row.comments_count),
    views_count: Number(row.views_count),
    inquiries_count: Number(row.inquiries_count),
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    author: row.author_name ? {
      id: row.user_id, 
      name: row.author_name,
      avatarUrl: row.author_avatar_url || undefined,
      email: row.author_email, 
      phone_number: row.author_phone_number, 
      role_id: row.author_role_id || '',
      role_name: row.author_role_name || undefined,
      plan_id: row.author_plan_id,
      plan_name: authorPlanName,
      plan_is_pro_or_premium: authorIsBroker && (authorPlanName?.toLowerCase().includes('pro') || authorPlanName?.toLowerCase().includes('premium')),
      plan_allows_contact_view: !!row.author_plan_can_view_contact_data,
      plan_is_premium_broker: authorIsBroker && authorPlanName?.toLowerCase().includes('premium'),
      plan_automated_alerts_enabled: !!row.author_plan_automated_alerts_enabled,
      plan_advanced_dashboard_access: !!row.author_plan_advanced_dashboard_access,
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

  try {
    const imagesJson = data.images && data.images.length > 0 ? JSON.stringify(data.images) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0)) : null;

    const sql = `
      INSERT INTO properties (
        id, user_id, title, slug, description, property_type, category,
        price, currency, address, city, region, country, bedrooms, bathrooms,
        total_area_sq_meters, useful_area_sq_meters, parking_spaces, 
        pets_allowed, furnished, commercial_use_allowed, has_storage, orientation,
        images, features, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    const params = [
      propertyId, userId, data.title, slug, data.description, data.propertyType, data.category,
      data.price, data.currency, data.address, data.city, data.region, data.country, data.bedrooms, data.bathrooms,
      data.totalAreaSqMeters, 
      data.usefulAreaSqMeters === '' ? null : (data.usefulAreaSqMeters ?? null),
      data.parkingSpaces ?? 0,
      data.petsAllowed ?? false,
      data.furnished ?? false,
      data.commercialUseAllowed ?? false,
      data.hasStorage ?? false,
      data.orientation === '' ? null : (data.orientation ?? null),
      imagesJson, featuresJson
    ];

    await query(sql, params);
    console.log(`[PropertyAction] Property submitted successfully. ID: ${propertyId}, Slug: ${slug}`);

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath(`/properties/${slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/properties');

    let successMessage = "Propiedad publicada exitosamente.";
    let autoMatchesFoundCount = 0;

    try {
      const propertyForAIMatch: NewPropertyInput = {
        id: propertyId,
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
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
        usefulAreaSqMeters: data.usefulAreaSqMeters === '' ? undefined : (data.usefulAreaSqMeters ?? undefined),
        parkingSpaces: data.parkingSpaces ?? undefined,
        petsAllowed: data.petsAllowed ?? undefined,
        furnished: data.furnished ?? undefined,
        commercialUseAllowed: data.commercialUseAllowed ?? undefined,
        hasStorage: data.hasStorage ?? undefined,
        orientation: data.orientation === '' ? undefined : (data.orientation ?? undefined),
        features: data.features ? data.features.split(',').map(f => f.trim()).filter(f => f) : [],
      };
      const autoMatches = await findMatchingRequestsForNewProperty(propertyForAIMatch);
      
      if (autoMatches && autoMatches.length > 0) {
        for (const match of autoMatches) {
          if (match.matchScore >= 0.65 && match.requestAuthorId && match.requestAuthorId !== userId) {
            autoMatchesFoundCount++;
            const conversationResult = await getOrCreateConversationAction(
              userId, 
              match.requestAuthorId, 
              { propertyId: propertyId, requestId: match.requestId }
            );
            if (conversationResult.success && conversationResult.conversation) {
              const chatMessage = `¡Hola ${match.requestAuthorName || 'Usuario'}! Mi propiedad "${propertyForAIMatch.title}" podría interesarte, ya que parece coincidir con tu solicitud "${match.requestTitle}".`;
              await sendMessageAction(
                conversationResult.conversation.id,
                userId, 
                match.requestAuthorId,
                chatMessage
              );
            }
          }
        }
      }
    } catch (aiError: any) {
      console.error("[PropertyAction] Error during auto-match AI flow for new property:", aiError.message);
    }
    
    if (autoMatchesFoundCount > 0) {
        successMessage = `Propiedad publicada. ¡Encontramos ${autoMatchesFoundCount} solicitud(es) que podrían coincidir! Se han iniciado chats.`;
    }
    
    return { success: true, message: successMessage, propertyId, propertySlug: slug, autoMatchesCount: autoMatchesFoundCount };

  } catch (error: any) {
    console.error("[PropertyAction] Error submitting property:", error);
    let message = "Ocurrió un error desconocido al publicar la propiedad.";
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('properties.slug')) {
        message = "Ya existe una propiedad con un título muy similar (slug duplicado). Intenta con un título ligeramente diferente.";
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
  orderBy?: 'createdAt_desc' | 'price_asc' | 'price_desc' | 'popularity_desc';
}

const BASE_PROPERTY_SELECT_SQL = `
  SELECT
    p.*,
    u.name as author_name,
    u.avatar_url as author_avatar_url,
    u.email as author_email,
    u.phone_number as author_phone_number,
    u.role_id as author_role_id,
    r.name as author_role_name,
    plan_author.name AS author_plan_name_from_db,
    plan_author.can_view_contact_data AS author_plan_can_view_contact_data,
    plan_author.automated_alerts_enabled AS author_plan_automated_alerts_enabled,
    plan_author.advanced_dashboard_access AS author_plan_advanced_dashboard_access,
    u.plan_id as author_plan_id
  FROM properties p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN roles r ON u.role_id = r.id
  LEFT JOIN plans plan_author ON u.plan_id = plan_author.id
`;

export async function getPropertiesAction(options: GetPropertiesActionOptions = {}): Promise<PropertyListing[]> {
  const {
    includeInactive = false,
    limit,
    offset,
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
    let sql = BASE_PROPERTY_SELECT_SQL;
    const queryParams: any[] = [];
    const whereClauses: string[] = [];

    if (!includeInactive) {
      whereClauses.push('p.is_active = TRUE');
    }

    if (searchTerm) {
      whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.city LIKE ? OR p.address LIKE ? OR p.region LIKE ?)');
      const searchTermLike = `%${searchTerm}%`;
      queryParams.push(searchTermLike, searchTermLike, searchTermLike, searchTermLike, searchTermLike);
    }

    if (propertyType) {
      whereClauses.push('p.property_type = ?');
      queryParams.push(propertyType);
    }

    if (category) {
      whereClauses.push('p.category = ?');
      queryParams.push(category);
    }

    if (city) {
      whereClauses.push('p.city LIKE ?');
      queryParams.push(`%${city}%`);
    }

    if (minPrice !== undefined) {
      whereClauses.push('p.price >= ?');
      queryParams.push(minPrice);
    }

    if (maxPrice !== undefined) {
      whereClauses.push('p.price <= ?');
      queryParams.push(maxPrice);
    }

    if (minBedrooms !== undefined) {
      whereClauses.push('p.bedrooms >= ?');
      queryParams.push(minBedrooms);
    }

    if (minBathrooms !== undefined) {
      whereClauses.push('p.bathrooms >= ?');
      queryParams.push(minBathrooms);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    switch (orderBy) {
      case 'price_asc':
        sql += ' ORDER BY p.price ASC, p.created_at DESC';
        break;
      case 'price_desc':
        sql += ' ORDER BY p.price DESC, p.created_at DESC';
        break;
      case 'popularity_desc':
        sql += ' ORDER BY p.upvotes DESC, p.comments_count DESC, p.views_count DESC, p.inquiries_count DESC, RAND(DATE_FORMAT(NOW(), \'%Y%m%d\')), p.created_at DESC';
        break;
      case 'createdAt_desc':
      default:
        sql += ' ORDER BY p.created_at DESC, RAND(DATE_FORMAT(NOW(), \'%Y%m%d\'))';
        break;
    }

    if (limit !== undefined) {
      const numLimit = parseInt(String(limit), 10);
      if (!isNaN(numLimit) && numLimit >= 0) {
        if (offset !== undefined) {
          const numOffset = parseInt(String(offset), 10);
          if (!isNaN(numOffset) && numOffset >= 0) {
            sql += ` LIMIT ${numOffset}, ${numLimit}`;
          } else {
            sql += ` LIMIT ${numLimit}`;
          }
        } else {
          sql += ` LIMIT ${numLimit}`;
        }
      }
    }
    
    const rows = await query(sql, queryParams);
    if (!Array.isArray(rows)) {
        console.error("[PropertyAction] Expected array from query, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToPropertyListing);
  } catch (error: any) {
    console.error("[PropertyAction] Error fetching properties:", error);
    return [];
  }
}

export async function getPropertyBySlugAction(slug: string): Promise<PropertyListing | null> {
  try {
    let sql = BASE_PROPERTY_SELECT_SQL;
    sql += ' WHERE p.slug = ? AND p.is_active = TRUE'; 
    
    const rows = await query(sql, [slug]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }
    return mapDbRowToPropertyListing(rows[0]);
  } catch (error: any) {
    console.error(`[PropertyAction] Error fetching property by slug ${slug}:`, error);
    return null;
  }
}

export async function getUserPropertiesAction(userId: string): Promise<PropertyListing[]> {
  if (!userId) return [];
  try {
    let sql = BASE_PROPERTY_SELECT_SQL;
    sql += ' WHERE p.user_id = ? ORDER BY p.created_at DESC';
    
    const rows = await query(sql, [userId]);
    if (!Array.isArray(rows)) {
        console.error("[PropertyAction] Expected array from getUserPropertiesAction, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToPropertyListing);
  } catch (error: any) {
    console.error(`[PropertyAction] Error fetching properties for user ${userId}:`, error);
    return [];
  }
}

export async function updatePropertyStatusAction(propertyId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
  if (!propertyId) {
    return { success: false, message: "ID de propiedad no proporcionado." };
  }
  try {
    await query('UPDATE properties SET is_active = ? WHERE id = ?', [isActive, propertyId]);
    revalidatePath('/admin/properties');
    revalidatePath('/properties');
    revalidatePath(`/properties/[slug]`, 'layout');
    revalidatePath('/dashboard/my-listings');
    return { success: true, message: `Propiedad ${isActive ? 'activada' : 'desactivada'} correctamente.` };
  } catch (error: any) {
    console.error("Error al cambiar estado de la propiedad:", error);
    return { success: false, message: `Error al cambiar estado de la propiedad: ${error.message}` };
  }
}

export async function deletePropertyByAdminAction(propertyId: string): Promise<{ success: boolean; message?: string }> {
  if (!propertyId) {
    return { success: false, message: "ID de propiedad no proporcionado." };
  }

  try {
    const result: any = await query('DELETE FROM properties WHERE id = ?', [propertyId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/properties');
      revalidatePath('/properties');
      revalidatePath('/');
      revalidatePath(`/properties/[slug]`, 'layout');
      return { success: true, message: "Propiedad eliminada exitosamente." };
    } else {
      return { success: false, message: "La propiedad no fue encontrada o no se pudo eliminar." };
    }
  } catch (error: any) {
    console.error("Error al eliminar propiedad por admin:", error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return { success: false, message: "Error de referencia: No se puede eliminar la propiedad porque aún está referenciada en otra tabla. Contacte al administrador." };
    }
    return { success: false, message: `Error al eliminar propiedad: ${error.message}` };
  }
}

export async function getPropertyByIdForAdminAction(propertyId: string): Promise<PropertyListing | null> {
  if (!propertyId) return null;
  try {
    let sql = BASE_PROPERTY_SELECT_SQL;
    sql += ' WHERE p.id = ?'; 
    
    const rows = await query(sql, [propertyId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }
    return mapDbRowToPropertyListing(rows[0]);
  } catch (error: any) {
    console.error(`[PropertyAction Admin] Error fetching property by ID ${propertyId}:`, error);
    return null;
  }
}

export async function adminUpdatePropertyAction(
  propertyId: string,
  data: PropertyFormValues 
): Promise<SubmitPropertyResult> { 
  console.log("[PropertyAction Admin] Property update data received on server:", data, "PropertyID:", propertyId);

  if (!propertyId) {
    return { success: false, message: "ID de propiedad no proporcionado para la actualización." };
  }

  try {
    const imagesJson = data.images && data.images.length > 0 ? JSON.stringify(data.images) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0)) : null;

    const sql = `
      UPDATE properties SET
        title = ?, description = ?, property_type = ?, category = ?,
        price = ?, currency = ?, address = ?, city = ?, region = ?, country = ?,
        bedrooms = ?, bathrooms = ?, total_area_sq_meters = ?, useful_area_sq_meters = ?,
        parking_spaces = ?, pets_allowed = ?, furnished = ?, commercial_use_allowed = ?, has_storage = ?, orientation = ?,
        images = ?, features = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      data.title, data.description, data.propertyType, data.category,
      data.price, data.currency, data.address, data.city, data.region, data.country,
      data.bedrooms, data.bathrooms, data.totalAreaSqMeters,
      data.usefulAreaSqMeters === '' ? null : (data.usefulAreaSqMeters ?? null),
      data.parkingSpaces ?? 0,
      data.petsAllowed ?? false,
      data.furnished ?? false,
      data.commercialUseAllowed ?? false,
      data.hasStorage ?? false,
      data.orientation === '' ? null : (data.orientation ?? null),
      imagesJson, featuresJson,
      propertyId
    ];

    const result: any = await query(sql, params);

    if (result.affectedRows === 0) {
      return { success: false, message: "Propiedad no encontrada o los datos eran los mismos." };
    }

    const propertyDetails = await getPropertyByIdForAdminAction(propertyId);
    const currentSlug = propertyDetails?.slug;

    console.log(`[PropertyAction Admin] Property updated successfully. ID: ${propertyId}, Slug: ${currentSlug}`);

    revalidatePath('/admin/properties');
    revalidatePath('/properties'); 
    if (currentSlug) {
      revalidatePath(`/properties/${currentSlug}`); 
    } else {
      revalidatePath(`/properties/[slug]`, 'layout'); 
    }
    revalidatePath('/'); 

    return { success: true, message: "Propiedad actualizada exitosamente.", propertyId, propertySlug: currentSlug };

  } catch (error: any) {
    console.error(`[PropertyAction Admin] Error updating property ${propertyId}:`, error);
    let message = "Error al actualizar propiedad."; 
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('properties.slug')) {
        message = "Error: Ya existe una propiedad con un título muy similar (slug duplicado).";
    } else if (error.message) {
      message = error.message;
    }
    return { success: false, message: `Error al actualizar propiedad: ${message}` };
  }
}

export async function userUpdatePropertyAction(
  userId: string, 
  propertyId: string,
  data: PropertyFormValues 
): Promise<SubmitPropertyResult> {
  console.log("[PropertyAction User] Update request for property:", propertyId, "by user:", userId, "Data:", data);

  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!propertyId) {
    return { success: false, message: "ID de propiedad no proporcionado." };
  }

  try {
    const propertyCheckSql = 'SELECT user_id, slug FROM properties WHERE id = ?';
    const propertyRows: any[] = await query(propertyCheckSql, [propertyId]);

    if (propertyRows.length === 0) {
      return { success: false, message: "Propiedad no encontrada." };
    }
    if (propertyRows[0].user_id !== userId) {
      console.warn(`[PropertyAction User] User ${userId} attempted to edit property ${propertyId} owned by ${propertyRows[0].user_id}. Denied.`);
      return { success: false, message: "No tienes permiso para editar esta propiedad." };
    }
    
    const currentSlug = propertyRows[0].slug;

    const imagesJson = data.images && data.images.length > 0 ? JSON.stringify(data.images) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0)) : null;

    const updateSql = `
      UPDATE properties SET
        title = ?, description = ?, property_type = ?, category = ?,
        price = ?, currency = ?, address = ?, city = ?, region = ?, country = ?,
        bedrooms = ?, bathrooms = ?, total_area_sq_meters = ?, useful_area_sq_meters = ?,
        parking_spaces = ?, pets_allowed = ?, furnished = ?, commercial_use_allowed = ?, has_storage = ?, orientation = ?,
        images = ?, features = ?,
        updated_at = NOW()
      WHERE id = ? AND user_id = ? 
    `;

    const params = [
      data.title, data.description, data.propertyType, data.category,
      data.price, data.currency, data.address, data.city, data.region, data.country,
      data.bedrooms, data.bathrooms, data.totalAreaSqMeters,
      data.usefulAreaSqMeters === '' ? null : (data.usefulAreaSqMeters ?? null),
      data.parkingSpaces ?? 0,
      data.petsAllowed ?? false,
      data.furnished ?? false,
      data.commercialUseAllowed ?? false,
      data.hasStorage ?? false,
      data.orientation === '' ? null : (data.orientation ?? null),
      imagesJson, featuresJson,
      propertyId, userId
    ];

    const result: any = await query(updateSql, params);

    if (result.affectedRows === 0) {
      return { success: false, message: "No se realizaron cambios en la propiedad o no se pudo actualizar." };
    }

    console.log(`[PropertyAction User] Property ${propertyId} updated successfully by user ${userId}.`);

    revalidatePath('/dashboard/my-listings');
    revalidatePath('/properties');
    if (currentSlug) {
      revalidatePath(`/properties/${currentSlug}`);
    }
    
    return { success: true, message: "Propiedad actualizada exitosamente.", propertyId, propertySlug: currentSlug };

  } catch (error: any) {
    console.error(`[PropertyAction User] Error updating property ${propertyId} for user ${userId}:`, error);
    return { success: false, message: `Error al actualizar propiedad: ${error.message}` };
  }
}


export async function getPropertiesCountAction(activeOnly: boolean = false): Promise<number> {
  try {
    let sql = 'SELECT COUNT(*) as count FROM properties';
    if (activeOnly) {
      sql += ' WHERE is_active = TRUE';
    }
    const result: any[] = await query(sql);
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error al obtener el conteo de propiedades:", error);
    return 0;
  }
}
    

