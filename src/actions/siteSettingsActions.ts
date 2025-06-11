
// src/actions/siteSettingsActions.ts
'use server';

import type { SiteSettings } from "@/lib/types";
import { query } from '@/lib/db';
import { revalidatePath } from "next/cache";

const DEFAULT_SITE_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';

export async function saveSiteSettingsAction(settings: Omit<SiteSettings, 'id' | 'updated_at'>): Promise<{ success: boolean; message?: string }> {
  try {
    const { siteTitle, logoUrl } = settings;

    const sql = `
      INSERT INTO site_settings (id, site_title, logo_url)
      VALUES (1, ?, ?)
      ON DUPLICATE KEY UPDATE
        site_title = VALUES(site_title),
        logo_url = VALUES(logo_url),
        updated_at = CURRENT_TIMESTAMP
    `;
    await query(sql, [siteTitle || DEFAULT_SITE_TITLE, logoUrl || null]);
    
    revalidatePath('/'); 
    revalidatePath('/admin/appearance');
    // Dispatch a storage event to notify other tabs/components (like Navbar) to update if needed
    // This is a client-side concept, so we can't directly do it here.
    // Instead, components like Navbar should re-fetch settings if they detect a relevant path revalidation
    // or based on other triggers. Or simply on next load.
    return { success: true, message: "Configuración del sitio guardada exitosamente." };
  } catch (error: any) {
    console.error("Error al guardar la configuración del sitio en la BD:", error);
    return { success: false, message: `Error al guardar la configuración: ${error.message}` };
  }
}

export async function getSiteSettingsAction(): Promise<SiteSettings> {
  try {
    const result = await query('SELECT id, site_title as siteTitle, logo_url as logoUrl, updated_at as updatedAt FROM site_settings WHERE id = 1');
    if (result && result.length > 0) {
      // Asegurarse de que los campos nulos en BD sean null en el objeto y no undefined
      const dbSettings = result[0];
      return {
        id: dbSettings.id,
        siteTitle: dbSettings.siteTitle === null ? DEFAULT_SITE_TITLE : dbSettings.siteTitle, // Fallback si es null en BD
        logoUrl: dbSettings.logoUrl === undefined ? null : dbSettings.logoUrl, // Asegurar que sea null si es undefined
        updated_at: dbSettings.updatedAt ? new Date(dbSettings.updatedAt).toISOString() : undefined,
      };
    }
  } catch (error) {
    console.error("Error al obtener la configuración del sitio desde la BD:", error);
    // No se encontró o hubo un error, devolvemos valores por defecto
  }
  // Si no hay configuración o hay error, devolvemos un objeto por defecto
  return {
    id: 1,
    siteTitle: DEFAULT_SITE_TITLE,
    logoUrl: null,
  };
}
