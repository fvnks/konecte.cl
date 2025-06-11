// src/actions/googleSheetActions.ts
'use server';

import type { GoogleSheetConfig } from "@/lib/types";
import { query } from '@/lib/db';
import { revalidatePath } from "next/cache";

export async function saveGoogleSheetConfigAction(config: Omit<GoogleSheetConfig, 'id' | 'isConfigured'> & {isConfigured?: boolean}): Promise<{ success: boolean; message?: string }> {
  try {
    const { sheetId, sheetName, columnsToDisplay } = config;
    const isConfigured = config.isConfigured === undefined ? !!(sheetId && sheetName && columnsToDisplay) : config.isConfigured;

    // En la tabla google_sheet_configs, siempre actualizaremos la fila con id=1
    // o la insertaremos si no existe.
    const sql = `
      INSERT INTO google_sheet_configs (id, sheet_id, sheet_name, columns_to_display, is_configured)
      VALUES (1, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sheet_id = VALUES(sheet_id),
        sheet_name = VALUES(sheet_name),
        columns_to_display = VALUES(columns_to_display),
        is_configured = VALUES(is_configured),
        updated_at = CURRENT_TIMESTAMP
    `;
    await query(sql, [sheetId || null, sheetName || null, columnsToDisplay || null, isConfigured]);
    
    revalidatePath('/'); // Para que la página de inicio recargue los datos de la hoja
    revalidatePath('/admin/settings');
    return { success: true, message: "Configuración de Google Sheet guardada exitosamente." };
  } catch (error: any) {
    console.error("Error al guardar la configuración de Google Sheet en la BD:", error);
    return { success: false, message: `Error al guardar la configuración: ${error.message}` };
  }
}

export async function getGoogleSheetConfigAction(): Promise<GoogleSheetConfig | null> {
  try {
    const result = await query('SELECT id, sheet_id as sheetId, sheet_name as sheetName, columns_to_display as columnsToDisplay, is_configured as isConfigured FROM google_sheet_configs WHERE id = 1');
    if (result && result.length > 0) {
      const config = result[0];
      return {
        ...config,
        isConfigured: Boolean(config.isConfigured) // Asegurar que sea booleano
      };
    }
    // Si no hay configuración, devolvemos un objeto por defecto no configurado
    return {
      id: 1,
      sheetId: null,
      sheetName: null,
      columnsToDisplay: null,
      isConfigured: false,
    };
  } catch (error) {
    console.error("Error al obtener la configuración de Google Sheet desde la BD:", error);
    return null;
  }
}

interface SheetRow {
  [key: string]: string;
}

function parseCSV(csvText: string): { headers: string[]; data: string[][] } {
  const lines = csvText.trim().split(/\r\n|\n/); 
  if (lines.length === 0) return { headers: [], data: [] };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    result.push(currentField.trim());
    return result;
  };
  
  const headers = parseCsvLine(lines[0]);
  const data = lines.slice(1).map(line => parseCsvLine(line));
  return { headers, data };
}

export async function fetchGoogleSheetDataAction(): Promise<{ headers: string[]; rows: SheetRow[] } | null> {
  const config = await getGoogleSheetConfigAction();

  if (!config || !config.isConfigured || !config.sheetId || !config.sheetName || !config.columnsToDisplay) {
    console.log("Google Sheet no configurado o configuración incompleta en la BD.");
    return null;
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.sheetName)}`;
  console.log(`Obteniendo datos de Google Sheet desde: ${csvUrl}`);

  try {
    const response = await fetch(csvUrl, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Error al obtener la hoja de cálculo: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Cuerpo del error:", errorBody);
      return null;
    }

    const csvText = await response.text();
    if (!csvText) {
      return { headers: [], rows: [] };
    }
    
    const { headers: rawHeaders, data: rawDataRows } = parseCSV(csvText);

    if (!rawHeaders || rawHeaders.length === 0) {
      console.warn("El CSV no contiene encabezados o está vacío.");
      return { headers: [], rows: [] };
    }
    
    const requestedColumns = config.columnsToDisplay.split(',').map(c => c.trim().toLowerCase());
    
    const finalHeaders: string[] = [];
    const columnIndices: number[] = [];

    requestedColumns.forEach(requestedColName => {
      const foundIndex = rawHeaders.findIndex(csvHeader => csvHeader.toLowerCase() === requestedColName);
      if (foundIndex !== -1) {
        finalHeaders.push(rawHeaders[foundIndex]); 
        columnIndices.push(foundIndex);
      } else {
        console.warn(`Encabezado de columna '${requestedColName}' no encontrado en el CSV. Encabezados disponibles: ${rawHeaders.join(', ')}`);
      }
    });
    
    if (columnIndices.length === 0) {
        console.warn("No se encontraron columnas válidas para mostrar del CSV. Verifica los nombres de las columnas en la configuración.");
        return { headers: [], rows: [] };
    }

    const filteredRows: SheetRow[] = rawDataRows.map(rowArray => {
      const rowObject: SheetRow = {};
      columnIndices.forEach((colIndex, i) => {
        rowObject[finalHeaders[i]] = colIndex < rowArray.length ? (rowArray[colIndex] || '') : '';
      });
      return rowObject;
    });

    return { headers: finalHeaders, rows: filteredRows };

  } catch (error) {
    console.error('Error al obtener o parsear datos de Google Sheets:', error);
    return null;
  }
}
