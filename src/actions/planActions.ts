
// src/actions/planActions.ts
'use server';

import { query } from '@/lib/db';
import type { Plan } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const parseNullableIntFromDb = (value: any): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  const num = parseInt(String(value), 10);
  return isNaN(num) ? null : num;
};

function mapDbRowToPlan(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price_monthly: parseFloat(row.price_monthly),
    price_currency: row.price_currency,
    max_properties_allowed: parseNullableIntFromDb(row.max_properties_allowed),
    max_requests_allowed: parseNullableIntFromDb(row.max_requests_allowed),
    max_ai_searches_monthly: parseNullableIntFromDb(row.max_ai_searches_monthly),
    property_listing_duration_days: parseNullableIntFromDb(row.property_listing_duration_days),
    can_feature_properties: Boolean(row.can_feature_properties),
    // Nuevos campos mapeados
    can_view_contact_data: Boolean(row.can_view_contact_data),
    manual_searches_daily_limit: parseNullableIntFromDb(row.manual_searches_daily_limit),
    automated_alerts_enabled: Boolean(row.automated_alerts_enabled), // Reemplaza whatsapp_bot_enabled
    advanced_dashboard_access: Boolean(row.advanced_dashboard_access),
    daily_profile_views_limit: parseNullableIntFromDb(row.daily_profile_views_limit),
    weekly_matches_reveal_limit: parseNullableIntFromDb(row.weekly_matches_reveal_limit),
    is_enterprise_plan: Boolean(row.is_enterprise_plan),

    is_active: Boolean(row.is_active),
    is_publicly_visible: row.is_publicly_visible === null || row.is_publicly_visible === undefined ? true : Boolean(row.is_publicly_visible),
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}


export async function getPlansAction(options: { showAllAdmin?: boolean } = {}): Promise<Plan[]> {
  const { showAllAdmin = false } = options;
  try {
    let sql = 'SELECT * FROM plans';
    const whereClauses: string[] = [];

    if (!showAllAdmin) {
      whereClauses.push('is_active = TRUE');
      whereClauses.push('is_publicly_visible = TRUE');
    }
    
    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY price_monthly ASC, name ASC';
    
    const rows = await query(sql);
    return rows.map(mapDbRowToPlan);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return [];
  }
}

