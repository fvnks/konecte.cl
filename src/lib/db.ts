// src/lib/db.ts
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

let pool: Pool;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionConfig = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // ssl: {
      //   rejectUnauthorized: true, // O false si tienes problemas con certificados autofirmados en desarrollo.
      //   // ca: fs.readFileSync('/path/to/ca-certificate.pem') // Si Aiven lo requiere
      // },
    };
    
    console.log("Creando nuevo pool de conexiones MySQL con config:", { 
        host: connectionConfig.host, 
        port: connectionConfig.port, 
        user: connectionConfig.user, 
        database: connectionConfig.database,
        password: connectionConfig.password ? '********' : undefined
    });

    pool = mysql.createPool(connectionConfig);

    // Test connection (optional, but good for debugging)
    pool.getConnection()
      .then(conn => {
        console.log("Conexión a MySQL establecida exitosamente.");
        conn.release();
      })
      .catch(err => {
        console.error("Error al conectar a MySQL:", err);
        // Podrías querer lanzar un error aquí o manejarlo de otra forma si la conexión inicial es crítica.
      });
  }
  return pool;
}

// Función para ejecutar consultas de forma segura
export async function query(sql: string, params?: any[]): Promise<any> {
  const dbPool = getDbPool();
  try {
    const [rows] = await dbPool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Error en la consulta SQL:", error);
    console.error("SQL:", sql);
    console.error("Params:", params);
    // Lanza un error más específico o maneja el error según las necesidades de tu aplicación
    throw new Error(`Error al ejecutar la consulta: ${(error as Error).message}`);
  }
}
