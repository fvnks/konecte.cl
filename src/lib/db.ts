
// src/lib/db.ts
import mysql from 'mysql2/promise';
import type { Pool, PoolConnection } from 'mysql2/promise';
// dotenv.config() is removed as Next.js handles .env files automatically.

let pool: Pool | undefined; // Allow pool to be undefined initially

// Function to gracefully shut down the pool
export async function closeDbPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      console.log("[DB_INFO] MySQL pool closed successfully.");
      pool = undefined; // Reset pool variable after closing
    } catch (error: any) {
      console.error("[DB_ERROR] Error closing MySQL pool:", error.message);
    }
  }
}

function createPool(): Pool {
  const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      const errorMessage = `Missing environment variable: ${varName}. Please ensure it is set in your .env file or Vercel environment variables.`;
      console.error(`[DB_ERROR] ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  const port = Number(process.env.MYSQL_PORT);
  if (isNaN(port) || port <= 0) {
    const portErrorMessage = `Invalid MYSQL_PORT: '${process.env.MYSQL_PORT}'. Must be a positive number.`;
    console.error(`[DB_ERROR] ${portErrorMessage}`);
    throw new Error(portErrorMessage);
  }

  const connectionConfig = {
    host: process.env.MYSQL_HOST,
    port: port,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? parseInt(process.env.MYSQL_CONNECTION_LIMIT, 10) : 10,
    queueLimit: 0, // No limit for queued connections
    connectTimeout: process.env.MYSQL_CONNECT_TIMEOUT ? parseInt(process.env.MYSQL_CONNECT_TIMEOUT, 10) : 10000, // 10 seconds default
    // enableKeepAlive: true, // Consider if persistent issues, helps keep connections from being idled out by firewalls
    // keepAliveInitialDelay: 0,
  };

  console.log("[DB_INFO] Creating new MySQL pool with config:", {
    host: connectionConfig.host,
    port: connectionConfig.port,
    user: connectionConfig.user,
    database: connectionConfig.database,
    connectionLimit: connectionConfig.connectionLimit,
    connectTimeout: connectionConfig.connectTimeout,
    password: connectionConfig.password ? '********' : undefined
  });

  try {
    const newPool = mysql.createPool(connectionConfig);
    // Test the pool immediately (non-blocking for the return of createPool)
    newPool.getConnection()
      .then(conn => {
        console.log("[DB_INFO] Successfully obtained a test connection from the new pool.");
        return conn.ping().then(() => {
          console.log("[DB_INFO] Test connection ping successful.");
          conn.release();
        }).catch(pingErr => {
            console.error("[DB_ERROR] Test connection ping FAILED:", pingErr.message);
            conn.release(); // Still release if ping fails
        });
      })
      .catch(err => {
        console.error("[DB_ERROR] Error establishing an initial test connection from the new pool:", err.message);
        // Consider if pool should be marked as unhealthy or retried
      });
    return newPool;
  } catch (error: any) {
    console.error("[DB_FATAL] Fatal error during mysql.createPool:", error.message, error.stack);
    throw error; // Re-throw if createPool itself fails
  }
}

export function getDbPool(): Pool {
  if (!pool) {
    console.log("[DB_INFO] Pool does not exist or was closed. Creating a new one.");
    pool = createPool();
  }
  return pool;
}

export async function query(sql: string, params?: any[]): Promise<any> {
  const currentPool = getDbPool(); // Ensures pool is initialized if not already
  let connection: PoolConnection | undefined;

  try {
    connection = await currentPool.getConnection();
    // console.log(`[DB_QUERY_START] Executing SQL (Conn ID: ${connection.threadId}): ${sql.substring(0, 150)}...`); // Log start
    const [rows] = await connection.execute(sql, params);
    // console.log(`[DB_QUERY_SUCCESS] SQL executed (Conn ID: ${connection.threadId}).`);
    return rows;
  } catch (error: any) {
    const errorMessage = `Error executing SQL query: ${error.message} (Code: ${error.code})`;
    console.error(`[DB_QUERY_ERROR] ${errorMessage}`);
    console.error(`[DB_QUERY_ERROR] Failed SQL: ${sql}`);
    if (params && params.length > 0) {
      try {
        console.error(`[DB_QUERY_ERROR] Failed Params:`, JSON.stringify(params));
      } catch (e) {
        console.error(`[DB_QUERY_ERROR] Failed Params (raw):`, params);
      }
    }
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.message.toLowerCase().includes("connection closed")) {
      console.error("[DB_QUERY_ERROR] 'PROTOCOL_CONNECTION_LOST' or 'Connection closed'. This indicates the connection was terminated. Possibilities: MySQL 'wait_timeout' reached, network issue, or DB restart. Pool should attempt to re-establish.");
      // Attempt to close the potentially problematic pool so it's recreated on next call.
      // This is an aggressive strategy for serverless environments.
      await closeDbPool();
    }
    throw new Error(errorMessage); // Re-throw the error to be handled by the caller
  } finally {
    if (connection) {
      // console.log(`[DB_QUERY_FINISH] Releasing connection (Conn ID: ${connection.threadId})`);
      connection.release();
    }
  }
}

// Optional: Add a specific handler if your app needs to gracefully shut down.
// In Vercel, this is less common as functions are stateless, but good for local dev.
// process.on('SIGINT', async () => {
//   await closeDbPool();
//   process.exit(0);
// });
// process.on('SIGTERM', async () => {
//   await closeDbPool();
//   process.exit(0);
// });
    
