
// src/lib/db.ts
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

// Explicitly load environment variables from .env file
// This is important for scripts and server-side code that might run outside Next.js context
// For Next.js server-side code (API routes, getServerSideProps), Next.js handles .env loading automatically.
import dotenv from 'dotenv';
dotenv.config(); // Load .env file into process.env

let pool: Pool;

export function getDbPool(): Pool {
  if (!pool) {
    const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        const errorMessage = `Missing environment variable: ${varName}. Please ensure it is set in your .env file in the project root and the server was restarted.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }

    const port = Number(process.env.MYSQL_PORT);
    if (isNaN(port) || port <= 0) {
        const portErrorMessage = `Invalid MYSQL_PORT: '${process.env.MYSQL_PORT}'. Must be a positive number.`;
        console.error(portErrorMessage);
        throw new Error(portErrorMessage);
    }

    const connectionConfig = {
      host: process.env.MYSQL_HOST,
      port: port,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 100,
      queueLimit: 0,
    };
    
    console.log("Attempting to create MySQL pool with config:", { 
        host: connectionConfig.host, 
        port: connectionConfig.port, 
        user: connectionConfig.user, 
        database: connectionConfig.database,
        password: connectionConfig.password ? '********' : undefined 
    });

    try {
      pool = mysql.createPool(connectionConfig);
      pool.getConnection()
        .then(conn => {
          console.log("Successfully connected to MySQL and obtained a connection from the pool.");
          conn.release();
        })
        .catch(err => {
          console.error("Error establishing an initial connection from the pool to MySQL.", err);
        });
    } catch (error: any) {
      console.error("Fatal error creating MySQL connection pool:", error.message);
      throw error;
    }
  }
  return pool;
}

export async function query(sql: string, params?: any[]): Promise<any> {
  const dbPool = getDbPool();
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
