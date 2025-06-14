
// src/actions/leadTrackingActions.ts
'use server';

import { query } from '@/lib/db';
import type { PropertyInquiryFormValues } from '@/lib/types';
import { propertyInquiryFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// --- Record Property View ---
export async function recordPropertyViewAction(
  propertyId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message?: string }> {
  if (!propertyId) {
    return { success: false, message: 'ID de propiedad no proporcionado.' };
  }

  try {
    const viewId = randomUUID();
    await query(
      'INSERT INTO property_views (id, property_id, user_id, ip_address, user_agent, viewed_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [viewId, propertyId, userId || null, ipAddress || null, userAgent || null]
    );

    // Incrementar el contador de vistas en la tabla properties
    await query('UPDATE properties SET views_count = IFNULL(views_count, 0) + 1 WHERE id = ?', [propertyId]);
    
    // No es necesario revalidar la ruta para una simple vista, a menos que se muestre el contador en tiempo real.
    // Revalidar si el contador de vistas se muestra en la página de propiedades o listados:
    // revalidatePath(`/properties/${propertySlug}`); // Asumiendo que tienes propertySlug
    // revalidatePath('/properties');

    return { success: true, message: 'Vista registrada.' };
  } catch (error: any) {
    console.error('[LeadTrackingAction] Error recording property view:', error);
    return { success: false, message: `Error al registrar vista: ${error.message}` };
  }
}

// --- Submit Property Inquiry ---
export async function submitPropertyInquiryAction(
  propertyId: string,
  propertyOwnerId: string,
  values: PropertyInquiryFormValues,
  userId?: string
): Promise<{ success: boolean; message?: string }> {
  if (!propertyId || !propertyOwnerId) {
    return { success: false, message: 'ID de propiedad o propietario no proporcionado.' };
  }

  const validation = propertyInquiryFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: 'Datos de consulta inválidos: ' + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, email, phone, message } = validation.data;

  try {
    const inquiryId = randomUUID();
    await query(
      'INSERT INTO property_inquiries (id, property_id, property_owner_id, user_id, name, email, phone, message, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [inquiryId, propertyId, propertyOwnerId, userId || null, name, email, phone || null, message]
    );

    // Incrementar el contador de consultas en la tabla properties
    await query('UPDATE properties SET inquiries_count = IFNULL(inquiries_count, 0) + 1 WHERE id = ?', [propertyId]);
    
    // Revalidar si el contador de consultas se muestra
    // revalidatePath(`/properties/${propertySlug}`); // Asumiendo que tienes propertySlug

    return { success: true, message: 'Consulta enviada exitosamente.' };
  } catch (error: any) {
    console.error('[LeadTrackingAction] Error submitting property inquiry:', error);
    return { success: false, message: `Error al enviar consulta: ${error.message}` };
  }
}

// --- Get Property Views (Futuro - para el panel del propietario) ---
// export async function getPropertyViewsAction(propertyId: string): Promise<PropertyView[]> { ... }

// --- Get Property Inquiries (Futuro - para el panel del propietario) ---
// export async function getPropertyInquiriesAction(propertyId: string): Promise<PropertyInquiry[]> { ... }
