'use server';

import { query } from '@/lib/db';
import type { PropertyVisit, RequestVisitFormValues, UpdateVisitStatusFormValues, PropertyVisitStatus } from '@/lib/types';
import { requestVisitFormSchema, updateVisitStatusFormSchema, adminScheduleVisitFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

// Helper function to map DB row to PropertyVisit type
function mapDbRowToPropertyVisit(row: any): PropertyVisit {
  return {
    id: row.id,
    property_id: row.property_id,
    visitor_id: row.visitor_id,
    owner_id: row.owner_id,
    proposed_datetime: new Date(row.proposed_datetime).toISOString(),
    confirmed_datetime: row.confirmed_datetime ? new Date(row.confirmed_datetime).toISOString() : null,
    status: row.status,
    visitor_notes: row.visitor_notes,
    owner_notes: row.owner_notes,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    created_by_admin: !!row.created_by_admin,
    property_title: row.property_title,
    property_slug: row.property_slug,
    visitor_name: row.visitor_name,
    owner_name: row.owner_name,
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
    const sql = `
      INSERT INTO property_viewings (id, visitor_id, property_id, owner_id, proposed_datetime, visitor_notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending_confirmation')
    `;
    await query(sql, [visitId, userId, propertyId, ownerId, proposed_datetime, visitorNotes || null]);
    
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
        let sql = 'UPDATE property_viewings SET status = ?, updated_at = NOW()';
        const params: (string | Date | null)[] = [newStatus];

        if (userRole === 'owner') {
            sql += ', owner_notes = ?';
            params.push(notes || null);
        } else {
            sql += ', visitor_notes = ?';
            params.push(notes || null);
        }

        if (newStatus === 'confirmed' && confirmed_datetime) {
            sql += ', confirmed_datetime = ?';
            params.push(confirmed_datetime);
        }

        sql += ' WHERE id = ?';
        params.push(visitId);

        await query(sql, params);
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
    const propertyOwnerResult: any[] = await query(
      'SELECT user_id FROM properties WHERE id = ?', [propertyId]
    );

    if (propertyOwnerResult.length === 0) {
      return { success: false, message: 'La propiedad no fue encontrada.' };
    }
    const ownerId = propertyOwnerResult[0].user_id;
    if (ownerId === userId) {
      return { success: false, message: 'Un usuario no puede agendar una visita a su propia propiedad.' };
    }

    const sql = `
      INSERT INTO property_viewings (
        id, visitor_id, property_id, owner_id, proposed_datetime, status, created_by_admin
      ) VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `;
    const visitId = randomUUID();
    await query(sql, [visitId, userId, propertyId, ownerId, proposed_datetime, 'confirmed']);

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
  let sql = `
    SELECT 
        pv.id, pv.visitor_id, visitor.name as visitor_name, pv.owner_id, owner.name as owner_name,
        pv.property_id, p.title as property_title, p.slug as property_slug, pv.proposed_datetime,
        pv.confirmed_datetime, pv.status, pv.visitor_notes, pv.owner_notes, pv.created_at, pv.updated_at,
        pv.created_by_admin
    FROM property_viewings pv
    JOIN users visitor ON pv.visitor_id = visitor.id
    JOIN users owner ON pv.owner_id = owner.id
    JOIN properties p ON pv.property_id = p.id
  `;
  const params: (string | number)[] = [];

  if (filterStatus) {
    sql += ` WHERE pv.status = ?`;
    params.push(filterStatus);
  }

  const orderByMapping: Record<AdminVisitsOrderBy, string> = {
    created_at_desc: 'pv.created_at DESC', created_at_asc: 'pv.created_at ASC',
    proposed_datetime_desc: 'pv.proposed_datetime DESC', proposed_datetime_asc: 'pv.proposed_datetime ASC',
    status_asc: 'pv.status ASC', status_desc: 'pv.status DESC',
  };
  sql += ` ORDER BY ${orderByMapping[orderBy]}`;
  
  try {
    const rows: any[] = await query(sql, params);
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
        const sql = `SELECT status, COUNT(*) as count FROM property_viewings GROUP BY status`;
        const results: { status: PropertyVisitStatus, count: number }[] = await query(sql);
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
  if (!userId) {
    console.error("getVisitsForUserAction called without a userId.");
    return [];
  }

  try {
    const sql = `
      SELECT 
          pv.id, pv.visitor_id, visitor.name as visitor_name, pv.owner_id, owner.name as owner_name,
          pv.property_id, p.title as property_title, p.slug as property_slug, pv.proposed_datetime,
          pv.confirmed_datetime, pv.status, pv.visitor_notes, pv.owner_notes, pv.created_at, pv.updated_at,
          pv.created_by_admin
      FROM property_viewings pv
      JOIN users visitor ON pv.visitor_id = visitor.id
      JOIN users owner ON pv.owner_id = owner.id
      JOIN properties p ON pv.property_id = p.id
      WHERE pv.visitor_id = ? OR pv.owner_id = ?
      ORDER BY pv.proposed_datetime DESC
    `;
    
    const rows: any[] = await query(sql, [userId, userId]);
    return rows.map(mapDbRowToPropertyVisit);

  } catch (error) {
    console.error(`Error fetching visits for user ${userId}:`, error);
    // Devuelve un array vacío en caso de error para no romper el frontend.
    return [];
  }
} 