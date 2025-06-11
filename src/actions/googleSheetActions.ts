// src/actions/googleSheetActions.ts
'use server';

import type { GoogleSheetConfig } from "@/lib/types";
import { getMockSheetConfig, saveMockSheetConfig as saveMockConfig } from "@/lib/types";
// import { google } from 'googleapis'; // Descomentar para usar la API real

// Simulación de almacenamiento de configuración. En una app real, usarías una base de datos.
// Para esta simulación, estamos usando localStorage a través de getMockSheetConfig y saveMockConfig,
// lo cual solo funcionará completamente en el lado del cliente para la persistencia simulada.
// Las Server Actions pueden leer el estado inicial o un estado por defecto.

export async function saveGoogleSheetConfigAction(config: GoogleSheetConfig): Promise<{ success: boolean; message?: string }> {
  try {
    // Simulación de guardado:
    console.log("Guardando configuración de Google Sheet (simulado):", config);
    // En una app real, aquí guardarías `config` en tu base de datos.
    // Para la simulación y para que getGoogleSheetConfigAction pueda "leerlo" en la misma sesión del navegador:
    if (typeof window !== 'undefined') { // Solo si estamos en el cliente (para el useEffect del formulario)
        saveMockConfig(config);
    } else {
        // Si se llama desde el servidor directamente, no podemos usar localStorage.
        // Esto es una limitación de la simulación sin una BD real.
        console.warn("saveGoogleSheetConfigAction llamada desde el servidor, la configuración no persistirá entre requests sin una BD.")
    }
    // Por ahora, esta acción solo puede ser llamada desde el cliente para que la simulación funcione.
    
    return { success: true };
  } catch (error) {
    console.error("Error al guardar la configuración de Google Sheet:", error);
    return { success: false, message: "Error al guardar la configuración." };
  }
}

export async function getGoogleSheetConfigAction(): Promise<GoogleSheetConfig | null> {
  try {
    // Simulación de obtención de configuración:
    // En una app real, aquí obtendrías `config` de tu base de datos.
    // Usamos getMockSheetConfig para la simulación, que podría leer de localStorage si está en el cliente,
    // o devolver un valor por defecto si está en el servidor.
    const config = getMockSheetConfig();
    console.log("Obteniendo configuración de Google Sheet (simulado):", config);
    return config;
  } catch (error) {
    console.error("Error al obtener la configuración de Google Sheet:", error);
    return null;
  }
}

// Define la estructura de los datos que esperas de la hoja.
// Esto es un ejemplo, ajústalo a tus necesidades.
interface SheetRow {
  [key: string]: string; // Asume que todas las celdas son strings
}

