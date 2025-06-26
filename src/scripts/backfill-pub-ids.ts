import 'dotenv/config';
import { query, closeDbPool } from '../lib/db';

async function backfillPropertyPublicationCodes() {
  console.log('Iniciando script para rellenar IDs de publicación de propiedades...');

  try {
    // 1. Encontrar propiedades sin publication_code
    const propertiesToUpdate: any[] = await query(
      "SELECT id FROM properties WHERE publication_code IS NULL OR publication_code = ''"
    );

    if (propertiesToUpdate.length === 0) {
      console.log('No hay propiedades que necesiten actualización. ¡Todo está al día!');
      return;
    }

    console.log(`Se encontraron ${propertiesToUpdate.length} propiedades para actualizar.`);

    // 2. Iterar y actualizar cada una
    for (const prop of propertiesToUpdate) {
      const pubId = `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      console.log(`  - Actualizando propiedad ID ${prop.id} con el nuevo código: ${pubId}`);
      
      await query(
        'UPDATE properties SET publication_code = ? WHERE id = ?',
        [pubId, prop.id]
      );
    }

    console.log('¡Actualización completada exitosamente!');

  } catch (error) {
    console.error('Ocurrió un error durante el proceso de backfill:', error);
  } finally {
    // 3. Cerrar la conexión a la base de datos
    await closeDbPool();
    console.log('Conexión a la base de datos cerrada.');
  }
}

backfillPropertyPublicationCodes(); 