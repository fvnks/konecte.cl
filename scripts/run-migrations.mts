import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config'; // Asegúrate de que las variables de entorno se carguen
import * as db from '../src/lib/db'; // Usar la importación de namespace
import { fileURLToPath } from 'url';

console.log('Inspecting imported db module:', db); // <-- Añadido para depuración

// --- Solución de Ruta Absoluta ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// La carpeta de migraciones ahora está en el mismo directorio que este script.
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  console.log('Starting database migrations...');
  
  // Lógica defensiva para manejar la inconsistencia del módulo
  const db_api = db.default || db;

  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordena los archivos alfabéticamente/numéricamente

    if (sqlFiles.length === 0) {
      console.log('No new migrations found.');
      return;
    }

    console.log(`Found ${sqlFiles.length} migration files:`);
    sqlFiles.forEach(file => console.log(`- ${file}`));
    
    // Aquí podrías añadir una lógica para llevar un registro de las migraciones ya ejecutadas
    // y solo correr las nuevas. Por ahora, las ejecutaremos todas.

    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      // Dividir en sentencias por si el archivo tiene múltiples queries separadas por ';'
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

      console.log(`\nExecuting migration: ${file}...`);
      for (const statement of statements) {
        try {
          await db_api.query(statement); // Usar la referencia segura
          console.log(`  ✅ Successfully executed statement.`);
        } catch (error) {
          console.error(`  ❌ Error executing statement in ${file}:`, error);
          // Detener el proceso si una migración falla
          throw new Error(`Migration ${file} failed.`);
        }
      }
    }

    console.log('\nAll migrations completed successfully!');
  } catch (error) {
    console.error('An error occurred during the migration process:', error);
    process.exit(1); // Salir con un código de error
  } finally {
    if (db_api.closeDbPool) { // Comprobar si la función existe antes de llamarla
      await db_api.closeDbPool(); // Usar db.closeDbPool directamente
    }
  }
}

runMigrations(); 