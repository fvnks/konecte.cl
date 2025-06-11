// src/actions/googleSheetActions.ts
'use server';

import type { GoogleSheetConfig } from "@/lib/types";
import { getMockSheetConfig, saveMockSheetConfig as saveMockConfig } from "@/lib/types";

export async function saveGoogleSheetConfigAction(config: GoogleSheetConfig): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("Guardando configuración de Google Sheet:", config);
    // En una app real, aquí guardarías `config` en tu base de datos o un sistema de configuración.
    // Para la simulación, usamos localStorage (a través de saveMockConfig).
    if (typeof window !== 'undefined') { 
        saveMockConfig(config);
    } else {
        console.warn("saveGoogleSheetConfigAction llamada desde el servidor, la configuración no persistirá entre requests sin una BD o sistema de archivos.")
    }
    return { success: true };
  } catch (error) {
    console.error("Error al guardar la configuración de Google Sheet:", error);
    return { success: false, message: "Error al guardar la configuración." };
  }
}

export async function getGoogleSheetConfigAction(): Promise<GoogleSheetConfig | null> {
  try {
    const config = getMockSheetConfig();
    console.log("Obteniendo configuración de Google Sheet (simulado):", config);
    return config;
  } catch (error) {
    console.error("Error al obtener la configuración de Google Sheet:", error);
    return null;
  }
}

interface SheetRow {
  [key: string]: string;
}

// Función para parsear CSV simple
function parseCSV(csvText: string): { headers: string[]; data: string[][] } {
  const lines = csvText.trim().split(/\r\n|\n/); // Manejar diferentes finales de línea
  if (lines.length === 0) return { headers: [], data: [] };

  // Función para parsear una línea CSV, manejando comillas
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
          // Escaped quote
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
    console.log("Google Sheet no configurado o configuración incompleta.");
    return null;
  }

  // Construir la URL de exportación CSV
  // Documentación no oficial sobre esto: https://gist.github.com/johndyer24/0dffbdd982c27c02652f
  // Nota: El nombre de la hoja (sheetName) es más robusto que gid para la exportación CSV si el orden de las hojas cambia.
  // Si sheetName contiene espacios u otros caracteres especiales, debe ser URL-encoded.
  const csvUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.sheetName)}`;

  console.log(`Obteniendo datos de Google Sheet desde: ${csvUrl}`);

  try {
    const response = await fetch(csvUrl, { cache: 'no-store' }); // Evitar caché agresiva
    if (!response.ok) {
      console.error(`Error al obtener la hoja de cálculo: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Cuerpo del error:", errorBody);
      // Podrías retornar datos simulados aquí o manejar el error de forma más específica
      // return getMockSheetData(config.columnsToDisplay); 
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

    // Coincidir las columnas solicitadas (nombres de encabezado) con los encabezados del CSV
    requestedColumns.forEach(requestedColName => {
      const foundIndex = rawHeaders.findIndex(csvHeader => csvHeader.toLowerCase() === requestedColName);
      if (foundIndex !== -1) {
        finalHeaders.push(rawHeaders[foundIndex]); // Usar el nombre original del encabezado del CSV
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
        // Asegurarse de que el índice no esté fuera de los límites para la fila actual
        rowObject[finalHeaders[i]] = colIndex < rowArray.length ? (rowArray[colIndex] || '') : '';
      });
      return rowObject;
    });

    return { headers: finalHeaders, rows: filteredRows };

  } catch (error) {
    console.error('Error al obtener o parsear datos de Google Sheets:', error);
    // Considera retornar datos simulados en caso de error si es apropiado
    // return getMockSheetData(config.columnsToDisplay);
    return null;
  }
}


// Función para generar datos simulados (se mantiene como fallback o para desarrollo)
function getMockSheetData(columnsToDisplay: string): { headers: string[]; rows: SheetRow[] } {
  const requestedHeaders = columnsToDisplay.split(',').map(h => h.trim()).filter(h => h.length > 0);
  
  const mockData: SheetRow[] = [
    { "Nombre": "Juan Pérez (Simulado)", "Email": "juan.perez.sim@example.com", "Teléfono": "555-1234", "Empresa": "Tech Corp", "Cargo": "Desarrollador" },
    { "Nombre": "Ana Gómez (Simulado)", "Email": "ana.gomez.sim@example.com", "Teléfono": "555-5678", "Empresa": "Innovate Ltd.", "Cargo": "Diseñadora" },
  ];

  if (requestedHeaders.length === 0 || requestedHeaders[0] === "") {
    // Si no se especifican columnas, o está vacío, devolver un conjunto por defecto
    const defaultHeaders = ["Nombre", "Email", "Teléfono"];
    return { 
      headers: defaultHeaders, 
      rows: mockData.map(row => ({ 
        "Nombre": row["Nombre"], 
        "Email": row["Email"], 
        "Teléfono": row["Teléfono"]
      })) 
    };
  }
  
  const filteredRows = mockData.map(row => {
    const newRow: SheetRow = {};
    requestedHeaders.forEach(header => {
      if (row[header] !== undefined) {
        newRow[header] = row[header];
      } else {
        newRow[header] = `(Simulado: ${header} no encontrado)`;
      }
    });
    return newRow;
  });

  return { headers: requestedHeaders, rows: filteredRows };
}
