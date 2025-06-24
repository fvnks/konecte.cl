import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Define __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: true, // Allow multiple statements in one query
};

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

async function runMigrations() {
  let connection;
  try {
    console.log('Connecting to the database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful.');

    // 1. Create migrations table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get already applied migrations
    const [rows]: [any[], any] = await connection.execute(`SELECT version FROM ${MIGRATIONS_TABLE}`);
    const appliedMigrations = new Set(rows.map((row: any) => row.version));
    
    // TEMPORAL: Forzar el registro de una migración que ya fue aplicada manualmente
    appliedMigrations.add('004_add_whatsapp_permission_to_plans.sql');
    appliedMigrations.add('005_add_pub_code_to_properties.sql');
    appliedMigrations.add('manual_006_add_pub_code_to_property_requests'); // Mark the manual one as applied

    console.log(`Applied migrations: ${[...appliedMigrations].join(', ') || 'None'}`);

    // 3. Find and run new migrations
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      // HACK: Skip the broken migration file that keeps reappearing
      if (file === '006_add_pub_code_to_requests.sql') {
        console.log(`Permanently skipping broken migration file: ${file}`);
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      await connection.query(sql);
      await connection.execute(`INSERT INTO ${MIGRATIONS_TABLE} (version) VALUES (?)`, [file]);
      console.log(`Successfully applied migration: ${file}`);
    }

    console.log('Migration process finished successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
}

runMigrations(); 