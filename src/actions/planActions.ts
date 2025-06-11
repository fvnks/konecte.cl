
// src/actions/planActions.ts
'use server';

import { query } from '@/lib/db';
import type { Plan } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

// Helper to map DB row to Plan object, converting boolean-like numbers to booleans
function mapDbRowToPlan(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price_monthly: parseFloat(row.price_monthly),
    price_currency: row.price_currency,
    max_properties_allowed: row.max_properties_allowed !== null ? parseInt(row.max_properties_allowed, 10) : null,
    max_requests_allowed: row.max_requests_allowed !== null ? parseInt(row.max_requests_allowed, 10) : null,
    can_feature_properties: Boolean(row.can_feature_properties),
    property_listing_duration_days: row.property_listing_duration_days !== null ? parseInt(row.property_listing_duration_days, 10) : null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}


export async function getPlansAction(): Promise<Plan[]> {
  try {
    const rows = await query('SELECT * FROM plans ORDER BY price_monthly ASC, name ASC');
    return rows.map(mapDbRowToPlan);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return [];
  }
}

export async function addPlanAction(formData: FormData): Promise<{ success: boolean; message?: string; plan?: Plan }> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  const price_monthly_str = formData.get('price_monthly') as string;
  const price_currency = formData.get('price_currency') as string || 'CLP';
  const max_properties_allowed_str = formData.get('max_properties_allowed') as string | null;
  const max_requests_allowed_str = formData.get('max_requests_allowed') as string | null;
  const can_feature_properties = formData.get('can_feature_properties') === 'on'; // Checkbox value
  const property_listing_duration_days_str = formData.get('property_listing_duration_days') as string | null;
  const is_active = formData.get('is_active') === 'on'; // Checkbox value

  if (!name) {
    return { success: false, message: "El nombre del plan es requerido." };
  }

  const price_monthly = parseFloat(price_monthly_str);
  if (isNaN(price_monthly) || price_monthly < 0) {
    return { success: false, message: "El precio mensual debe ser un número válido no negativo." };
  }
  
  const max_properties_allowed = max_properties_allowed_str && max_properties_allowed_str.trim() !== '' ? parseInt(max_properties_allowed_str, 10) : null;
  const max_requests_allowed = max_requests_allowed_str && max_requests_allowed_str.trim() !== '' ? parseInt(max_requests_allowed_str, 10) : null;
  const property_listing_duration_days = property_listing_duration_days_str && property_listing_duration_days_str.trim() !== '' ? parseInt(property_listing_duration_days_str, 10) : null;

  if ((max_properties_allowed_str && max_properties_allowed_str.trim() !== '' && (isNaN(max_properties_allowed!) || max_properties_allowed! < 0)) ||
      (max_requests_allowed_str && max_requests_allowed_str.trim() !== '' && (isNaN(max_requests_allowed!) || max_requests_allowed! < 0)) ||
      (property_listing_duration_days_str && property_listing_duration_days_str.trim() !== '' && (isNaN(property_listing_duration_days!) || property_listing_duration_days! < 0))) {
    return { success: false, message: "Los límites y duración deben ser números válidos no negativos si se especifican, o dejados en blanco para ilimitado/indefinido." };
  }


  try {
    const planId = randomUUID();
    const sql = `
      INSERT INTO plans (
        id, name, description, price_monthly, price_currency,
        max_properties_allowed, max_requests_allowed, can_feature_properties,
        property_listing_duration_days, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      planId, name, description || null, price_monthly, price_currency,
      max_properties_allowed, max_requests_allowed, can_feature_properties,
      property_listing_duration_days, is_active
    ]);
    
    revalidatePath('/admin/plans');
    revalidatePath('/admin/users'); // Users page might show plan names

    const newPlan: Plan = {
      id: planId, name, description, price_monthly, price_currency,
      max_properties_allowed, max_requests_allowed, can_feature_properties,
      property_listing_duration_days, is_active
    };
    return { success: true, message: "Plan añadido exitosamente.", plan: newPlan };
  } catch (error: any) {
    console.error("Error al añadir plan:", error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes("'plans.name'")) {
      return { success: false, message: "Error: Ya existe un plan con ese nombre." };
    }
    return { success: false, message: `Error al añadir plan: ${error.message}` };
  }
}

// TODO: Implementar updatePlanAction
export async function updatePlanAction(planId: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
  console.log("updatePlanAction called for ID:", planId, "Data:", formData);
  // Implementar la lógica de actualización aquí, similar a addPlanAction pero con UPDATE SQL.
  // Validar datos, construir la consulta SQL, ejecutarla y revalidar paths.
  return { success: false, message: "Funcionalidad de actualizar plan aún no implementada." };
}

export async function deletePlanAction(planId: string): Promise<{ success: boolean; message?: string }> {
  if (!planId) {
    return { success: false, message: "ID de plan no proporcionado." };
  }

  try {
    // Desvincular usuarios del plan. La FK en users es ON DELETE SET NULL,
    // pero es más explícito y seguro hacerlo así también.
    await query('UPDATE users SET plan_id = NULL WHERE plan_id = ?', [planId]);

    const result: any = await query('DELETE FROM plans WHERE id = ?', [planId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/plans');
      revalidatePath('/admin/users');
      return { success: true, message: "Plan eliminado exitosamente y usuarios desvinculados." };
    } else {
      return { success: false, message: "El plan no fue encontrado o no se pudo eliminar." };
    }
  } catch (error: any)
{
    console.error("Error al eliminar plan:", error);
    // ER_ROW_IS_REFERENCED_2 puede ocurrir si hay otras restricciones, aunque no debería con users.plan_id ON DELETE SET NULL
    if (error.code === 'ER_ROW_IS_REFERENCED_2') { 
        return { success: false, message: "Error de referencia: No se puede eliminar el plan porque aún está referenciado en otra tabla (que no es 'users' para plan_id). Contacte al administrador." };
    }
    return { success: false, message: `Error al eliminar plan: ${error.message}` };
  }
}

export async function togglePlanStatusAction(planId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
  if (!planId) {
    return { success: false, message: "ID de plan no proporcionado." };
  }
  try {
    await query('UPDATE plans SET is_active = ? WHERE id = ?', [isActive, planId]);
    revalidatePath('/admin/plans');
    return { success: true, message: `Plan ${isActive ? 'activado' : 'desactivado'} correctamente.` };
  } catch (error: any) {
    console.error("Error al cambiar estado del plan:", error);
    return { success: false, message: `Error al cambiar estado del plan: ${error.message}` };
  }
}
