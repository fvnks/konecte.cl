
// src/actions/visitActions.ts
'use server';

import { query } from '@/lib/db';
import type { PropertyVisit, RequestVisitFormValues, UpdateVisitStatusFormValues, PropertyVisitStatus } from '@/lib/types';
import { requestVisitFormSchema, updateVisitStatusFormSchema } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { format as formatDateFns } from 'date-fns'; // Renombrar para evitar conflicto con format de util

// Helper function to map DB row to PropertyVisit object
function mapDbRowToPropertyVisit(row: any): PropertyVisit {
  return {
    id: row.id,
    property_id: row.property_id,
    visitor_user_id: row.visitor_user_id,
    property_owner_user_id: row.property_owner_user_id,
    proposed_datetime: new Date(row.proposed_datetime).toISOString(),
    confirmed_datetime: row.confirmed_datetime ? new Date(row.confirmed_datetime).toISOString() : null,
    status: row.status,
    visitor_notes: row.visitor_notes,
    owner_notes: row.owner_notes,
    cancellation_reason: row.cancellation_reason,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    // Optional joined data
    property_title: row.property_title,
    property_slug: row.property_slug,
    visitor_name: row.visitor_name,
    visitor_avatar_url: row.visitor_avatar_url,
    owner_name: row.owner_name,
    owner_avatar_url: row.owner_avatar_url,
  };
}

