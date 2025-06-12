
// src/actions/siteSettingsActions.ts
'use server';

import type { SiteSettings, LandingSectionKey } from "@/lib/types";
import { query } from '@/lib/db';
import { revalidatePath } from "next/cache";

const DEFAULT_SITE_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';
const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "ai_matching", "google_sheet"];

export async function saveSiteSettingsAction(settings: Omit<SiteSettings, 'id' | 'updated_at'>): Promise<{ success: boolean; message?: string }> {
  try {
    const { 
        siteTitle, 
        logoUrl,
        show_featured_listings_section,
        show_ai_matching_section,
        show_google_sheet_section,
        landing_sections_order 
    } = settings;

    const sectionsOrderJson = landing_sections_order ? JSON.stringify(landing_sections_order) : JSON.stringify(DEFAULT_SECTIONS_ORDER);

    const sql = `
      INSERT INTO site_settings (
        id, site_title, logo_url, 
        show_featured_listings_section, show_ai_matching_section, show_google_sheet_section,
        landing_sections_order
      )
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        site_title = VALUES(site_title),
        logo_url = VALUES(logo_url),
        show_featured_listings_section = VALUES(show_featured_listings_section),
        show_ai_matching_section = VALUES(show_ai_matching_section),
        show_google_sheet_section = VALUES(show_google_sheet_section),
        landing_sections_order = VALUES(landing_sections_order),
        updated_at = CURRENT_TIMESTAMP
    `;
    await query(sql, [
        siteTitle || DEFAULT_SITE_TITLE, 
        logoUrl || null,
        show_featured_listings_section === undefined ? true : Boolean(show_featured_listings_section),
        show_ai_matching_section === undefined ? true : Boolean(show_ai_matching_section),
        show_google_sheet_section === undefined ? true : Boolean(show_google_sheet_section),
        sectionsOrderJson
    ]);
    
    revalidatePath('/'); 
    revalidatePath('/admin/appearance');
    
    return { success: true, message: "Configuración del sitio guardada exitosamente." };
  } catch (error: any) {
    console.error("Error al guardar la configuración del sitio en la BD:", error);
    return { success: false, message: `Error al guardar la configuración: ${error.message}` };
  }
}

export async function getSiteSettingsAction(): Promise<SiteSettings> {
  try {
    const result = await query(`
        SELECT 
            id, site_title as siteTitle, logo_url as logoUrl, 
            show_featured_listings_section, show_ai_matching_section, show_google_sheet_section, 
            landing_sections_order,
            updated_at as updatedAt 
        FROM site_settings WHERE id = 1
    `);
    if (result && result.length > 0) {
      const dbSettings = result[0];
      let parsedSectionsOrder: LandingSectionKey[] | null = DEFAULT_SECTIONS_ORDER;
      if (dbSettings.landing_sections_order) {
        try {
          parsedSectionsOrder = JSON.parse(dbSettings.landing_sections_order);
          if (!Array.isArray(parsedSectionsOrder) || !parsedSectionsOrder.every(s => typeof s === 'string')) {
            // Fallback if parsing gives wrong type
            console.warn("landing_sections_order from DB is not a valid string array, using default.");
            parsedSectionsOrder = DEFAULT_SECTIONS_ORDER;
          }
        } catch (e) {
          console.error("Error parsing landing_sections_order from DB, using default:", e);
          parsedSectionsOrder = DEFAULT_SECTIONS_ORDER;
        }
      }

      return {
        id: dbSettings.id,
        siteTitle: dbSettings.siteTitle === null ? DEFAULT_SITE_TITLE : dbSettings.siteTitle,
        logoUrl: dbSettings.logoUrl === undefined ? null : dbSettings.logoUrl,
        show_featured_listings_section: dbSettings.show_featured_listings_section === null || dbSettings.show_featured_listings_section === undefined ? true : Boolean(dbSettings.show_featured_listings_section),
        show_ai_matching_section: dbSettings.show_ai_matching_section === null || dbSettings.show_ai_matching_section === undefined ? true : Boolean(dbSettings.show_ai_matching_section),
        show_google_sheet_section: dbSettings.show_google_sheet_section === null || dbSettings.show_google_sheet_section === undefined ? true : Boolean(dbSettings.show_google_sheet_section),
        landing_sections_order: parsedSectionsOrder,
        updated_at: dbSettings.updatedAt ? new Date(dbSettings.updatedAt).toISOString() : undefined,
      };
    }
  } catch (error) {
    console.error("Error al obtener la configuración del sitio desde la BD:", error);
  }
  // Default settings if no config found or error
  return {
    id: 1,
    siteTitle: DEFAULT_SITE_TITLE,
    logoUrl: null,
    show_featured_listings_section: true,
    show_ai_matching_section: true,
    show_google_sheet_section: true,
    landing_sections_order: DEFAULT_SECTIONS_ORDER,
  };
}

```