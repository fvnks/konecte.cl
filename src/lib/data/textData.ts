import { getEditableTextAction } from '@/actions/editableTextActions';

/**
 * Obtiene el contenido de un texto editable llamando a la Server Action correspondiente.
 * Esta función está diseñada para ser utilizada por Componentes de Servidor.
 * @param id - El ID del texto a obtener.
 * @returns El contenido del texto o null si no se encuentra o hay un error.
 */
export async function getEditableText(id: string): Promise<string | null> {
  // Simplemente delega la llamada a la Server Action, que ya maneja la lógica y los errores.
  return getEditableTextAction(id);
} 