import { db } from '@/lib/db';
import { plans } from '@/lib/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import type { Plan } from '@/lib/types';

// NOTE: This file contains direct data access functions.

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
    price_monthly: row.price_monthly ? parseFloat(row.price_monthly) : 0,
    price_currency: row.price_currency,
    max_properties_allowed: parseNullableIntFromDb(row.max_properties_allowed),
    max_requests_allowed: parseNullableIntFromDb(row.max_requests_allowed),
    max_ai_searches_monthly: parseNullableIntFromDb(row.max_ai_searches_monthly),
    property_listing_duration_days: parseNullableIntFromDb(row.property_listing_duration_days),
    can_feature_properties: Boolean(row.can_feature_properties),
    can_view_contact_data: Boolean(row.can_view_contact_data),
    manual_searches_daily_limit: parseNullableIntFromDb(row.manual_searches_daily_limit),
    automated_alerts_enabled: Boolean(row.automated_alerts_enabled),
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


export async function getPlans(options: { showAllAdmin?: boolean } = {}): Promise<Plan[]> {
  const { showAllAdmin = false } = options;
  try {
    const whereCondition = !showAllAdmin
      ? and(
          eq(plans.is_active, true),
          eq(plans.is_publicly_visible, true)
        )
      : undefined;
    
    const rows = await db.select().from(plans)
      .where(whereCondition)
      .orderBy(asc(plans.price_monthly), asc(plans.name));

    return rows.map(mapDbRowToPlan);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
} 