// src/actions/googleSheetActions.ts
'use server';

import type { GoogleSheetConfig } from "@/lib/types";
import { db } from '@/lib/db';
import { googleSheetConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from "next/cache";

export async function saveGoogleSheetConfigAction(config: Omit<GoogleSheetConfig, 'id' | 'isConfigured'> & {isConfigured?: boolean}): Promise<{ success: boolean; message?: string }> {
  try {
    const { sheetId, sheetName, columnsToDisplay } = config;
    const isConfigured = config.isConfigured === undefined ? !!(sheetId && sheetName && columnsToDisplay) : config.isConfigured;

    await db.insert(googleSheetConfigs)
      .values({
        id: 1, // Always operate on the single config row
        sheetId: sheetId || null,
        sheetName: sheetName || null,
        columnsToDisplay: columnsToDisplay || null,
        isConfigured: isConfigured,
      })
      .onDuplicateKeyUpdate({
        set: {
          sheetId: sheetId || null,
          sheetName: sheetName || null,
          columnsToDisplay: columnsToDisplay || null,
          isConfigured: isConfigured,
        }
      });
    
    revalidatePath('/'); // To reload sheet data on the homepage
    revalidatePath('/admin/settings');
    return { success: true, message: "Configuración de Google Sheet guardada exitosamente." };
  } catch (error: any) {
    console.error("Error al guardar la configuración de Google Sheet en la BD:", error);
    return { success: false, message: `Error al guardar la configuración: ${error.message}` };
  }
}

export async function getGoogleSheetConfigAction(): Promise<GoogleSheetConfig | null> {
  try {
    const result = await db.query.googleSheetConfigs.findFirst({
      where: eq(googleSheetConfigs.id, 1),
    });
    
    if (result) {
      return {
        ...result,
        isConfigured: Boolean(result.isConfigured) // Ensure it's a boolean
      };
    }
    
    // If no config, return a default non-configured object
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
