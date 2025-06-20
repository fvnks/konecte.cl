
// src/actions/siteSettingsActions.ts
'use server';

import type { SiteSettings, LandingSectionKey } from "@/lib/types";
import { query } from '@/lib/db';
import { revalidatePath } from "next/cache";

const DEFAULT_SITE_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';
const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
const DEFAULT_ANNOUNCEMENT_BG_COLOR = '#FFB74D'; // Accent
const DEFAULT_ANNOUNCEMENT_TEXT_COLOR = '#18181b'; // Dark foreground

export async function saveSiteSettingsAction(settings: Omit<SiteSettings, 'id' | 'updated_at'>): Promise<{ success: boolean; message?: string }> {
  console.log("[SiteSettingsAction_Save_Start] Attempting to save site settings:", settings);
  try {
    const { 
        siteTitle, 
        logoUrl,
        show_featured_listings_section,
        show_featured_plans_section, // Nueva propiedad
        show_ai_matching_section,
        show_google_sheet_section,
        landing_sections_order,
        announcement_bar_text,
        announcement_bar_link_url,
        announcement_bar_link_text,
        announcement_bar_is_active,
        announcement_bar_bg_color,
        announcement_bar_text_color
    } = settings;

    const validSectionsOrder = Array.isArray(landing_sections_order) && landing_sections_order.length > 0
                             ? landing_sections_order
                             : DEFAULT_SECTIONS_ORDER;
    const sectionsOrderJson = JSON.stringify(validSectionsOrder);

    const sql = `
      INSERT INTO site_settings (
        id, site_title, logo_url, 
        show_featured_listings_section, show_featured_plans_section, show_ai_matching_section, show_google_sheet_section,
        landing_sections_order,
        announcement_bar_text, announcement_bar_link_url, announcement_bar_link_text,
        announcement_bar_is_active, announcement_bar_bg_color, announcement_bar_text_color
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        site_title = VALUES(site_title),
        logo_url = VALUES(logo_url),
        show_featured_listings_section = VALUES(show_featured_listings_section),
        show_featured_plans_section = VALUES(show_featured_plans_section),
        show_ai_matching_section = VALUES(show_ai_matching_section),
        show_google_sheet_section = VALUES(show_google_sheet_section),
        landing_sections_order = VALUES(landing_sections_order),
        announcement_bar_text = VALUES(announcement_bar_text),
        announcement_bar_link_url = VALUES(announcement_bar_link_url),
        announcement_bar_link_text = VALUES(announcement_bar_link_text),
        announcement_bar_is_active = VALUES(announcement_bar_is_active),
        announcement_bar_bg_color = VALUES(announcement_bar_bg_color),
        announcement_bar_text_color = VALUES(announcement_bar_text_color),
        updated_at = CURRENT_TIMESTAMP
    `;
    console.time("[SiteSettingsAction_Save_QueryTime]");
    await query(sql, [
        siteTitle || DEFAULT_SITE_TITLE, 
        logoUrl || null,
        show_featured_listings_section === undefined ? true : Boolean(show_featured_listings_section),
        show_featured_plans_section === undefined ? true : Boolean(show_featured_plans_section), // Nueva propiedad
        show_ai_matching_section === undefined ? true : Boolean(show_ai_matching_section),
        show_google_sheet_section === undefined ? true : Boolean(show_google_sheet_section),
        sectionsOrderJson,
        announcement_bar_text || null,
        announcement_bar_link_url || null,
        announcement_bar_link_text || null,
        Boolean(announcement_bar_is_active),
        announcement_bar_bg_color || DEFAULT_ANNOUNCEMENT_BG_COLOR,
        announcement_bar_text_color || DEFAULT_ANNOUNCEMENT_TEXT_COLOR
    ]);
    console.timeEnd("[SiteSettingsAction_Save_QueryTime]");
    
    revalidatePath('/'); 
    revalidatePath('/admin/appearance');
    console.log("[SiteSettingsAction_Save_Success] Settings saved and paths revalidated.");
    return { success: true, message: "Configuración del sitio guardada exitosamente." };
  } catch (error: any) {
    console.error("[SiteSettingsAction_Save_Error] Error al guardar la configuración del sitio en la BD:", error.message, error.stack);
    return { success: false, message: `Error al guardar la configuración: ${error.message}` };
  }
}

export async function getSiteSettingsAction(): Promise<SiteSettings> {
  console.log("[SiteSettingsAction_Get_Start] Attempting to fetch site settings.");
  console.time("[SiteSettingsAction_Get_TotalTime]");
  let dbSettings: any = null;
  try {
    console.time("[SiteSettingsAction_Get_QueryTime]");
    const result = await query(`
        SELECT 
            id, site_title as siteTitle, logo_url as logoUrl, 
            show_featured_listings_section, show_featured_plans_section, show_ai_matching_section, show_google_sheet_section, 
            landing_sections_order,
            announcement_bar_text, announcement_bar_link_url, announcement_bar_link_text,
            announcement_bar_is_active, announcement_bar_bg_color, announcement_bar_text_color,
            updated_at as updatedAt 
        FROM site_settings WHERE id = 1
    `);
    console.timeEnd("[SiteSettingsAction_Get_QueryTime]");
    if (result && result.length > 0) {
      dbSettings = result[0];
      console.log("[SiteSettingsAction_Get_DbResult] Successfully fetched settings from DB:", dbSettings);
    } else {
      console.log("[SiteSettingsAction_Get_DbResult] No settings found in DB, will use defaults.");
    }
  } catch (error: any) {
    console.error("[SiteSettingsAction_Get_Error] Error al obtener la configuración del sitio desde la BD:", error.message, error.stack);
    // If the query fails (e.g., column not found), dbSettings will remain null
    // and we'll fall back to defaults.
  }

  let parsedSectionsOrder: LandingSectionKey[] = DEFAULT_SECTIONS_ORDER;
  const validKeys: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
  if (dbSettings && dbSettings.landing_sections_order) {
    try {
      const parsed = JSON.parse(dbSettings.landing_sections_order);
      if (Array.isArray(parsed) && parsed.every(s => validKeys.includes(s as LandingSectionKey)) && parsed.length > 0) {
        parsedSectionsOrder = parsed as LandingSectionKey[];
      } else {
        console.warn("[SiteSettingsAction_Get_ParseWarn] landing_sections_order desde BD es inválido o vacío, usando orden por defecto. Valor:", dbSettings.landing_sections_order);
      }
    } catch (e: any) {
      console.error("[SiteSettingsAction_Get_ParseError] Error al parsear landing_sections_order desde la BD, usando orden por defecto:", e, "Valor:", dbSettings.landing_sections_order);
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
  console.log("[SiteSettingsAction_Get_Final] Final settings object:", finalSettings);
  console.timeEnd("[SiteSettingsAction_Get_TotalTime]");
  return finalSettings;
}

// Helper to get a specific setting, falling back to default if not configured
// This is an example if you needed to fetch just one setting often, though getSiteSettingsAction gets all
export async function getSpecificSiteSetting<K extends keyof SiteSettings>(
  key: K,
  defaultValue: SiteSettings[K]
): Promise<SiteSettings[K]> {
  const settings = await getSiteSettingsAction();
  if (settings && settings[key] !== undefined && settings[key] !== null) {
    return settings[key]!; // Non-null assertion because we checked undefined/null
  }
  return defaultValue;
}
