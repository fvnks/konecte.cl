
// src/actions/editableTextActions.ts
'use server';

import { query } from '@/lib/db';
import type { EditableText } from '@/lib/types';
import { revalidatePath } from 'next/cache';

function mapDbRowToEditableText(row: any): EditableText {
  return {
    id: row.id,
    page_group: row.page_group,
    description: row.description,
    content_default: row.content_default,
    content_current: row.content_current,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function getEditableTextsAction(): Promise<EditableText[]> {
  try {
    const rows = await query('SELECT * FROM editable_texts ORDER BY page_group ASC, id ASC');
    return rows.map(mapDbRowToEditableText);
  } catch (error) {
    console.error("Error al obtener textos editables:", error);
    return [];
  }
}

export async function updateEditableTextAction(id: string, contentCurrent: string): Promise<{ success: boolean; message?: string }> {
  if (!id) {
    return { success: false, message: "ID del texto no proporcionado." };
  }

  try {
    const result: any = await query(
      'UPDATE editable_texts SET content_current = ?, updated_at = NOW() WHERE id = ?',
      [contentCurrent, id]
    );

    if (result.affectedRows > 0) {
      revalidatePath('/admin/content'); // Revalida la página de administración de contenido
      // Deberíamos considerar revalidar las páginas públicas que usan este texto,
      // pero eso dependerá de cómo se integren. Por ahora, solo revalidamos el admin.
      return { success: true, message: "Texto actualizado exitosamente." };
    } else {
      return { success: false, message: "Texto no encontrado o el contenido era el mismo." };
    }
  } catch (error: any) {
    console.error(`Error al actualizar texto editable ${id}:`, error);
    return { success: false, message: `Error al actualizar texto: ${error.message}` };
  }
}

export async function getEditableTextAction(id: string): Promise<string | null> {
  try {
    const rows = await query('SELECT content_current FROM editable_texts WHERE id = ?', [id]);
    if (rows.length > 0) {
      return rows[0].content_current;
    }
    // Si no se encuentra, intentar devolver el content_default
    const defaultRows = await query('SELECT content_default FROM editable_texts WHERE id = ?', [id]);
     if (defaultRows.length > 0) {
      return defaultRows[0].content_default;
    }
    return null;
  } catch (error) {
    console.error(`Error al obtener texto editable ${id}:`, error);
    return null; // Devolver null o un string vacío en caso de error
  }
}

export async function getEditableTextsByGroupAction(group: string): Promise<Record<string, string>> {
  const texts: Record<string, string> = {};
  try {
    const rows = await query('SELECT id, content_current, content_default FROM editable_texts WHERE page_group = ?', [group]);
    rows.forEach((row: any) => {
      texts[row.id] = row.content_current ?? row.content_default ?? '';
    });
    return texts;
  } catch (error) {
    console.error(`Error al obtener textos editables para el grupo ${group}:`, error);
    return {}; // Devolver objeto vacío en caso de error
  }
}
