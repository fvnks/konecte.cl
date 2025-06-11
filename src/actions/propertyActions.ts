
// src/actions/propertyActions.ts
'use server';

import type { PropertyFormValues } from "@/components/property/PropertyForm";
import { query } from "@/lib/db";
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

export async function submitPropertyAction(
  data: PropertyFormValues,
  userId: string 
): Promise<{ success: boolean; message?: string; propertyId?: string }> {
  console.log("Datos de la propiedad recibidos en el servidor:", data, "UserID:", userId);

  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  try {
    const propertyId = randomUUID();
    const slug = generateSlug(data.title); // Consider adding a check for slug uniqueness if necessary

    // Convert comma-separated strings to JSON arrays
    const imagesJson = data.images ? JSON.stringify(data.images.split(',').map(img => img.trim())) : null;
    const featuresJson = data.features ? JSON.stringify(data.features.split(',').map(feat => feat.trim())) : null;

    const sql = `
      INSERT INTO properties (
        id, user_id, title, slug, description, property_type, category,
        price, currency, address, city, country, bedrooms, bathrooms,
        area_sq_meters, images, features 
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    // Revalidate paths where properties are listed or displayed
    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath(`/properties/${slug}`); // If you have a detail page

    return { success: true, message: "Propiedad publicada exitosamente.", propertyId: propertyId };

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
