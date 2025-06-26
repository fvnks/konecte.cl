// src/actions/propertyActions.ts
'use server';

import type { PropertyFormValues } from "@/lib/types"; 
import { query } from "@/lib/db";
import type { PropertyListing, User, PropertyType, ListingCategory, SubmitPropertyResult, OrientationType } from "@/lib/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { findMatchingRequestsForNewProperty, type NewPropertyInput } from '@/ai/flows/find-matching-requests-for-new-property-flow';
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
    pub_id: row.publication_code,
    user_id: row.user_id,
    source: row.source,
    title: row.title,
    slug: row.slug,
    description: row.description,
    listingType: row.property_type,
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
  const pubId = `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  try {
    const imagesJson = data.images && data.images.length > 0 ? JSON.stringify(data.images) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0)) : null;

    const sql = `
      INSERT INTO properties (
        id, user_id, title, slug, description, property_type, category,
        price, currency, address, city, region, country, bedrooms, bathrooms,
        total_area_sq_meters, useful_area_sq_meters, parking_spaces, 
        pets_allowed, furnished, commercial_use_allowed, has_storage, orientation,
        images, features, is_active, created_at, updated_at, publication_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW(), ?)
    `;

    const params = [
      propertyId, userId, data.title, slug, data.description, data.listingType, data.category,
      data.price, data.currency, data.address, data.city, data.region, data.country, data.bedrooms, data.bathrooms,
      data.totalAreaSqMeters, 
      data.usefulAreaSqMeters === null ? null : (data.usefulAreaSqMeters ?? null),
      data.parkingSpaces ?? 0,
      data.petsAllowed ?? false,
      data.furnished ?? false,
      data.commercialUseAllowed ?? false,
      data.hasStorage ?? false,
      data.orientation === null ? null : (data.orientation ?? null),
      imagesJson, featuresJson, pubId
    ];

    await query(sql, params);
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

const BASE_PROPERTY_SELECT_SQL = `
  SELECT
    p.id, p.user_id, p.title, p.slug, p.description, p.property_type, p.category,
    p.price, p.currency, p.address, p.city, p.region, p.country, p.bedrooms,
    p.bathrooms, p.total_area_sq_meters, p.useful_area_sq_meters, p.parking_spaces,
    p.pets_allowed, p.furnished, p.commercial_use_allowed, p.has_storage,
    p.orientation, p.images, p.features, p.upvotes, p.comments_count,
    p.views_count, p.inquiries_count, p.is_active, p.created_at, p.updated_at,
    p.publication_code,
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
    u.plan_id as author_plan_id,
    p.source as source
  FROM properties p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN roles r ON u.role_id = r.id
  LEFT JOIN plans plan_author ON u.plan_id = plan_author.id
