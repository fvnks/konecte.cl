
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

    // Asegurar que landing_sections_order sea un array válido, sino usar el por defecto
    const validSectionsOrder = Array.isArray(landing_sections_order) && landing_sections_order.length > 0
                             ? landing_sections_order
                             : DEFAULT_SECTIONS_ORDER;
    const sectionsOrderJson = JSON.stringify(validSectionsOrder);

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
    
    // Disparar un evento para el Navbar (si es necesario para Client Components)
    // Para Server Components, revalidation es suficiente.
    // if (typeof window !== 'undefined') {
    //   window.dispatchEvent(new CustomEvent('siteSettingsUpdated'));
    // }

    return { success: true, message: "Configuración del sitio guardada exitosamente." };
  } catch (error: any) {
    console.error("Error al guardar la configuración del sitio en la BD:", error);
    return { success: false, message: `Error al guardar la configuración: ${error.message}` };
  }
}

export async function getSiteSettingsAction(): Promise<SiteSettings> {
  let dbSettings: any = null;
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
      dbSettings = result[0];
    }
  } catch (error) {
    console.error("Error al obtener la configuración del sitio desde la BD:", error);
    // Continuar para devolver los valores por defecto
  }

  let parsedSectionsOrder: LandingSectionKey[] = DEFAULT_SECTIONS_ORDER;
  if (dbSettings && dbSettings.landing_sections_order) {
    try {
      const parsed = JSON.parse(dbSettings.landing_sections_order);
      if (Array.isArray(parsed) && parsed.every(s => ["featured_list_requests", "ai_matching", "google_sheet"].includes(s)) && parsed.length > 0) {
        parsedSectionsOrder = parsed;
      } else {
        console.warn("landing_sections_order desde BD es inválido o vacío, usando orden por defecto. Valor:", dbSettings.landing_sections_order);
      }
    } catch (e) {
      console.error("Error al parsear landing_sections_order desde la BD, usando orden por defecto:", e, "Valor:", dbSettings.landing_sections_order);
    }
  } else if (!dbSettings) {
    // Si no hay configuración en la BD (ej. tabla vacía), usamos el orden por defecto.
    // No es necesario advertir en este caso, ya que es esperado.
  }


  return {
    id: dbSettings?.id || 1,
    siteTitle: dbSettings?.siteTitle === null || dbSettings?.siteTitle === undefined ? DEFAULT_SITE_TITLE : dbSettings.siteTitle,
    logoUrl: dbSettings?.logoUrl === null || dbSettings?.logoUrl === undefined ? null : dbSettings.logoUrl,
    show_featured_listings_section: dbSettings?.show_featured_listings_section === null || dbSettings?.show_featured_listings_section === undefined ? true : Boolean(dbSettings.show_featured_listings_section),
    show_ai_matching_section: dbSettings?.show_ai_matching_section === null || dbSettings?.show_ai_matching_section === undefined ? true : Boolean(dbSettings.show_ai_matching_section),
    show_google_sheet_section: dbSettings?.show_google_sheet_section === null || dbSettings?.show_google_sheet_section === undefined ? true : Boolean(dbSettings.show_google_sheet_section),
    landing_sections_order: parsedSectionsOrder,
    updated_at: dbSettings?.updatedAt ? new Date(dbSettings.updatedAt).toISOString() : undefined,
  };
}