export async function getPlanByIdAction(planId: string): Promise<Plan | null> {
  if (!planId) {
    return null;
  }
  try {
    const rows = await query('SELECT * FROM plans WHERE id = ?', [planId]);
    if (rows.length > 0) {
      return mapDbRowToPlan(rows[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error al obtener el plan con ID ${planId}:`, error);
    return null;
  }
}

export async function addPlanAction(formData: FormData): Promise<{ success: boolean; message?: string; plan?: Plan }> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  const price_monthly_str = formData.get('price_monthly') as string;
  const price_currency = formData.get('price_currency') as string || 'CLP';
  
  const max_properties_allowed_str = formData.get('max_properties_allowed') as string | null;
  const max_requests_allowed_str = formData.get('max_requests_allowed') as string | null;
  const property_listing_duration_days_str = formData.get('property_listing_duration_days') as string | null;
  const can_feature_properties = formData.get('can_feature_properties') === 'on';
  
  const can_view_contact_data = formData.get('can_view_contact_data') === 'on';
  const manual_searches_daily_limit_str = formData.get('manual_searches_daily_limit') as string | null;
  const automated_alerts_enabled = formData.get('automated_alerts_enabled') === 'on';
  const max_ai_searches_monthly_str = formData.get('max_ai_searches_monthly') as string | null;
  const advanced_dashboard_access = formData.get('advanced_dashboard_access') === 'on';
  const daily_profile_views_limit_str = formData.get('daily_profile_views_limit') as string | null;
  const weekly_matches_reveal_limit_str = formData.get('weekly_matches_reveal_limit') as string | null;

  const is_active = formData.get('is_active') === 'on';
  const is_publicly_visible = formData.get('is_publicly_visible') === 'on';
  const is_enterprise_plan = formData.get('is_enterprise_plan') === 'on';

  if (!name) {
    return { success: false, message: "El nombre del plan es requerido." };
  }
  const price_monthly = parseFloat(price_monthly_str);
  if (isNaN(price_monthly) || price_monthly < 0) {
    return { success: false, message: "El precio mensual debe ser un número válido no negativo." };
  }
  
  const parseNullableInt = (valStr: string | null): number | null => valStr && valStr.trim() !== '' ? parseInt(valStr, 10) : null;

  const max_properties_allowed = parseNullableInt(max_properties_allowed_str);
  const max_requests_allowed = parseNullableInt(max_requests_allowed_str);
  const property_listing_duration_days = parseNullableInt(property_listing_duration_days_str);
  const manual_searches_daily_limit = parseNullableInt(manual_searches_daily_limit_str);
  const max_ai_searches_monthly = parseNullableInt(max_ai_searches_monthly_str);
  const daily_profile_views_limit = parseNullableInt(daily_profile_views_limit_str);
  const weekly_matches_reveal_limit = parseNullableInt(weekly_matches_reveal_limit_str);

  const allLimitsAreValid = [
    max_properties_allowed, max_requests_allowed, property_listing_duration_days,
    manual_searches_daily_limit, max_ai_searches_monthly, daily_profile_views_limit, weekly_matches_reveal_limit
  ].every(limit => limit === null || (!isNaN(limit) && limit >= 0));

  if (!allLimitsAreValid) {
    return { success: false, message: "Los límites numéricos deben ser números válidos no negativos si se especifican, o dejados en blanco para ilimitado/indefinido." };
  }

  try {
    const planId = randomUUID();
    const sql = `
      INSERT INTO plans (
        id, name, description, price_monthly, price_currency,
        max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties,
        can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly,
        advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit,
        is_active, is_publicly_visible, is_enterprise_plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      planId, name, description || null, price_monthly, price_currency,
      max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties,
      can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly,
      advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit,
      is_active, is_publicly_visible, is_enterprise_plan
    ]);
    
    revalidatePath('/admin/plans');
    revalidatePath('/admin/users'); 
    revalidatePath('/plans');

    const newPlan: Plan = {
      id: planId, name, description, price_monthly, price_currency,
      max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties,
      can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly,
      advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit,
      is_active, is_publicly_visible, is_enterprise_plan
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

export async function updatePlanAction(planId: string, formData: FormData): Promise<{ success: boolean; message?: string; plan?: Plan }> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  const price_monthly_str = formData.get('price_monthly') as string;
  const price_currency = formData.get('price_currency') as string || 'CLP';

  const max_properties_allowed_str = formData.get('max_properties_allowed') as string | null;
  const max_requests_allowed_str = formData.get('max_requests_allowed') as string | null;
  const property_listing_duration_days_str = formData.get('property_listing_duration_days') as string | null;
  const can_feature_properties = formData.get('can_feature_properties') === 'on';

  const can_view_contact_data = formData.get('can_view_contact_data') === 'on';
  const manual_searches_daily_limit_str = formData.get('manual_searches_daily_limit') as string | null;
  const automated_alerts_enabled = formData.get('automated_alerts_enabled') === 'on';
  const max_ai_searches_monthly_str = formData.get('max_ai_searches_monthly') as string | null;
  const advanced_dashboard_access = formData.get('advanced_dashboard_access') === 'on';
  const daily_profile_views_limit_str = formData.get('daily_profile_views_limit') as string | null;
  const weekly_matches_reveal_limit_str = formData.get('weekly_matches_reveal_limit') as string | null;

  const is_active = formData.get('is_active') === 'on';
  const is_publicly_visible = formData.get('is_publicly_visible') === 'on';
  const is_enterprise_plan = formData.get('is_enterprise_plan') === 'on';

  if (!planId) {
    return { success: false, message: "ID de plan no proporcionado para la actualización." };
  }
  if (!name) {
    return { success: false, message: "El nombre del plan es requerido." };
  }
  const price_monthly = parseFloat(price_monthly_str);
  if (isNaN(price_monthly) || price_monthly < 0) {
    return { success: false, message: "El precio mensual debe ser un número válido no negativo." };
  }
  
  const parseNullableInt = (valStr: string | null): number | null => valStr && valStr.trim() !== '' ? parseInt(valStr, 10) : null;

  const max_properties_allowed = parseNullableInt(max_properties_allowed_str);
  const max_requests_allowed = parseNullableInt(max_requests_allowed_str);
  const property_listing_duration_days = parseNullableInt(property_listing_duration_days_str);
  const manual_searches_daily_limit = parseNullableInt(manual_searches_daily_limit_str);
  const max_ai_searches_monthly = parseNullableInt(max_ai_searches_monthly_str);
  const daily_profile_views_limit = parseNullableInt(daily_profile_views_limit_str);
  const weekly_matches_reveal_limit = parseNullableInt(weekly_matches_reveal_limit_str);
  
  const allLimitsAreValid = [
    max_properties_allowed, max_requests_allowed, property_listing_duration_days,
    manual_searches_daily_limit, max_ai_searches_monthly, daily_profile_views_limit, weekly_matches_reveal_limit
  ].every(limit => limit === null || (!isNaN(limit) && limit >= 0));

  if (!allLimitsAreValid) {
    return { success: false, message: "Los límites numéricos deben ser números válidos no negativos si se especifican, o dejados en blanco para ilimitado/indefinido." };
  }
  
  try {
    const sql = `
      UPDATE plans SET
        name = ?, description = ?, price_monthly = ?, price_currency = ?,
        max_properties_allowed = ?, max_requests_allowed = ?, property_listing_duration_days = ?, can_feature_properties = ?,
        can_view_contact_data = ?, manual_searches_daily_limit = ?, automated_alerts_enabled = ?, max_ai_searches_monthly = ?,
        advanced_dashboard_access = ?, daily_profile_views_limit = ?, weekly_matches_reveal_limit = ?,
        is_active = ?, is_publicly_visible = ?, is_enterprise_plan = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const result: any = await query(sql, [
      name, description || null, price_monthly, price_currency,
      max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties,
      can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly,
      advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit,
      is_active, is_publicly_visible, is_enterprise_plan, planId
    ]);

    if (result.affectedRows === 0) {
        return { success: false, message: "Plan no encontrado o los datos eran los mismos." };
    }
    
    revalidatePath('/admin/plans');
    revalidatePath('/admin/users');
    revalidatePath('/plans');

    const updatedPlan = await getPlanByIdAction(planId);
    if (!updatedPlan) {
        return { success: false, message: "Plan actualizado, pero no se pudo recuperar para confirmación."}
    }

    return { success: true, message: "Plan actualizado exitosamente.", plan: updatedPlan };
  } catch (error: any) {
    console.error(`Error al actualizar plan ${planId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes("'plans.name'")) {
      return { success: false, message: "Error: Ya existe otro plan con ese nombre." };
    }
    return { success: false, message: `Error al actualizar plan: ${error.message}` };
  }
}


export async function deletePlanAction(planId: string): Promise<{ success: boolean; message?: string }> {
  if (!planId) {
    return { success: false, message: "ID de plan no proporcionado." };
  }

  try {
    // Primero, desvincular usuarios del plan (establecer plan_id a NULL)
    await query('UPDATE users SET plan_id = NULL WHERE plan_id = ?', [planId]);
    // Luego, desvincular registros de uso del plan (establecer plan_id_at_usage a NULL)
    await query('UPDATE user_usage_metrics SET plan_id_at_usage = NULL WHERE plan_id_at_usage = ?', [planId]);

    const result: any = await query('DELETE FROM plans WHERE id = ?', [planId]);
    if (result.affectedRows > 0) {
      revalidatePath('/admin/plans');
      revalidatePath('/admin/users');
      revalidatePath('/plans');
      return { success: true, message: "Plan eliminado exitosamente y usuarios/registros de uso desvinculados." };
    } else {
      return { success: false, message: "El plan no fue encontrado o no se pudo eliminar." };
    }
  } catch (error: any)
{
    console.error("Error al eliminar plan:", error);
    // ER_ROW_IS_REFERENCED_2 es un código de error común para FK violations.
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || (error.sqlState === '23000' && error.message && error.message.includes('foreign key constraint fails'))) { 
        // Este error puede ocurrir si todavía hay una FK en user_usage_metrics que no se pudo setear a NULL
        // o si hay otras tablas que referencian `plans` y no se manejaron.
        return { success: false, message: "Error de referencia: No se puede eliminar el plan porque aún está referenciado en alguna tabla (posiblemente user_usage_metrics). Contacte al administrador o asegúrese que todas las dependencias se hayan actualizado para permitir NULL." };
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
    revalidatePath('/plans');
    return { success: true, message: `Plan ${isActive ? 'activado' : 'desactivado'} correctamente.` };
  } catch (error: any) {
    console.error("Error al cambiar estado del plan:", error);
    return { success: false, message: `Error al cambiar estado del plan: ${error.message}` };
  }
}

export async function togglePlanVisibilityAction(planId: string, isVisible: boolean): Promise<{ success: boolean; message?: string }> {
  if (!planId) {
    return { success: false, message: "ID de plan no proporcionado." };
  }
  try {
    await query('UPDATE plans SET is_publicly_visible = ? WHERE id = ?', [isVisible, planId]);
    revalidatePath('/admin/plans');
    revalidatePath('/plans');
    return { success: true, message: `Visibilidad pública del plan ${isVisible ? 'activada' : 'desactivada'}.` };
  } catch (error: any) {
    console.error("Error al cambiar visibilidad del plan:", error);
    return { success: false, message: `Error al cambiar visibilidad del plan: ${error.message}` };
  }
}