`;

export async function getPropertiesAction(options: GetPropertiesActionOptions = {}): Promise<PropertyListing[]> {
  const {
    includeInactive = true,
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

  let sql = BASE_PROPERTY_SELECT_SQL;
  const params: (string | number | boolean)[] = [];

  const whereConditions: string[] = [];

  if (!includeInactive) {
    whereConditions.push("p.is_active = TRUE");
  }

  if (searchTerm) {
    whereConditions.push("(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ? OR p.region LIKE ? OR p.publication_code = ?)");
    const searchTermLike = `%${searchTerm}%`;
    params.push(searchTermLike, searchTermLike, searchTermLike, searchTermLike, searchTermLike, searchTerm);
  }

  if (propertyType) {
    whereConditions.push("p.property_type = ?");
    params.push(propertyType);
  }

  if (category) {
    whereConditions.push("p.category = ?");
    params.push(category);
  }

  if (city) {
    whereConditions.push("p.city LIKE ?");
    params.push(`%${city}%`);
  }

  if (minPrice !== undefined) {
    whereConditions.push("p.price >= ?");
    params.push(minPrice);
  }

  if (maxPrice !== undefined) {
    whereConditions.push("p.price <= ?");
    params.push(maxPrice);
  }

  if (minBedrooms !== undefined) {
    whereConditions.push("p.bedrooms >= ?");
    params.push(minBedrooms);
  }
  
  if (minBathrooms !== undefined) {
    whereConditions.push("p.bathrooms >= ?");
    params.push(minBathrooms);
  }

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(" AND ")}`;
  }
  
  switch (orderBy) {
    case 'price_asc':
      sql += ' ORDER BY p.price ASC';
      break;
    case 'price_desc':
      sql += ' ORDER BY p.price DESC';
      break;
    case 'popularity_desc':
      sql += ' ORDER BY p.views_count DESC, p.upvotes DESC';
      break;
    case 'random':
      sql += ' ORDER BY RAND()';
      break;
    case 'createdAt_desc':
    default:
      sql += ' ORDER BY p.created_at DESC';
      break;
  }

  if (limit) {
    sql += ` LIMIT ?`;
    params.push(limit);
  }
  
  if (offset) {
    sql += ` OFFSET ?`;
    params.push(offset);
  }

  try {
    const rows = await query(sql, params);
    if (!Array.isArray(rows)) {
        console.error("Expected rows to be an array, but got:", rows);
        return [];
    }
    return rows.map(mapDbRowToPropertyListing);
  } catch (error) {
    console.error("Error in getPropertiesAction:", error);
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
      data.title, data.description, data.listingType, data.category,
      data.price, data.currency, data.address, data.city, data.region, data.country,
      data.bedrooms, data.bathrooms, data.totalAreaSqMeters,
      data.usefulAreaSqMeters === null ? null : Number(data.usefulAreaSqMeters),
      data.parkingSpaces === null ? null : Number(data.parkingSpaces),
      data.petsAllowed ?? false,
      data.furnished ?? false,
      data.commercialUseAllowed ?? false,
      data.hasStorage ?? false,
      data.orientation === null ? null : (data.orientation ?? null),
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
      data.title, data.description, data.listingType, data.category,
      data.price, data.currency, data.address, data.city, data.region, data.country,
      data.bedrooms, data.bathrooms, data.totalAreaSqMeters,
      data.usefulAreaSqMeters === null ? null : Number(data.usefulAreaSqMeters),
      data.parkingSpaces === null ? null : Number(data.parkingSpaces),
      data.petsAllowed ?? false,
      data.furnished ?? false,
      data.commercialUseAllowed ?? false,
      data.hasStorage ?? false,
      data.orientation === null ? null : (data.orientation ?? null),
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
  const statusCondition = activeOnly ? "WHERE is_active = TRUE" : "";
  const sql = `SELECT COUNT(*) as count FROM properties ${statusCondition}`;
  const result = await query(sql);
  return result[0].count;
}

/**
 * Searches for properties by title or address (for admin usage).
 * Returns a simplified list for autocomplete fields.
 */
export async function searchPropertiesAction(
  searchTerm: string
): Promise<{ id: string; title: string; address: string }[]> {
  if (!searchTerm.trim()) {
    return [];
  }

  try {
    const sql = `
      SELECT id, title, address
      FROM properties
      WHERE (title LIKE ? OR address LIKE ?) AND is_active = TRUE
      ORDER BY title
      LIMIT 15
    `;
    
    const searchTermWithWildcards = `%${searchTerm}%`;
    const rows = await query(sql, [searchTermWithWildcards, searchTermWithWildcards]);
    
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      address: row.address,
    }));

  } catch (error) {
    console.error("[searchPropertiesAction] Error searching properties:", error);
    return [];
  }
}

/**
 * Searches for properties owned by a specific user by title or address.
 * Returns a simplified list for autocomplete fields.
 */
export async function searchMyPropertiesAction(
  userId: string,
  searchTerm: string
): Promise<{ id: string; title: string; address: string }[]> {
  if (!userId) {
    console.error("[searchMyPropertiesAction] Error: userId is required.");
    return [];
  }
  
  if (!searchTerm.trim()) {
    return [];
  }

  try {
    const sql = `
      SELECT id, title, address
      FROM properties
      WHERE user_id = ? AND (title LIKE ? OR address LIKE ?) AND is_active = TRUE
      ORDER BY title
      LIMIT 15
    `;
    
    const searchTermWithWildcards = `%${searchTerm}%`;
    const rows = await query(sql, [userId, searchTermWithWildcards, searchTermWithWildcards]);
    
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      address: row.address,
    }));

  } catch (error) {
    console.error("[searchMyPropertiesAction] Error searching user's properties:", error);
    return [];
  }
}

export async function getPropertyByCodeAction(code: string): Promise<PropertyListing | null> {
  try {
    const sql = `
      SELECT 
        p.*, 
        u.name as author_name, 
        u.email as author_email, 
        u.phone_number as author_phone_number,
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id,
        r.name as author_role_name
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE p.publication_code = ? 
      LIMIT 1
    `;
    const results = await query(sql, [code]);

    if (results && results.length > 0) {
      return mapDbRowToPropertyListing(results[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching property by code ${code}:`, error);
    return null;
  }
}
    