export async function requestVisitAction(
  propertyId: string,
  propertyOwnerId: string,
  visitorUserId: string,
  values: RequestVisitFormValues
): Promise<{ success: boolean; message?: string; visit?: PropertyVisit }> {
  if (!visitorUserId) {
    return { success: false, message: "Usuario no autenticado." };
  }
  if (!propertyId || !propertyOwnerId) {
    return { success: false, message: "ID de propiedad o propietario no proporcionado." };
  }

  const validation = requestVisitFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { proposed_datetime, visitor_notes } = validation.data;

  try {
    // Check if property owner is the same as visitor
    if (visitorUserId === propertyOwnerId) {
        return { success: false, message: "No puedes solicitar una visita a tu propia propiedad." };
    }

    const visitId = randomUUID();
    const sql = `
      INSERT INTO property_visits (
        id, property_id, visitor_user_id, property_owner_user_id,
        proposed_datetime, status, visitor_notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      visitId, propertyId, visitorUserId, propertyOwnerId,
      new Date(proposed_datetime), // Ensure it's a Date object for MySQL
      'pending_confirmation',
      visitor_notes || null
    ];

    await query(sql, params);

    revalidatePath('/dashboard/visits');
    revalidatePath(`/admin/visits`); 
    revalidatePath(`/properties/${visitId}`); // Assuming property slug might be visitId for revalidation logic, adjust if needed

    // Fetch the newly created visit to return it
    const newVisitResult = await query('SELECT * FROM property_visits WHERE id = ?', [visitId]);
    if (!Array.isArray(newVisitResult) || newVisitResult.length === 0) {
        return { success: false, message: "Error al solicitar la visita, no se pudo recuperar." };
    }

    return { success: true, message: "Solicitud de visita enviada exitosamente.", visit: mapDbRowToPropertyVisit(newVisitResult[0]) };

  } catch (error: any) {
    console.error("[VisitAction] Error requesting visit:", error);
    return { success: false, message: `Error al solicitar visita: ${error.message}` };
  }
}


export async function getVisitsForUserAction(
  userId: string,
  type: 'visitor' | 'owner' | 'all_for_user'
): Promise<PropertyVisit[]> {
  if (!userId) return [];

  try {
    let sql = `
      SELECT 
        pv.*,
        p.title as property_title,
        p.slug as property_slug,
        visitor.name as visitor_name,
        visitor.avatar_url as visitor_avatar_url,
        owner.name as owner_name,
        owner.avatar_url as owner_avatar_url
      FROM property_visits pv
      JOIN properties p ON pv.property_id = p.id
      JOIN users visitor ON pv.visitor_user_id = visitor.id
      JOIN users owner ON pv.property_owner_user_id = owner.id
    `;
    const params: string[] = [];

    if (type === 'visitor') {
      sql += ' WHERE pv.visitor_user_id = ? ORDER BY pv.proposed_datetime DESC';
      params.push(userId);
    } else if (type === 'owner') {
      sql += ' WHERE pv.property_owner_user_id = ? ORDER BY pv.proposed_datetime DESC';
      params.push(userId);
    } else if (type === 'all_for_user') { 
      sql += ' WHERE pv.visitor_user_id = ? OR pv.property_owner_user_id = ? ORDER BY pv.created_at DESC';
      params.push(userId, userId);
    } else {
      return []; 
    }

    const rows = await query(sql, params);
    if (!Array.isArray(rows)) {
        console.error("[VisitAction] Expected array from getVisitsForUserAction, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToPropertyVisit);
  } catch (error: any) {
    console.error(`[VisitAction] Error fetching visits for user ${userId} (type: ${type}):`, error);
    return [];
  }
}


export async function updateVisitStatusAction(
  visitId: string,
  currentUserId: string, 
  values: UpdateVisitStatusFormValues
): Promise<{ success: boolean; message?: string; visit?: PropertyVisit }> {
  if (!visitId || !currentUserId) {
    return { success: false, message: "ID de visita o usuario no proporcionado." };
  }

  const validation = updateVisitStatusFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: "Datos inválidos: " + validation.error.errors.map(e => e.message).join(', ') };
  }

  const { new_status, confirmed_datetime, owner_notes, cancellation_reason } = validation.data;

  try {
    const visitRows: any[] = await query('SELECT * FROM property_visits WHERE id = ?', [visitId]);
    if (visitRows.length === 0) {
      return { success: false, message: "Visita no encontrada." };
    }
    const visit = mapDbRowToPropertyVisit(visitRows[0]);

    const isVisitor = visit.visitor_user_id === currentUserId;
    const isOwner = visit.property_owner_user_id === currentUserId;

    if (!isVisitor && !isOwner) {
      return { success: false, message: "No tienes permiso para actualizar esta visita." };
    }
    
    if (new_status === 'cancelled_by_visitor' && !isVisitor) {
        return { success: false, message: "Solo el visitante puede cancelar su propia solicitud de visita." };
    }
    if ((new_status === 'confirmed' || new_status === 'cancelled_by_owner' || new_status === 'rescheduled_by_owner') && !isOwner) {
        return { success: false, message: "Solo el propietario puede gestionar las visitas a su propiedad." };
    }
    
    if (isVisitor && (new_status === 'confirmed' || new_status === 'rescheduled_by_owner')) {
        return { success: false, message: "Los visitantes no pueden confirmar ni reagendar visitas de esta manera." };
    }

    const updateFields: string[] = [];
    const updateParams: (string | Date | null | boolean)[] = [];

    updateFields.push('status = ?');
    updateParams.push(new_status);

    if (new_status === 'confirmed' || new_status === 'rescheduled_by_owner') {
      if (confirmed_datetime) {
        updateFields.push('confirmed_datetime = ?');
        updateParams.push(new Date(confirmed_datetime));
      } else if (new_status === 'confirmed') {
         updateFields.push('confirmed_datetime = ?');
         updateParams.push(new Date(visit.proposed_datetime)); // Confirm with original proposed time if no new time provided
      }
    }
    
    if (owner_notes && isOwner) { 
        updateFields.push('owner_notes = ?');
        updateParams.push(owner_notes);
    }
    
    if (cancellation_reason && (new_status === 'cancelled_by_visitor' || new_status === 'cancelled_by_owner')) {
        updateFields.push('cancellation_reason = ?');
        updateParams.push(cancellation_reason);
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(visitId); 

    const sql = `UPDATE property_visits SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await query(sql, updateParams);

    revalidatePath('/dashboard/visits');
    revalidatePath(`/admin/visits`);

    const updatedVisitResult = await query('SELECT * FROM property_visits WHERE id = ?', [visitId]);
     if (!Array.isArray(updatedVisitResult) || updatedVisitResult.length === 0) {
        return { success: false, message: "Error al actualizar la visita, no se pudo recuperar." };
    }

    return { success: true, message: "Estado de la visita actualizado.", visit: mapDbRowToPropertyVisit(updatedVisitResult[0]) };

  } catch (error: any) {
    console.error(`[VisitAction] Error updating visit ${visitId} status:`, error);
    return { success: false, message: `Error al actualizar estado: ${error.message}` };
  }
}

export async function getVisitByIdAction(
  visitId: string,
  currentUserId: string // Used to check if user is participant, not for admin
): Promise<PropertyVisit | null> {
  if (!visitId || !currentUserId) return null;

  try {
    const sql = `
      SELECT 
        pv.*,
        p.title as property_title,
        p.slug as property_slug,
        visitor.name as visitor_name,
        visitor.avatar_url as visitor_avatar_url,
        owner.name as owner_name,
        owner.avatar_url as owner_avatar_url
      FROM property_visits pv
      JOIN properties p ON pv.property_id = p.id
      JOIN users visitor ON pv.visitor_user_id = visitor.id
      JOIN users owner ON pv.property_owner_user_id = owner.id
      WHERE pv.id = ? 
    `;
    const rows: any[] = await query(sql, [visitId]);

    if (rows.length === 0) {
      return null;
    }
    const visit = mapDbRowToPropertyVisit(rows[0]);

    if (visit.visitor_user_id !== currentUserId && visit.property_owner_user_id !== currentUserId) {
      console.warn(`[VisitAction] Unauthorized attempt to access visit ${visitId} by user ${currentUserId}`);
      return null; 
    }

    return visit;
  } catch (error: any) {
    console.error(`[VisitAction] Error fetching visit by ID ${visitId}:`, error);
    return null;
  }
}

