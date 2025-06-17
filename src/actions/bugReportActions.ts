
// src/actions/bugReportActions.ts
'use server';

import { z } from 'zod';
import { bugReportFormSchema, type BugReportFormValues } from '@/lib/types';

export async function submitBugReportAction(
  values: BugReportFormValues
): Promise<{ success: boolean; message?: string }> {
  const validation = bugReportFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Datos inválidos: ${errorMessages}` };
  }

  const { name, email, pageUrl, description, stepsToReproduce, browserDevice } = validation.data;

  try {
    // En una aplicación real, aquí guardarías el reporte en una base de datos
    // o lo enviarías a un sistema de seguimiento de errores o por email.
    console.log("--- NUEVO REPORTE DE ERROR ---");
    console.log("Nombre:", name || "No proporcionado");
    console.log("Email:", email || "No proporcionado");
    console.log("URL de la Página:", pageUrl || "No proporcionada");
    console.log("Descripción del Error:", description);
    console.log("Pasos para Reproducir:", stepsToReproduce || "No proporcionados");
    console.log("Navegador/Dispositivo:", browserDevice || "No proporcionado");
    console.log("-------------------------------");

    // Simular un pequeño retraso como si se estuviera procesando
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, message: '¡Gracias! Tu reporte de error ha sido enviado. Apreciamos tu ayuda para mejorar PropSpot.' };

  } catch (error: any) {
    console.error("[BugReportAction] Error submitting bug report:", error);
    return { success: false, message: `Error al procesar el reporte: ${error.message}` };
  }
}
