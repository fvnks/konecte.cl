// src/lib/data/siteSettings.ts

import { db } from '@/lib/db';
import { siteSettings as siteSettingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SiteSettings, LandingSectionKey } from "@/lib/types";

const DEFAULT_SITE_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';
const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
const DEFAULT_ANNOUNCEMENT_BG_COLOR = '#FFB74D';
const DEFAULT_ANNOUNCEMENT_TEXT_COLOR = '#18181b';

/**
 * Fetches site settings directly from the database.
 * This is a direct data access function, NOT a server action.
 * To be used by Server Components.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  let dbSettings: any = null;
  try {
    const result = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1));
    if (result && result.length > 0) {
      dbSettings = result[0];
    }
  } catch (error: any) {
    console.error("[DATA_FETCH_ERROR] Failed to get site settings from DB:", error.message);
    // Fallback to defaults
  }

  let parsedSectionsOrder: LandingSectionKey[] = DEFAULT_SECTIONS_ORDER;
  const validKeys: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
  if (dbSettings && dbSettings.landing_sections_order) {
    try {
      const parsed = JSON.parse(dbSettings.landing_sections_order);
      if (Array.isArray(parsed) && parsed.every(s => validKeys.includes(s as LandingSectionKey)) && parsed.length > 0) {
        parsedSectionsOrder = parsed as LandingSectionKey[];
      }
    } catch (e: any) {
      // Keep default order if parsing fails
    }
  }

  const finalSettings = {
    id: dbSettings?.id || 1,
    siteTitle: dbSettings?.siteTitle === null || dbSettings?.siteTitle === undefined ? DEFAULT_SITE_TITLE : dbSettings.siteTitle,
    logoUrl: dbSettings?.logoUrl === null || dbSettings?.logoUrl === undefined ? null : dbSettings.logoUrl,
    show_featured_listings_section: dbSettings?.show_featured_listings_section === null || dbSettings?.show_featured_listings_section === undefined ? true : Boolean(dbSettings.show_featured_listings_section),
    show_featured_plans_section: dbSettings?.show_featured_plans_section === null || dbSettings?.show_featured_plans_section === undefined ? true : Boolean(dbSettings.show_featured_plans_section),
    show_ai_matching_section: dbSettings?.show_ai_matching_section === null || dbSettings?.show_ai_matching_section === undefined ? true : Boolean(dbSettings.show_ai_matching_section),
    show_google_sheet_section: dbSettings?.show_google_sheet_section === null || dbSettings?.show_google_sheet_section === undefined ? true : Boolean(dbSettings.show_google_sheet_section),
    landing_sections_order: parsedSectionsOrder,
    announcement_bar_text: dbSettings?.announcement_bar_text === null || dbSettings?.announcement_bar_text === undefined ? null : dbSettings.announcement_bar_text,
    announcement_bar_link_url: dbSettings?.announcement_bar_link_url === null || dbSettings?.announcement_bar_link_url === undefined ? null : dbSettings.announcement_bar_link_url,
    announcement_bar_link_text: dbSettings?.announcement_bar_link_text === null || dbSettings?.announcement_bar_link_text === undefined ? null : dbSettings.announcement_bar_link_text,
    announcement_bar_is_active: dbSettings?.announcement_bar_is_active === null || dbSettings?.announcement_bar_is_active === undefined ? false : Boolean(dbSettings.announcement_bar_is_active),
    announcement_bar_bg_color: dbSettings?.announcement_bar_bg_color === null || dbSettings?.announcement_bar_bg_color === undefined ? DEFAULT_ANNOUNCEMENT_BG_COLOR : dbSettings.announcement_bar_bg_color,
    announcement_bar_text_color: dbSettings?.announcement_bar_text_color === null || dbSettings?.announcement_bar_text_color === undefined ? DEFAULT_ANNOUNCEMENT_TEXT_COLOR : dbSettings.announcement_bar_text_color,
    updated_at: dbSettings?.updatedAt ? new Date(dbSettings.updatedAt).toISOString() : undefined,
  };
  
  return finalSettings;
}
