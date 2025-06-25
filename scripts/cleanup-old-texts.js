const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Carga las variables de entorno desde .env.local (si existe) o del entorno de Vercel
// No necesitas dotenv si estás en un entorno que ya carga las variables.

async function cleanup() {
  let connection;
  try {
    console.log("Conectando a la base de datos...");

    const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            throw new Error(`Variable de entorno faltante: ${varName}`);
        }
    }

    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log("Conexión exitosa. Eliminando registros obsoletos...");

    const [result] = await connection.execute(
      "DELETE FROM editable_texts WHERE id LIKE 'home:%'"
    );

    console.log(`Limpieza completada. Se eliminaron ${result.affectedRows} registros.`);

  } catch (error) {
    console.error("Ocurrió un error:", error.message);
  } finally {
    if (connection) {
      console.log("Cerrando conexión.");
      await connection.end();
    }
  }
}

cleanup();
