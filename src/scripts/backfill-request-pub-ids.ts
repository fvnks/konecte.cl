import 'dotenv/config';
import { query, closeDbPool } from '../lib/db';

async function backfillRequestPublicationCodes() {
  console.log('Iniciando script para rellenar IDs de publicación de solicitudes...');

  try {
    // 1. Encontrar solicitudes sin publication_code
    const requestsToUpdate: any[] = await query(
      "SELECT id FROM property_requests WHERE publication_code IS NULL OR publication_code = ''"
    );

    if (requestsToUpdate.length === 0) {
      console.log('No hay solicitudes que necesiten actualización. ¡Todo está al día!');
      return;
    }

    console.log(`Se encontraron ${requestsToUpdate.length} solicitudes para actualizar.`);

    // 2. Iterar y actualizar cada una
    for (const req of requestsToUpdate) {
      const pubId = `S-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      console.log(`  - Actualizando solicitud ID ${req.id} con el nuevo código: ${pubId}`);
      
      await query(
        'UPDATE property_requests SET publication_code = ? WHERE id = ?',
        [pubId, req.id]
      );
    }

    console.log('¡Actualización de solicitudes completada exitosamente!');

  } catch (error) {
    console.error('Ocurrió un error durante el proceso de backfill de solicitudes:', error);
  } finally {
    // 3. Cerrar la conexión a la base de datos
    await closeDbPool();
    console.log('Conexión a la base de datos cerrada.');
  }
}

backfillRequestPublicationCodes(); 