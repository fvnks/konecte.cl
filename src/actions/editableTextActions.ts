// src/actions/editableTextActions.ts
'use server';

import { query } from '@/lib/db';
import type { EditableText } from '@/lib/types';
import { revalidatePath } from 'next/cache';

function mapDbRowToEditableText(row: any): EditableText {
  return {
    id: row.id,
    text: row.text,
    page_path: row.page_path,
    component_id: row.component_id,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function getEditableTextsAction(): Promise<EditableText[]> {
  try {
    const rows = await query('SELECT * FROM editable_texts ORDER BY page_path ASC, id ASC');
    return rows.map(mapDbRowToEditableText);
  } catch (error) {
    console.error("Error al obtener textos editables:", error);
    return [];
  }
}

export async function updateEditableTextAction(id: string, text: string): Promise<boolean> {
  try {
    console.log(`Actualizando texto editable: ${id} con valor: ${text}`);
    
    // Check if the text already exists in the database
    const existingText = await query(
      'SELECT * FROM editable_texts WHERE id = ?',
      [id]
    );

    if (Array.isArray(existingText) && existingText.length > 0) {
      // Update existing text
      await query(
        'UPDATE editable_texts SET text = ?, updated_at = NOW() WHERE id = ?',
        [text, id]
      );
      console.log(`Texto actualizado: ${id}`);
    } else {
      // Extract page path and component ID from the ID (format: page_path:component_id)
      const [pagePath, componentId] = id.split(':');
      
      // Insert new text
      await query(
        'INSERT INTO editable_texts (id, text, page_path, component_id, updated_at) VALUES (?, ?, ?, ?, NOW())',
        [id, text, pagePath || '', componentId || id]
      );
      console.log(`Texto creado: ${id}`);
    }

    // Revalidate all paths to ensure the changes are visible
    revalidatePath('/');
    revalidatePath('/admin/content');
    
    return true;
  } catch (error) {
    console.error('Error updating editable text:', error);
    return false;
  }
}

export async function getEditableTextAction(id: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT text FROM editable_texts WHERE id = ?',
      [id]
    );

    if (Array.isArray(result) && result.length > 0) {
      return result[0].text;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting editable text:', error);
    return null;
  }
}

export async function getEditableTextsByGroupAction(page_path: string): Promise<Record<string, string>> {
  const texts: Record<string, string> = {};
  try {
    const rows = await query('SELECT id, text FROM editable_texts WHERE page_path = ?', [page_path]);
    rows.forEach((row: any) => {
      texts[row.id] = row.text || '';
    });
    return texts;
  } catch (error) {
    console.error(`Error al obtener textos editables para la página ${page_path}:`, error);
    return {}; // Devolver objeto vacío en caso de error
  }
}

export async function getPageEditableTextsAction(pagePath: string): Promise<EditableText[]> {
  try {
    const result = await query(
      'SELECT * FROM editable_texts WHERE page_path = ?',
      [pagePath]
    );

    if (Array.isArray(result)) {
      return result.map(mapDbRowToEditableText);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting page editable texts:', error);
    return [];
  }
}
