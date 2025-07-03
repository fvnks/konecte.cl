// src/actions/leadTrackingActions.ts
'use server';

import { db } from '@/lib/db';
import { properties, propertyInquiries, propertyViews } from '@/lib/db/schema';
import type { PropertyInquiryFormValues } from '@/lib/types';
import { propertyInquiryFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { sql, eq, sum, count } from 'drizzle-orm';

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
    await db.insert(propertyViews).values({
      id: randomUUID(),
      propertyId: propertyId,
      userId: userId,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });
    
    await db.update(properties)
      .set({ viewsCount: sql`${properties.viewsCount} + 1` })
      .where(eq(properties.id, propertyId));

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
    await db.insert(propertyInquiries).values({
      id: randomUUID(),
      propertyId,
      propertyOwnerId,
      userId: userId,
      name,
      email,
      phone: phone,
      message,
    });

    await db.update(properties)
      .set({ inquiriesCount: sql`${properties.inquiriesCount} + 1` })
      .where(eq(properties.id, propertyId));
    
    return { success: true, message: 'Consulta enviada exitosamente.' };
  } catch (error: any) {
    console.error('[LeadTrackingAction] Error submitting property inquiry:', error);
    return { success: false, message: `Error al enviar consulta: ${error.message}` };
  }
}

export async function getTotalPropertyViewsAction(): Promise<number> {
  try {
    const result = await db.select({ count: count() }).from(propertyViews);
    return result[0].count || 0;
  } catch (error) {
    console.error("Error al obtener el conteo total de vistas de propiedades:", error);
    return 0;
  }
}

export async function getTotalPropertyInquiriesAction(): Promise<number> {
  try {
    const result = await db.select({ count: count() }).from(propertyInquiries);
    return result[0].count || 0;
  } catch (error) {
    console.error("Error al obtener el conteo total de consultas de propiedades:", error);
    return 0;
  }
}

// --- User Specific Stats ---
export async function getUserTotalPropertyViewsAction(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const result = await db.select({ totalViews: sum(properties.viewsCount) })
      .from(properties)
      .where(eq(properties.userId, userId));
    
    return Number(result[0]?.totalViews) || 0;
  } catch (error) {
    console.error(`Error fetching total property views for user ${userId}:`, error);
    return 0;
  }
}

export async function getUserTotalPropertyInquiriesAction(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const result = await db.select({ totalInquiries: sum(properties.inquiriesCount) })
      .from(properties)
      .where(eq(properties.userId, userId));

    return Number(result[0]?.totalInquiries) || 0;
  } catch (error) {
    console.error(`Error fetching total property inquiries for user ${userId}:`, error);
    return 0;
  }
}