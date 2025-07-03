// src/actions/editableTextActions.ts
'use server';

import { db } from '@/lib/db';
import { editableTexts } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { EditableText } from '@/lib/types';
import { revalidatePath } from 'next/cache';

function mapDbRowToEditableText(row: any): EditableText {
  if (!row) return {} as EditableText;
  return {
    id: row.id,
    content_current: row.contentCurrent,
    content_default: row.contentDefault,
    page_path: row.pageGroup, // Note: Schema uses pageGroup, type uses page_path. Adjusting here.
    component_id: row.id, // Assuming component_id can be derived from the main ID.
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  };
}

export async function getEditableTextsAction(): Promise<EditableText[]> {
  try {
    const rows = await db.query.editableTexts.findMany({
        orderBy: [asc(editableTexts.pageGroup), asc(editableTexts.id)],
    });
    return rows.map(mapDbRowToEditableText);
  } catch (error) {
    console.error("Error al obtener textos editables:", error);
    return [];
  }
}

export async function updateEditableTextAction(id: string, text: string): Promise<{ success: boolean, message: string }> {
  if (!id || typeof text === 'undefined') {
    console.error('updateEditableTextAction fue llamado con id o texto inválido.', { id, text });
    return { success: false, message: 'ID o texto inválido.' };
  }

  try {
    const existingText = await db.query.editableTexts.findFirst({
        where: eq(editableTexts.id, id),
    });

    if (existingText) {
      await db.update(editableTexts)
        .set({ contentCurrent: text })
        .where(eq(editableTexts.id, id));
    } else {
      const parts = id.split(':');
      const pageGroup = parts.length > 1 ? parts[0] : 'global';
      
      await db.insert(editableTexts).values({
        id,
        contentCurrent: text,
        contentDefault: text, 
        pageGroup,
        description: `Texto para ${id}`,
      });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/content', 'layout');
    
    return { success: true, message: 'Texto actualizado con éxito.' };
  } catch (error) {
    console.error(`[EDITABLE_TEXT] Error en updateEditableTextAction para ID ${id}:`, error);
    const dbError = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ocurrió un error inesperado en la base de datos: ${dbError}` };
  }
}

export async function getEditableTextAction(id: string): Promise<string | null> {
  try {
    const result = await db.query.editableTexts.findFirst({
        where: eq(editableTexts.id, id),
        columns: {
            contentCurrent: true,
        }
    });
    return result?.contentCurrent ?? null;
  } catch (error) {
    console.error(`[data/getEditableText] Error fetching text with ID "${id}":`, error);
    return null;
  }
}

export async function getEditableTextsByGroupAction(pageGroup: string): Promise<Record<string, string>> {
  const texts: Record<string, string> = {};
  try {
    if (!pageGroup) return {};
    const rows = await db.query.editableTexts.findMany({
        where: eq(editableTexts.pageGroup, pageGroup),
        columns: {
            id: true,
            contentCurrent: true,
        }
    });
    
    for (const row of rows) {
        if (row.id && row.contentCurrent) {
            texts[row.id] = row.contentCurrent;
        }
    }
    return texts;
  } catch (error) {
    console.error(`Error al obtener textos editables para la página ${pageGroup}:`, error);
    return {};
  }
}

export async function getPageEditableTextsAction(pageGroup: string): Promise<EditableText[]> {
  try {
    if (!pageGroup) return [];
    const result = await db.query.editableTexts.findMany({
        where: eq(editableTexts.pageGroup, pageGroup)
    });
    return result.map(mapDbRowToEditableText).filter(Boolean);
  } catch (error) {
    console.error('Error getting page editable texts:', error);
    return [];
  }
}
