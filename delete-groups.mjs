// Script para eliminar grupos directamente desde la base de datos
import { config } from 'dotenv';
import { createPool } from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configurar dotenv para cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env.local') });

// IDs de los grupos a eliminar
const GROUP_IDS_TO_DELETE = [
  "zwelr1juignoaqly4ay6r9uo",
  "a9zwjkg9kz24enmoyujee2e3",
  "gku7qevh2ij5xcaujqgb3mrx"
];

// Función principal
async function main() {
  console.log("🚀 Iniciando script para eliminar grupos...");

  // Obtener credenciales de la base de datos
  const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT } = process.env;

  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error("❌ Faltan variables de entorno. Asegúrate de tener .env.local con MYSQL_*");
  }

  // Crear conexión a la base de datos
  const connectionString = `mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT || 3306}/${MYSQL_DATABASE}`;
  console.log(`📊 Conectando a la base de datos: ${MYSQL_HOST}/${MYSQL_DATABASE}`);
  
  const pool = createPool({ uri: connectionString });
  
  try {
    // Para cada grupo en la lista
    for (const groupId of GROUP_IDS_TO_DELETE) {
      console.log(`\n🗑️ Procesando grupo: ${groupId}`);
      
      // 1. Verificar si el grupo existe
      const [groups] = await pool.query('SELECT * FROM groups WHERE id = ?', [groupId]);
      
      if (groups.length === 0) {
        console.log(`⚠️ El grupo ${groupId} no existe. Saltando.`);
        continue;
      }
      
      console.log(`✅ Grupo encontrado: ${groups[0].name}`);
      
      // 2. Eliminar miembros del grupo
      console.log(`🧹 Eliminando miembros del grupo...`);
      const [memberResult] = await pool.query('DELETE FROM group_members WHERE group_id = ?', [groupId]);
      console.log(`✅ ${memberResult.affectedRows} miembros eliminados.`);
      
      // 3. Eliminar el grupo
      console.log(`🧹 Eliminando el grupo...`);
      const [groupResult] = await pool.query('DELETE FROM groups WHERE id = ?', [groupId]);
      console.log(`✅ Grupo eliminado: ${groupResult.affectedRows} filas afectadas.`);
    }
    
    console.log("\n🎉 ¡Proceso completado con éxito!");
  } catch (error) {
    console.error("❌ Error durante la ejecución:", error);
  } finally {
    await pool.end();
    console.log("👋 Conexión a la base de datos cerrada.");
  }
}

// Ejecutar el script
main().catch(console.error);
