
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
  console.time("[DB_CREATE_POOL_TIME]");
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
    connectTimeout: process.env.MYSQL_CONNECT_TIMEOUT ? parseInt(process.env.MYSQL_CONNECT_TIMEOUT, 10) : 20000, // Increased to 20 seconds
  };

  console.log("[DB_INFO] Attempting to create new MySQL pool with config:", {
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
    console.log("[DB_INFO] mysql.createPool called. Attempting test connection...");
    // Test the pool immediately (non-blocking for the return of createPool)
    newPool.getConnection()
      .then(conn => {
        console.log(`[DB_INFO] Successfully obtained a test connection (ID: ${conn.threadId}) from the new pool.`);
        return conn.ping().then(() => {
          console.log(`[DB_INFO] Test connection (ID: ${conn.threadId}) ping successful.`);
          conn.release();
          console.timeEnd("[DB_CREATE_POOL_TIME]");
        }).catch(pingErr => {
            console.error(`[DB_ERROR] Test connection (ID: ${conn.threadId}) ping FAILED:`, pingErr.message);
            conn.release(); // Still release if ping fails
            console.timeEnd("[DB_CREATE_POOL_TIME]");
        });
      })
      .catch(err => {
        console.error("[DB_ERROR] Error establishing an initial test connection from the new pool:", err.message);
        console.timeEnd("[DB_CREATE_POOL_TIME]");
        // Consider if pool should be marked as unhealthy or retried
      });
    return newPool;
  } catch (error: any) {
    console.error("[DB_FATAL] Fatal error during mysql.createPool:", error.message, error.stack);
    console.timeEnd("[DB_CREATE_POOL_TIME]");
    throw error; // Re-throw if createPool itself fails
  }
}

export function getDbPool(): Pool {
  if (!pool) {
    console.log("[DB_INFO] Pool does not exist or was closed. Creating a new one.");
    pool = createPool();
  } else {
    // Optional: Log when an existing pool is being reused
    // console.log("[DB_INFO] Reusing existing MySQL pool.");
  }
  return pool;
}

export async function query(sql: string, params?: any[]): Promise<any> {
  const queryId = Math.random().toString(36).substring(2, 7);
  console.log(`[DB_QUERY_INIT-${queryId}] Attempting to get pool.`);
  const currentPool = getDbPool(); // Ensures pool is initialized if not already
  let connection: PoolConnection | undefined;
  console.log(`[DB_QUERY_POOL_ACQUIRED-${queryId}] Pool acquired.`);

  try {
    console.time(`[DB_GET_CONNECTION_TIME-${queryId}]`);
    console.log(`[DB_QUERY_CONN_ATTEMPT-${queryId}] Attempting to get connection...`);
    connection = await currentPool.getConnection();
    console.timeEnd(`[DB_GET_CONNECTION_TIME-${queryId}]`);
    console.log(`[DB_QUERY_CONN_SUCCESS-${queryId}] Connection (ID: ${connection.threadId}) acquired.`);

    console.log(`[DB_QUERY_EXEC_START-${queryId}] Executing SQL (Conn ID: ${connection.threadId}): ${sql.substring(0, 150)}...`);
    if (params) console.log(`[DB_QUERY_EXEC_PARAMS-${queryId}] Params:`, JSON.stringify(params).substring(0,100));
    console.time(`[DB_QUERY_EXEC_TIME-${queryId}]`);
    const [rows] = await connection.execute(sql, params);
    console.timeEnd(`[DB_QUERY_EXEC_TIME-${queryId}]`);
    console.log(`[DB_QUERY_EXEC_SUCCESS-${queryId}] SQL executed (Conn ID: ${connection.threadId}). Rows: ${Array.isArray(rows) ? rows.length : 'N/A'}`);
    return rows;
  } catch (error: any) {
    const errorMessage = `Error executing SQL query: ${error.message} (Code: ${error.code}, SQLState: ${error.sqlState})`;
    console.error(`[DB_QUERY_ERROR-${queryId}] ${errorMessage}`);
    console.error(`[DB_QUERY_ERROR_DETAIL-${queryId}] SQL: ${sql}`);
    if (params && params.length > 0) {
      try {
        console.error(`[DB_QUERY_ERROR_PARAMS-${queryId}] Params:`, JSON.stringify(params));
      } catch (e) {
        console.error(`[DB_QUERY_ERROR_PARAMS_RAW-${queryId}] Params (raw):`, params);
      }
    }
    if (connection) {
        console.error(`[DB_QUERY_ERROR_CONN_INFO-${queryId}] Connection Thread ID at error: ${connection.threadId}`);
    }
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.message.toLowerCase().includes("connection closed") || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.error(`[DB_QUERY_ERROR_CRITICAL_CONN-${queryId}] Critical connection error: ${error.code}. Pool may be closed and recreated on next call.`);
      await closeDbPool(); // Close the current (potentially problematic) pool
    }
    throw new Error(errorMessage); // Re-throw the error to be handled by the caller
  } finally {
    if (connection) {
      console.log(`[DB_QUERY_RELEASE-${queryId}] Releasing connection (Conn ID: ${connection.threadId})`);
      connection.release();
    }
  }
}
    