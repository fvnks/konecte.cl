'use server';

import type { PropertyVisit, RequestVisitFormValues, UpdateVisitStatusFormValues, PropertyVisitStatus } from '@/lib/types';
import { requestVisitFormSchema, updateVisitStatusFormSchema, adminScheduleVisitFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { propertyViewings, properties, users } from '@/lib/db/schema';
import { eq, and, or, sql, count, desc, asc } from 'drizzle-orm';

// Helper function to map DB row to PropertyVisit type
function mapDbRowToPropertyVisit(row: any): PropertyVisit {
  const visit = row.property_viewings;
  const property = row.properties;
  const visitor = row.visitor;
  const owner = row.owner;

  return {
    id: visit.id,
    property_id: visit.propertyId,
    visitor_id: visit.visitorId,
    owner_id: visit.ownerId,
    proposed_datetime: new Date(visit.proposedDatetime).toISOString(),
    confirmed_datetime: visit.confirmedDatetime ? new Date(visit.confirmedDatetime).toISOString() : null,
    status: visit.status,
    visitor_notes: visit.visitorNotes,
    owner_notes: visit.ownerNotes,
    created_at: new Date(visit.createdAt).toISOString(),
    updated_at: new Date(visit.updatedAt).toISOString(),
    created_by_admin: !!visit.createdByAdmin,
    property_title: property.title,
    property_slug: property.slug,
    visitor_name: visitor.name,
    owner_name: owner.name,
  };
}

export async function requestVisitAction(
  values: unknown
): Promise<{ success: boolean; message: string }> {
  const validation = requestVisitFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos del formulario inválidos." };
  }
  const { propertyId, userId, ownerId, proposedDate, proposedTime, visitorNotes } = validation.data;
  
  const proposed_datetime = new Date(proposedDate);
  const [hours, minutes] = proposedTime.split(':').map(Number);
  proposed_datetime.setHours(hours, minutes);

  try {
    const visitId = randomUUID();
    await db.insert(propertyViewings).values({
        id: visitId,
        visitorId: userId,
        propertyId: propertyId,
        ownerId: ownerId,
        proposedDatetime: proposed_datetime,
        visitorNotes: visitorNotes || null,
        status: 'pending_confirmation',
    })
    
    revalidatePath('/dashboard/visits');
    return { success: true, message: 'Solicitud de visita enviada. El propietario ha sido notificado.' };
  } catch (error: any) {
    console.error("[VisitAction] Error in requestVisitAction:", error);
    return { success: false, message: `Error al enviar la solicitud: ${error.message}` };
  }
}

export async function updateVisitStatusAction(
  values: unknown
): Promise<{ success: boolean; message: string }> {
    const validation = updateVisitStatusFormSchema.safeParse(values);
    if (!validation.success) {
        return { success: false, message: "Datos inválidos." };
    }
    const { visitId, newStatus, userRole, notes, confirmed_datetime } = validation.data;

    try {
        const updateData: Partial<{ status: PropertyVisitStatus, ownerNotes: string | null, visitorNotes: string | null, confirmedDatetime: Date | null, updatedAt: Date }> = {
            status: newStatus,
            updatedAt: new Date(),
        };

        if (userRole === 'owner') {
            updateData.ownerNotes = notes || null;
        } else {
            updateData.visitorNotes = notes || null;
        }

        if (newStatus === 'confirmed' && confirmed_datetime) {
            updateData.confirmedDatetime = confirmed_datetime;
        }

        await db.update(propertyViewings).set(updateData).where(eq(propertyViewings.id, visitId));

        revalidatePath('/dashboard/visits');
        revalidatePath('/admin/visits');
        return { success: true, message: "Estado de la visita actualizado." };
    } catch (error: any) {
        console.error("[VisitAction] Error updating visit status:", error);
        return { success: false, message: `Error al actualizar: ${error.message}` };
    }
}

export async function scheduleVisitByAdminAction(
  values: unknown
): Promise<{ success: boolean; message: string }> {
  const validationResult = adminScheduleVisitFormSchema.safeParse(values);

  if (!validationResult.success) {
    return { success: false, message: 'Datos de formulario inválidos.' };
  }
  const { userId, propertyId, visitDate, visitTime } = validationResult.data;

  const proposed_datetime = new Date(visitDate);
  const [hours, minutes] = visitTime.split(':').map(Number);
  proposed_datetime.setHours(hours, minutes);

  try {
    const propertyOwnerResult = await db.select({ ownerId: properties.userId }).from(properties).where(eq(properties.id, propertyId));

    if (propertyOwnerResult.length === 0) {
      return { success: false, message: 'La propiedad no fue encontrada.' };
    }
    const ownerId = propertyOwnerResult[0].ownerId;
    if (ownerId === userId) {
      return { success: false, message: 'Un usuario no puede agendar una visita a su propia propiedad.' };
    }

    const visitId = randomUUID();
    await db.insert(propertyViewings).values({
        id: visitId,
        visitorId: userId,
        propertyId: propertyId,
        ownerId: ownerId,
        proposedDatetime: proposed_datetime,
        status: 'confirmed',
        createdByAdmin: true,
    });

    revalidatePath('/admin/visits');
    return { success: true, message: 'Visita agendada exitosamente.' };
  } catch (error) {
    console.error('Error in scheduleVisitByAdminAction:', error);
    return { success: false, message: 'Ocurrió un error en el servidor.' };
  }
}

