'use server';

import { findListingsForFreeTextSearch, type FindListingsForFreeTextSearchInput, type FindListingsForFreeTextSearchOutput } from '@/ai/flows/find-listings-for-free-text-search-flow';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Esquema de validación para la entrada de la acción
const searchInputSchema = z.object({
  userSearchDescription: z.string().min(10).max(1000),
});

interface ActionResult {
  success: boolean;
  data?: FindListingsForFreeTextSearchOutput;
  error?: string;
}

/**
 * Server Action para ejecutar la búsqueda de texto libre con IA.
 * Actúa como un envoltorio seguro para la función de flujo de IA.
 * @param input - La descripción de búsqueda del usuario.
 * @returns Un objeto con los resultados de la búsqueda o un error.
 */
export async function performAiSearchAction(
  input: FindListingsForFreeTextSearchInput
): Promise<ActionResult> {
  try {
    // Validar la entrada usando el esquema Zod
    const validatedInput = searchInputSchema.safeParse(input);
    if (!validatedInput.success) {
      console.error('[AI Action Error] Invalid input:', validatedInput.error.flatten());
      return { success: false, error: 'La entrada de búsqueda no es válida.' };
    }

    // Llamar a la función de flujo de IA real, que solo se ejecuta en el servidor
    const result = await findListingsForFreeTextSearch(validatedInput.data);

    // Opcional: Revalidar la ruta si es necesario para mostrar nuevos datos
    // revalidatePath('/');

    return { success: true, data: result };

  } catch (error: any) {
    console.error('[AI Action Error] Failed to execute AI search flow:', error);
    return { 
      success: false, 
      error: error.message || 'Ocurrió un error inesperado durante la búsqueda con IA.' 
    };
  }
} 