export async function fetchGoogleSheetDataAction(): Promise<{ headers: string[]; rows: SheetRow[] } | null> {
  const config = await getGoogleSheetConfigAction();

  if (!config || !config.isConfigured || !config.sheetId || !config.sheetName || !config.columnsToDisplay) {
    console.log("Google Sheet no configurado o configuración incompleta.");
    return null;
  }

  // const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  // if (!apiKey) {
  //   console.error("GOOGLE_SHEETS_API_KEY no está configurada en .env");
  //   // Podrías retornar datos simulados aquí si la API key no está presente
  //   // return getMockSheetData(config.columnsToDisplay); 
  //   // O lanzar un error o retornar null. Por ahora, continuamos con simulación si no hay API key.
  // }

  // Simulación de obtención de datos
  console.log(`Simulando obtención de datos para Sheet ID: ${config.sheetId}, Sheet Name: ${config.sheetName}, Columns: ${config.columnsToDisplay}`);
  return getMockSheetData(config.columnsToDisplay);

  /*
  // --- INICIO DE CÓDIGO PARA API REAL DE GOOGLE SHEETS ---
  // Descomenta y adapta esta sección cuando tengas tu API Key y la hoja compartida públicamente.

  if (!apiKey) {
     console.error("API Key de Google Sheets no encontrada. Usando datos simulados.");
     return getMockSheetData(config.columnsToDisplay);
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    const range = `${config.sheetName}`; // Lee toda la hoja, podrías hacerlo más específico

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: range,
    });

    const allRows = response.data.values;
    if (!allRows || allRows.length === 0) {
      return { headers: [], rows: [] };
    }

    const rawHeaders = allRows[0];
    const rawDataRows = allRows.slice(1);
    
    const requestedColumns = config.columnsToDisplay.split(',').map(c => c.trim());
    
    // Determinar los índices de las columnas solicitadas
    const columnIndices: number[] = [];
    const finalHeaders: string[] = [];

    requestedColumns.forEach(requestedCol => {
      let foundIndex = -1;
      // Intenta hacer coincidir por letra de columna (ej. A, B)
      if (requestedCol.match(/^[A-Z]+$/i)) {
        // Convertir letra de columna a índice base 0 (A=0, B=1, ...)
        let colIndex = 0;
        for (let i = 0; i < requestedCol.length; i++) {
          colIndex = colIndex * 26 + (requestedCol.charCodeAt(i) - (requestedCol.charCodeAt(i) >= 97 ? 97 : 65) + 1);
        }
        foundIndex = colIndex -1;
        if (foundIndex >= 0 && foundIndex < rawHeaders.length) {
           finalHeaders.push(rawHeaders[foundIndex]);
           columnIndices.push(foundIndex);
        } else {
            console.warn(`Columna por letra '${requestedCol}' fuera de rango o no válida.`);
        }
      } else {
        // Intenta hacer coincidir por nombre de encabezado
        foundIndex = rawHeaders.findIndex(header => header.toLowerCase() === requestedCol.toLowerCase());
        if (foundIndex !== -1) {
          finalHeaders.push(rawHeaders[foundIndex]);
          columnIndices.push(foundIndex);
        } else {
            console.warn(`Encabezado de columna '${requestedCol}' no encontrado.`);
        }
      }
    });
    
    if (columnIndices.length === 0) {
        console.warn("No se encontraron columnas válidas para mostrar.");
        return { headers: [], rows: [] };
    }

    const filteredRows: SheetRow[] = rawDataRows.map(row => {
      const rowObject: SheetRow = {};
      columnIndices.forEach((colIndex, i) => {
        rowObject[finalHeaders[i]] = row[colIndex] || ''; // Asigna el valor de la celda o string vacío
      });
      return rowObject;
    });

    return { headers: finalHeaders, rows: filteredRows };

  } catch (error) {
    console.error('Error al obtener datos de Google Sheets:', error);
    // Considera retornar datos simulados en caso de error si es apropiado
    // return getMockSheetData(config.columnsToDisplay);
    return null;
  }
  // --- FIN DE CÓDIGO PARA API REAL DE GOOGLE SHEETS ---
  */
}


// Función para generar datos simulados
function getMockSheetData(columnsToDisplay: string): { headers: string[]; rows: SheetRow[] } {
  const requestedHeaders = columnsToDisplay.split(',').map(h => h.trim());
  
  const mockData: SheetRow[] = [
    { "Nombre": "Juan Pérez", "Email": "juan.perez@example.com", "Teléfono": "555-1234", "Empresa": "Tech Corp", "Cargo": "Desarrollador" },
    { "Nombre": "Ana Gómez", "Email": "ana.gomez@example.com", "Teléfono": "555-5678", "Empresa": "Innovate Ltd.", "Cargo": "Diseñadora" },
    { "Nombre": "Carlos Ruiz", "Email": "carlos.ruiz@example.com", "Teléfono": "555-9012", "Empresa": "Solutions Inc.", "Cargo": "Gerente" },
    { "Nombre": "Laura Méndez", "Email": "laura.mendez@example.com", "Teléfono": "555-3456", "Empresa": "Biz Hub", "Cargo": "Marketing" },
  ];

  if (requestedHeaders.length === 0) {
    return { headers: ["Nombre", "Email", "Teléfono"], rows: mockData.map(row => ({ "Nombre": row["Nombre"], "Email": row["Email"], "Teléfono": row["Teléfono"]})) };
  }
  
  // Filtra las filas para incluir solo las columnas solicitadas
  const filteredRows = mockData.map(row => {
    const newRow: SheetRow = {};
    requestedHeaders.forEach(header => {
      if (row[header] !== undefined) {
        newRow[header] = row[header];
      } else {
        // Simular si la columna solicitada no existe en los datos de ejemplo
        newRow[header] = `(Dato no encontrado para ${header})`;
      }
    });
    return newRow;
  });

  return { headers: requestedHeaders, rows: filteredRows };
}

// Ejemplo de cómo podrías manejar la conversión de letras de columna a índices si eliges esa ruta
// function columnToLetter(column: number): string {
//   let temp, letter = '';
//   while (column > 0) {
//     temp = (column - 1) % 26;
//     letter = String.fromCharCode(temp + 65) + letter;
//     column = (column - temp - 1) / 26;
//   }
//   return letter;
// }

// function letterToColumn(letter: string): number {
//   let column = 0, length = letter.length;
//   for (let i = 0; i < length; i++) {
//     column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
//   }
//   return column;
// }
