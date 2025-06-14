
// src/actions/propertyActions.ts
'use server';

import type { PropertyFormValues } from "@/components/property/PropertyForm";
import { query } from "@/lib/db";
import type { PropertyListing, User, PropertyType, ListingCategory } from "@/lib/types";
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
    country: row.country,
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    areaSqMeters: Number(row.area_sq_meters),
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
      role_id: row.author_role_id || '', // Assuming author_role_id is fetched
    } : undefined,
  };
}


export async function submitPropertyAction(
  data: PropertyFormValues,
  userId: string
): Promise<{ success: boolean; message?: string; propertyId?: string, propertySlug?: string }> {
  console.log("[PropertyAction] Property data received on server:", data, "UserID:", userId);

  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  try {
    const propertyId = randomUUID();
    const slug = generateSlug(data.title);

    const imagesJson = data.images ? JSON.stringify(data.images.split(',').map(img => img.trim()).filter(img => img.length > 0)) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0)) : null;

    const sql = `
      INSERT INTO properties (
        id, user_id, title, slug, description, property_type, category,
        price, currency, address, city, country, bedrooms, bathrooms,
        area_sq_meters, images, features, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    const params = [
      propertyId,
      userId,
      data.title,
      slug,
      data.description,
      data.propertyType,
      data.category,
      data.price,
      data.currency,
      data.address,
      data.city,
      data.country,
      data.bedrooms,
      data.bathrooms,
      data.areaSqMeters,
      imagesJson,
      featuresJson
    ];

    await query(sql, params);
    console.log(`[PropertyAction] Property submitted successfully. ID: ${propertyId}, Slug: ${slug}`);

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath(`/properties/${slug}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/properties');


    return { success: true, message: "Propiedad publicada exitosamente.", propertyId: propertyId, propertySlug: slug };

  } catch (error: any) {
    console.error("[PropertyAction] Error submitting property:", error);
    let message = "Ocurrió un error desconocido al publicar la propiedad.";
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('properties.slug')) {
        message = "Ya existe una propiedad con un título muy similar (slug duplicado). Intenta con un título ligeramente diferente.";
    } else if (error.message) {
      message = error.message;
    }
    return { success: false, message };
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
    orderBy = 'createdAt_desc', // Default order
  } = options;

  try {
    let sql = `
      SELECT
        p.*,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const queryParams: any[] = [];
    const whereClauses: string[] = [];

    if (!includeInactive) {
      whereClauses.push('p.is_active = TRUE');
    }

    if (searchTerm) {
      whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.city LIKE ? OR p.address LIKE ?)');
      const searchTermLike = `%${searchTerm}%`;
      queryParams.push(searchTermLike, searchTermLike, searchTermLike, searchTermLike);
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

    // ORDER BY clause
    switch (orderBy) {
      case 'price_asc':
        sql += ' ORDER BY p.price ASC, p.created_at DESC';
        break;
      case 'price_desc':
        sql += ' ORDER BY p.price DESC, p.created_at DESC';
        break;
      case 'popularity_desc':
        sql += ' ORDER BY p.upvotes DESC, p.comments_count DESC, p.views_count DESC, p.inquiries_count DESC, p.created_at DESC';
        break;
      case 'createdAt_desc':
      default:
        sql += ' ORDER BY p.created_at DESC';
        break;
    }

    // Interpolate LIMIT and OFFSET directly and safely
    if (limit !== undefined) {
      const numLimit = parseInt(String(limit), 10);
      if (!isNaN(numLimit) && numLimit >= 0) { // Allow 0 for limit
        if (offset !== undefined) {
          const numOffset = parseInt(String(offset), 10);
          if (!isNaN(numOffset) && numOffset >= 0) {
            sql += ` LIMIT ${numOffset}, ${numLimit}`; // LIMIT offset, count
          } else {
            // Offset is invalid, but limit is valid
            sql += ` LIMIT ${numLimit}`;
          }
        } else {
          // Limit is valid, no offset
          sql += ` LIMIT ${numLimit}`;
        }
      }
      // If limit is invalid (NaN or negative), it's simply not added to the SQL query.
    }
    // Parameters for LIMIT and OFFSET are NOT added to queryParams.

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
    const sql = `
      SELECT
        p.*,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.slug = ?
        AND p.is_active = TRUE
    `; // For public view, only active properties by slug
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
    const sql = `
      SELECT
        p.*,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `;
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
    const sql = `
      SELECT
        p.*,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.role_id as author_role_id
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `; // No filter by is_active for admin
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
): Promise<{ success: boolean; message?: string; propertySlug?: string }> {
  console.log("[PropertyAction Admin] Property update data received on server:", data, "PropertyID:", propertyId);

  if (!propertyId) {
    return { success: false, message: "ID de propiedad no proporcionado para la actualización." };
  }

  // No se permite cambiar el user_id ni el slug (para evitar complicaciones)
  // El slug original se mantiene. Si se necesita cambiar el slug, se debe hacer con cuidado (redirecciones, etc.)

  try {
    const imagesJson = data.images ? JSON.stringify(data.images.split(',').map(img => img.trim()).filter(img => img.length > 0)) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim()).filter(feat => feat.length > 0)) : null;

    const sql = `
      UPDATE properties SET
        title = ?, description = ?, property_type = ?, category = ?,
        price = ?, currency = ?, address = ?, city = ?, country = ?,
        bedrooms = ?, bathrooms = ?, area_sq_meters = ?,
        images = ?, features = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      data.title,
      data.description,
      data.propertyType,
      data.category,
      data.price,
      data.currency,
      data.address,
      data.city,
      data.country,
      data.bedrooms,
      data.bathrooms,
      data.areaSqMeters,
      imagesJson,
      featuresJson,
      propertyId
    ];

    const result: any = await query(sql, params);

    if (result.affectedRows === 0) {
      return { success: false, message: "Propiedad no encontrada o los datos eran los mismos." };
    }

    // Obtener el slug de la propiedad para la revalidación
    const propertyDetails = await getPropertyByIdForAdminAction(propertyId);
    const currentSlug = propertyDetails?.slug;

    console.log(`[PropertyAction Admin] Property updated successfully. ID: ${propertyId}, Slug: ${currentSlug}`);

    revalidatePath('/admin/properties');
    revalidatePath('/properties'); // Revalidate the general listings page
    if (currentSlug) {
      revalidatePath(`/properties/${currentSlug}`); // Revalidate the specific property page
    } else {
      revalidatePath(`/properties/[slug]`, 'layout'); // Fallback if slug isn't fetched quickly
    }
    revalidatePath('/'); // Revalidate homepage if it shows featured properties

    return { success: true, message: "Propiedad actualizada exitosamente.", propertySlug: currentSlug };

  } catch (error: any) {
    console.error(`[PropertyAction Admin] Error updating property ${propertyId}:`, error);
    let message = "Error al actualizar propiedad."; // Default message
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('properties.slug')) {
        message = "Error: Ya existe una propiedad con un título muy similar (slug duplicado).";
    } else if (error.message) {
      message = error.message;
    }
    return { success: false, message: `Error al actualizar propiedad: ${message}` };
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
