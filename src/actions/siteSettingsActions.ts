// src/actions/siteSettingsActions.ts
'use server';

import type { SiteSettings, LandingSectionKey } from "@/lib/types";
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from "next/cache";

const DEFAULT_SITE_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';
const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
const DEFAULT_ANNOUNCEMENT_BG_COLOR = '#FFB74D'; // Accent
const DEFAULT_ANNOUNCEMENT_TEXT_COLOR = '#18181b'; // Dark foreground

export async function saveSiteSettingsAction(settings: Partial<SiteSettings>): Promise<{ success: boolean; message?: string }> {
  console.log("[SiteSettingsAction_Save_Start] Attempting to save site settings:", settings);
  try {
    const { 
        siteTitle, 
        logoUrl,
        showFeaturedListingsSection,
        showFeaturedPlansSection,
        showAiMatchingSection,
        showGoogleSheetSection,
        landingSectionsOrder,
        announcementBarText,
        announcementBarLinkUrl,
        announcementBarLinkText,
        announcementBarIsActive,
        announcementBarBgColor,
        announcementBarTextColor
    } = settings;

    const validSectionsOrder = Array.isArray(landingSectionsOrder) && landingSectionsOrder.length > 0
                             ? landingSectionsOrder
                             : DEFAULT_SECTIONS_ORDER;
    const sectionsOrderJson = JSON.stringify(validSectionsOrder);

    const valuesToInsert = {
        id: 1,
        site_title: siteTitle || DEFAULT_SITE_TITLE,
        logo_url: logoUrl || null,
        show_featured_listings_section: showFeaturedListingsSection === undefined ? true : !!showFeaturedListingsSection,
        show_featured_plans_section: showFeaturedPlansSection === undefined ? true : !!showFeaturedPlansSection,
        show_ai_matching_section: showAiMatchingSection === undefined ? true : !!showAiMatchingSection,
        show_google_sheet_section: showGoogleSheetSection === undefined ? true : !!showGoogleSheetSection,
        landing_sections_order: sectionsOrderJson,
        announcement_bar_text: announcementBarText || null,
        announcement_bar_link_url: announcementBarLinkUrl || null,
        announcement_bar_link_text: announcementBarLinkText || null,
        announcement_bar_is_active: !!announcementBarIsActive,
        announcement_bar_bg_color: announcementBarBgColor || DEFAULT_ANNOUNCEMENT_BG_COLOR,
        announcement_bar_text_color: announcementBarTextColor || DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
    };
    
    const { id, ...valuesToUpdate } = valuesToInsert;

    await db.insert(siteSettings)
      .values(valuesToInsert)
      .onDuplicateKeyUpdate({ set: valuesToUpdate });
    
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
  let dbSettings: (typeof siteSettings.$inferSelect) | null = null;
  try {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    if (result && result.length > 0) {
      dbSettings = result[0];
    }
  } catch (error: any) {
    console.error("[SiteSettingsAction_Get_Error] Error al obtener la configuración del sitio desde la BD:", error.message, error.stack);
  }

  let parsedSectionsOrder: LandingSectionKey[] = DEFAULT_SECTIONS_ORDER;
  const validKeys: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
  
  const landingSectionsOrderFromDb = (dbSettings as any)?.landing_sections_order;
  if (dbSettings && landingSectionsOrderFromDb) {
    try {
      const parsed = JSON.parse(typeof landingSectionsOrderFromDb === 'string' ? landingSectionsOrderFromDb : JSON.stringify(landingSectionsOrderFromDb)) as LandingSectionKey[];
      parsedSectionsOrder = parsed.filter(key => validKeys.includes(key));
    } catch (error) {
      console.error("Error parsing landing_sections_order from DB:", error);
      parsedSectionsOrder = DEFAULT_SECTIONS_ORDER;
    }
  }

  const settings: SiteSettings = {
    id: dbSettings?.id || 1,
    siteTitle: (dbSettings as any)?.site_title || DEFAULT_SITE_TITLE,
    logoUrl: (dbSettings as any)?.logo_url || null,
    showFeaturedListingsSection: (dbSettings as any)?.show_featured_listings_section === undefined ? true : !!(dbSettings as any).show_featured_listings_section,
    showFeaturedPlansSection: (dbSettings as any)?.show_featured_plans_section === undefined ? true : !!(dbSettings as any).show_featured_plans_section,
    showAiMatchingSection: (dbSettings as any)?.show_ai_matching_section === undefined ? true : !!(dbSettings as any).show_ai_matching_section,
    showGoogleSheetSection: (dbSettings as any)?.show_google_sheet_section === undefined ? true : !!(dbSettings as any).show_google_sheet_section,
    landingSectionsOrder: parsedSectionsOrder,
    announcementBarText: (dbSettings as any)?.announcement_bar_text || null,
    announcementBarLinkUrl: (dbSettings as any)?.announcement_bar_link_url || null,
    announcementBarLinkText: (dbSettings as any)?.announcement_bar_link_text || null,
    announcementBarIsActive: !!(dbSettings as any)?.announcement_bar_is_active,
    announcementBarBgColor: (dbSettings as any)?.announcement_bar_bg_color || DEFAULT_ANNOUNCEMENT_BG_COLOR,
    announcementBarTextColor: (dbSettings as any)?.announcement_bar_text_color || DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
    updated_at: (dbSettings?.updated_at || new Date()).toISOString(),
  };

  console.log("[SiteSettingsAction_Get_Success] Site settings fetched successfully.");
  return settings;
}
