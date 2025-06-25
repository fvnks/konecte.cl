// src/actions/editableTextActions.ts
'use server';

import { query } from '@/lib/db';
import type { EditableText } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import * as mysql from 'mysql2/promise';

function mapDbRowToEditableText(row: any): EditableText {
  if (!row) return {} as EditableText;
  return {
    id: row.id,
    text: row.content_current,
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

export async function updateEditableTextAction(id: string, text: string): Promise<{ success: boolean, message: string }> {
  if (!id || typeof text === 'undefined') {
    console.error('updateEditableTextAction fue llamado con id o texto inválido.', { id, text });
    return { success: false, message: 'ID o texto inválido.' };
  }
  
  // Crear una conexión directa a la base de datos para manejar la transacción manualmente
  let connection;
  try {
    console.log(`[EDITABLE_TEXT] Iniciando actualización para id: ${id}`);
    console.log(`[EDITABLE_TEXT] Texto a guardar: "${text}"`);
    
    // Crear una conexión directa a MySQL
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'konecte'
    });
    
    // Iniciar transacción
    await connection.beginTransaction();
    console.log(`[EDITABLE_TEXT] Transacción iniciada para ID: ${id}`);
    
    // Verificar si el texto existe
    const [existingTexts] = await connection.query('SELECT * FROM editable_texts WHERE id = ?', [id]);
    const existingText = Array.isArray(existingTexts) && existingTexts.length > 0 ? existingTexts[0] : null;
    
    if (existingText) {
      console.log(`[EDITABLE_TEXT] Texto encontrado, actualizando... ID: ${id}`);
      // Actualizar el texto
      const [updateResult] = await connection.query(
        'UPDATE editable_texts SET content_current = ?, updated_at = NOW() WHERE id = ?', 
        [text, id]
      );
      
      // Verificar que la actualización fue exitosa
      const updateInfo = updateResult as any;
      console.log(`[EDITABLE_TEXT] Resultado de actualización:`, {
        affectedRows: updateInfo.affectedRows,
        changedRows: updateInfo.changedRows
      });
      
      if (updateInfo.affectedRows === 0) {
        throw new Error(`No se pudo actualizar el texto con ID ${id}. No se encontró la fila.`);
      }
      
      console.log(`[EDITABLE_TEXT] Texto actualizado con éxito: ${id}`);
    } else {
      const parts = id.split(':');
      const pagePath = parts.length > 1 ? parts[0] : 'global';
      const componentId = parts.length > 1 ? parts.slice(1).join(':') : id;
      
      console.log(`[EDITABLE_TEXT] Texto no encontrado. Intentando crear nuevo. ID: ${id}, PagePath: ${pagePath}, ComponentID: ${componentId}`);

      // Insertar nuevo texto
      const [insertResult] = await connection.query(
        'INSERT INTO editable_texts (id, content_current, page_path, component_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [id, text, pagePath, componentId]
      );
      
      // Verificar que la inserción fue exitosa
      const insertInfo = insertResult as any;
      console.log(`[EDITABLE_TEXT] Resultado de inserción:`, {
        affectedRows: insertInfo.affectedRows,
        insertId: insertInfo.insertId
      });
      
      if (insertInfo.affectedRows === 0) {
        throw new Error(`No se pudo crear el texto con ID ${id}.`);
      }
      
      console.log(`[EDITABLE_TEXT] Texto creado con éxito: ${id}`);
    }
    
    // Confirmar cambios
    await connection.commit();
    console.log(`[EDITABLE_TEXT] Cambios confirmados (COMMIT) para ID: ${id}`);

    // Revalidar rutas
    console.log(`[EDITABLE_TEXT] Revalidando paths para ${id}`);
    revalidatePath('/', 'layout');
    revalidatePath('/admin/content', 'layout');
    
    return { success: true, message: 'Texto actualizado con éxito.' };
  } catch (error) {
    console.error(`[EDITABLE_TEXT] Error en updateEditableTextAction para ID ${id}:`, error);
    
    // Revertir cambios si hay error
    if (connection) {
      try {
        await connection.rollback();
        console.log(`[EDITABLE_TEXT] Cambios revertidos (ROLLBACK) para ID: ${id}`);
      } catch (rollbackError) {
        console.error(`[EDITABLE_TEXT] Error al revertir cambios para ID ${id}:`, rollbackError);
      }
    }
    
    const dbError = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Ocurrió un error inesperado en la base de datos: ${dbError}` };
  } finally {
    // Cerrar conexión en cualquier caso
    if (connection) {
      try {
        await connection.end();
        console.log(`[EDITABLE_TEXT] Conexión cerrada para ID: ${id}`);
      } catch (endError) {
        console.error(`[EDITABLE_TEXT] Error al cerrar conexión para ID ${id}:`, endError);
      }
    }
  }
}

export async function getEditableTextAction(id: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT content_current FROM editable_texts WHERE id = ?',
      [id]
    );

    if (Array.isArray(result) && result.length > 0) {
      return result[0].content_current;
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
    const rows = await query('SELECT id, content_current FROM editable_texts WHERE page_path = ?', [page_path]);
    if (rows && Array.isArray(rows)) {
      rows.forEach((row: any) => {
        if (row && row.id) {
          texts[row.id] = row.content_current || '';
        }
      });
    }
    return texts;
  } catch (error) {
    console.error(`Error al obtener textos editables para la página ${page_path}:`, error);
    return {}; // Devolver objeto vacío en caso de error
  }
}

export async function getPageEditableTextsAction(pagePath: string): Promise<EditableText[]> {
  try {
    const result = await query('SELECT * FROM editable_texts WHERE page_path = ?', [pagePath]);
    if (Array.isArray(result)) {
      return result.map(mapDbRowToEditableText).filter(Boolean); // Filter out any potential empty objects
    }
    return [];
  } catch (error) {
    console.error('Error getting page editable texts:', error);
    return [];
  }
}
