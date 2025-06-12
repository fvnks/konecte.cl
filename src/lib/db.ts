
// src/lib/db.ts
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

// Explicitly load environment variables from .env file
import { config } from 'dotenv';
config(); // This will load variables from .env into process.env

let pool: Pool;

export function getDbPool(): Pool {
  if (!pool) {
    // Updated to use MYSQL_ prefix
    const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        const errorMessage = `Missing environment variable: ${varName}. Please ensure it is set in your .env file in the project root and the server was restarted.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }

    const port = Number(process.env.MYSQL_PORT); // Updated to MYSQL_PORT
    if (isNaN(port) || port <= 0) {
        const portErrorMessage = `Invalid MYSQL_PORT: '${process.env.MYSQL_PORT}'. Must be a positive number.`; // Updated to MYSQL_PORT
        console.error(portErrorMessage);
        throw new Error(portErrorMessage);
    }

    const connectionConfig = {
      host: process.env.MYSQL_HOST, // Updated to MYSQL_HOST
      port: port,
      user: process.env.MYSQL_USER, // Updated to MYSQL_USER
      password: process.env.MYSQL_PASSWORD, // Updated to MYSQL_PASSWORD
      database: process.env.MYSQL_DATABASE, // Updated to MYSQL_DATABASE
      waitForConnections: true,
      connectionLimit: 50, // Aumentado de 25 a 50
      queueLimit: 0,
      // ssl: { // Uncomment and configure if Aiven requires SSL and provides CA cert
      //   rejectUnauthorized: true, 
      //   // ca: fs.readFileSync('/path/to/your-aiven-ca.pem') 
      // },
    };
    
    console.log("Attempting to create MySQL pool with config:", { 
        host: connectionConfig.host, 
        port: connectionConfig.port, 
        user: connectionConfig.user, 
        database: connectionConfig.database,
        // Mask password in logs for security
        password: connectionConfig.password ? '********' : undefined 
    });

    try {
      pool = mysql.createPool(connectionConfig);

      // Optional: Asynchronous test connection to log more details on connection success/failure.
      // This doesn't block pool creation but aids debugging.
      pool.getConnection()
        .then(conn => {
          console.log("Successfully connected to MySQL and obtained a connection from the pool.");
          conn.release();
        })
        .catch(err => {
          console.error("Error establishing an initial connection from the pool to MySQL. Check credentials, host, port, and network/firewall rules (e.g., Aiven IP allowlist).", err);
        });
    } catch (error: any) {
      console.error("Fatal error creating MySQL connection pool:", error.message);
      throw error; // Re-throw to prevent using a broken or uninitialized pool
    }
  }
  return pool;
}

// Función para ejecutar consultas de forma segura
export async function query(sql: string, params?: any[]): Promise<any> {
  const dbPool = getDbPool(); // This will now throw if env vars are missing or invalid
  try {
    const [rows] = await dbPool.execute(sql, params);
    return rows;
  } catch (error: any) {
    console.error("Error in SQL query execution:", error.message);
    console.error("Failed SQL:", sql);
    console.error("Failed Params:", params);
    throw new Error(`Error executing SQL query: ${error.message}`);
  }
}

