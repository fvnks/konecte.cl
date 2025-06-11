
// src/actions/siteSettingsActions.ts
'use server';

import type { SiteSettings } from "@/lib/types";
import { query } from '@/lib/db';
import { revalidatePath } from "next/cache";

const DEFAULT_SITE_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';

export async function saveSiteSettingsAction(settings: Omit<SiteSettings, 'id' | 'updated_at'>): Promise<{ success: boolean; message?: string }> {
  try {
    const { 
        siteTitle, 
        logoUrl,
        show_featured_listings_section,
        show_ai_matching_section,
        show_google_sheet_section 
    } = settings;

    const sql = `
      INSERT INTO site_settings (
        id, site_title, logo_url, 
        show_featured_listings_section, show_ai_matching_section, show_google_sheet_section
      )
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        site_title = VALUES(site_title),
        logo_url = VALUES(logo_url),
        show_featured_listings_section = VALUES(show_featured_listings_section),
        show_ai_matching_section = VALUES(show_ai_matching_section),
        show_google_sheet_section = VALUES(show_google_sheet_section),
        updated_at = CURRENT_TIMESTAMP
    `;
    await query(sql, [
        siteTitle || DEFAULT_SITE_TITLE, 
        logoUrl || null,
        show_featured_listings_section === undefined ? true : Boolean(show_featured_listings_section),
        show_ai_matching_section === undefined ? true : Boolean(show_ai_matching_section),
        show_google_sheet_section === undefined ? true : Boolean(show_google_sheet_section)
    ]);
    
    revalidatePath('/'); 
    revalidatePath('/admin/appearance');
    
    // Inform Navbar to update by dispatching a custom event or by revalidating a specific layout path
    // For simplicity, components relying on this (like Navbar or Page) will refetch on their own
    // due to revalidatePath('/') or specific data fetching patterns.
    // Can trigger a custom storage event to prompt other tabs (like Navbar) to update settings
    // localStorage.setItem('siteSettingsLastUpdated', Date.now().toString()); // Example only, requires client-side handling

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
            updated_at as updatedAt 
        FROM site_settings WHERE id = 1
    `);
    if (result && result.length > 0) {
      const dbSettings = result[0];
      return {
        id: dbSettings.id,
        siteTitle: dbSettings.siteTitle === null ? DEFAULT_SITE_TITLE : dbSettings.siteTitle,
        logoUrl: dbSettings.logoUrl === undefined ? null : dbSettings.logoUrl,
        // For boolean flags, if column doesn't exist (undefined) or is NULL, default to true
        show_featured_listings_section: dbSettings.show_featured_listings_section === null || dbSettings.show_featured_listings_section === undefined ? true : Boolean(dbSettings.show_featured_listings_section),
        show_ai_matching_section: dbSettings.show_ai_matching_section === null || dbSettings.show_ai_matching_section === undefined ? true : Boolean(dbSettings.show_ai_matching_section),
        show_google_sheet_section: dbSettings.show_google_sheet_section === null || dbSettings.show_google_sheet_section === undefined ? true : Boolean(dbSettings.show_google_sheet_section),
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
  };
}