export type AdminVisitsOrderBy = 
  | 'proposed_datetime_desc' | 'proposed_datetime_asc' 
  | 'created_at_desc' | 'created_at_asc' 
  | 'status_asc' | 'status_desc';

interface GetAllVisitsForAdminOptions {
  filterStatus?: PropertyVisitStatus;
  orderBy?: AdminVisitsOrderBy;
}

export async function getAllVisitsForAdminAction(options: GetAllVisitsForAdminOptions = {}): Promise<PropertyVisit[]> {
  const { filterStatus, orderBy = 'created_at_desc' } = options;
  
  try {
    let sql = `
      SELECT 
        pv.*,
        p.title as property_title,
        p.slug as property_slug,
        visitor.name as visitor_name,
        visitor.avatar_url as visitor_avatar_url,
        owner.name as owner_name,
        owner.avatar_url as owner_avatar_url
      FROM property_visits pv
      JOIN properties p ON pv.property_id = p.id
      JOIN users visitor ON pv.visitor_user_id = visitor.id
      JOIN users owner ON pv.property_owner_user_id = owner.id
    `;
    
    const queryParams: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (filterStatus) {
      whereClauses.push('pv.status = ?');
      queryParams.push(filterStatus);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    switch (orderBy) {
      case 'proposed_datetime_desc': sql += ' ORDER BY pv.proposed_datetime DESC'; break;
      case 'proposed_datetime_asc': sql += ' ORDER BY pv.proposed_datetime ASC'; break;
      case 'status_asc': sql += ' ORDER BY pv.status ASC, pv.created_at DESC'; break;
      case 'status_desc': sql += ' ORDER BY pv.status DESC, pv.created_at DESC'; break;
      case 'created_at_asc': sql += ' ORDER BY pv.created_at ASC'; break;
      case 'created_at_desc':
      default: sql += ' ORDER BY pv.created_at DESC'; break;
    }

    const rows = await query(sql, queryParams);
    if (!Array.isArray(rows)) {
        console.error("[VisitAction Admin] Expected array from getAllVisitsForAdminAction query, got:", typeof rows);
        return [];
    }
    return rows.map(mapDbRowToPropertyVisit);
  } catch (error: any) {
    console.error(`[VisitAction Admin] Error fetching all visits:`, error);
    return [];
  }
}

export async function getVisitCountsByStatusForAdmin(): Promise<Record<PropertyVisitStatus, number>> {
  const counts: Record<PropertyVisitStatus, number> = {
    pending_confirmation: 0,
    confirmed: 0,
    cancelled_by_visitor: 0,
    cancelled_by_owner: 0,
    rescheduled_by_owner: 0,
    completed: 0,
    visitor_no_show: 0,
    owner_no_show: 0,
  };
  try {
    const sql = `SELECT status, COUNT(*) as count FROM property_visits GROUP BY status`;
    const rows: any[] = await query(sql);
    rows.forEach(row => {
      if (counts.hasOwnProperty(row.status)) {
        counts[row.status as PropertyVisitStatus] = Number(row.count);
      }
    });
    return counts;
  } catch (error) {
    console.error(`[VisitAction Admin] Error fetching visit counts by status:`, error);
    return counts; // Return default counts on error
  }
}

export async function getBookedTimeSlotsForPropertyOnDateAction(
  propertyId: string,
  date: string // Expected format YYYY-MM-DD
): Promise<string[]> {
  if (!propertyId || !date) {
    console.warn("[VisitAction WARN] getBookedTimeSlots: propertyId o date no proporcionados.");
    return [];
  }
  try {
    const sql = `
      SELECT 
        CASE 
          WHEN status = 'confirmed' AND confirmed_datetime IS NOT NULL THEN TIME_FORMAT(confirmed_datetime, '%H:%i')
          WHEN status = 'pending_confirmation' THEN TIME_FORMAT(proposed_datetime, '%H:%i')
          ELSE NULL 
        END as booked_slot
      FROM property_visits
      WHERE property_id = ?
        AND status IN ('pending_confirmation', 'confirmed')
        AND DATE(
          CASE 
            WHEN status = 'confirmed' AND confirmed_datetime IS NOT NULL THEN confirmed_datetime
            ELSE proposed_datetime 
          END
        ) = ?
      HAVING booked_slot IS NOT NULL;
    `;
    const rows: any[] = await query(sql, [propertyId, date]);
    return rows.map(row => row.booked_slot);
  } catch (error: any) {
    console.error(`[VisitAction ERROR] Error fetching booked time slots for property ${propertyId} on ${date}:`, error.message);
    return []; // Devuelve un array vacío en caso de error para no romper la UI
  }
}
