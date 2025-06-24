import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// --- Solución de Ruta Absoluta ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Carga Manual del archivo .env ---
const envPath = path.resolve(__dirname, '..', '.env.local');
let dbConfig: any = {};

try {
  const envFileContent = fs.readFileSync(envPath, { encoding: 'utf-8' });
  const envVars = dotenv.parse(envFileContent);
  
  dbConfig = {
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_DATABASE,
    port: envVars.DB_PORT ? parseInt(envVars.DB_PORT, 10) : 3306,
  };

  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    throw new Error('Variables de base de datos incompletas en .env');
  }

} catch (error) {
  console.error(`Error crítico: No se pudo leer o parsear el archivo .env en ${envPath}.`);
  console.error('Por favor, asegúrate de que el archivo exista y contenga las credenciales de la BD (DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE).');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  let connection;
  try {
    console.log('Connecting to the database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful.');

    // Crear tabla de migraciones si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Obtener migraciones ya ejecutadas
    const [executedRows] = await connection.execute('SELECT name FROM _migrations');
    const executedMigrations = new Set((executedRows as any[]).map(row => row.name));

    // Leer archivos de migración del directorio
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Asegura el orden de ejecución

    if (migrationFiles.length === 0) {
      console.log('No new migration files to run.');
      return;
    }

    let migrationsRun = 0;
    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        continue; // Saltar migración ya ejecutada
      }

      console.log(`Running migration: ${file}...`);
      migrationsRun++;
      
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      const statements = sql.split(/;\s*$/m).filter(s => s.trim().length > 0);

      for (const statement of statements) {
        await connection.execute(statement);
      }

      // Registrar la migración como ejecutada
      await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
      console.log(`Migration ${file} executed and registered successfully.`);
    }

    if (migrationsRun === 0) {
      console.log('Database is already up to date.');
    } else {
      console.log(`\nSuccessfully ran ${migrationsRun} new migration(s).`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      console.log('Closing database connection.');
      await connection.end();
    }
  }
}

runMigrations(); 