export type AdminVisitsOrderBy = 
  | 'created_at_desc' | 'created_at_asc' | 'proposed_datetime_desc'
  | 'proposed_datetime_asc' | 'status_asc' | 'status_desc';

export interface GetAllVisitsAdminOptions {
    filterStatus?: PropertyVisitStatus;
    orderBy?: AdminVisitsOrderBy;
}

export async function getAllVisitsForAdminAction(options: GetAllVisitsAdminOptions = {}): Promise<PropertyVisit[]> {
  const { filterStatus, orderBy = 'created_at_desc' } = options;
  
  const orderByMapping: Record<AdminVisitsOrderBy, any> = {
    created_at_desc: desc(propertyViewings.createdAt), created_at_asc: asc(propertyViewings.createdAt),
    proposed_datetime_desc: desc(propertyViewings.proposedDatetime), proposed_datetime_asc: asc(propertyViewings.proposedDatetime),
    status_asc: asc(propertyViewings.status), status_desc: desc(propertyViewings.status),
  };

  const visitorUser = db.alias(users, 'visitor');
  const ownerUser = db.alias(users, 'owner');
  
  try {
    const query = db.select({
        property_viewings: propertyViewings,
        properties: properties,
        visitor: visitorUser,
        owner: ownerUser
    })
    .from(propertyViewings)
    .innerJoin(visitorUser, eq(propertyViewings.visitorId, visitorUser.id))
    .innerJoin(ownerUser, eq(propertyViewings.ownerId, ownerUser.id))
    .innerJoin(properties, eq(propertyViewings.propertyId, properties.id))
    .orderBy(orderByMapping[orderBy]);

    if (filterStatus) {
        query.where(eq(propertyViewings.status, filterStatus));
    }

    const rows = await query;
    return rows.map(mapDbRowToPropertyVisit);
  } catch (error) {
    console.error("Error fetching all visits for admin:", error);
    throw new Error("Could not fetch visits.");
  }
}

export async function getVisitCountsByStatusForAdmin(): Promise<Record<PropertyVisitStatus, number>> {
    const statusValues: PropertyVisitStatus[] = ['pending_confirmation', 'confirmed', 'cancelled_by_visitor', 'cancelled_by_owner', 'rescheduled_by_owner', 'completed', 'visitor_no_show', 'owner_no_show'];
    const counts: Record<PropertyVisitStatus, number> = {} as any;

    try {
        const results = await db.select({
            status: propertyViewings.status,
            count: count()
        }).from(propertyViewings).groupBy(propertyViewings.status);
        
        const countsMap = new Map(results.map(r => [r.status, r.count]));
        for (const status of statusValues) {
            counts[status] = countsMap.get(status) || 0;
        }
        return counts;
    } catch (error) {
        console.error("Error fetching visit counts by status:", error);
        for (const status of statusValues) {
            counts[status] = 0;
        }
        return counts;
    }
}

export async function getVisitsForUserAction(userId: string): Promise<PropertyVisit[]> {
  const visitorUser = db.alias(users, 'visitor');
  const ownerUser = db.alias(users, 'owner');
  try {
    const rows = await db.select({
        property_viewings: propertyViewings,
        properties: properties,
        visitor: visitorUser,
        owner: ownerUser
    })
    .from(propertyViewings)
    .innerJoin(visitorUser, eq(propertyViewings.visitorId, visitorUser.id))
    .innerJoin(ownerUser, eq(propertyViewings.ownerId, ownerUser.id))
    .innerJoin(properties, eq(propertyViewings.propertyId, properties.id))
    .where(or(eq(propertyViewings.visitorId, userId), eq(propertyViewings.ownerId, userId)))
    .orderBy(desc(propertyViewings.proposedDatetime));
    
    return rows.map(mapDbRowToPropertyVisit);
  } catch (error) {
    console.error(`Error fetching visits for user ${userId}:`, error);
    return [];
  }
} 