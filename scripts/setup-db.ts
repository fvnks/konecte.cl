
// scripts/setup-db.ts
import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';
import readline from 'readline/promises';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// --- Helper para obtener credenciales ---
async function getCredentials(rl: readline.Interface): Promise<PoolOptions> {
  console.log('\n--- Configuración de la Base de Datos ---');
  const host = await rl.question('Host de MySQL (ej: localhost): ') || 'localhost';
  const portStr = await rl.question('Puerto de MySQL (ej: 3306): ') || '3306';
  const user = await rl.question('Usuario de MySQL (ej: root): ') || 'root';
  const password = await rl.question('Contraseña de MySQL: ');
  const database = await rl.question('Nombre de la Base de Datos (ej: propspot_db): ') || 'propspot_db';

  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error('El puerto debe ser un número válido.');
  }

  return { host, port, user, password, database, connectionLimit: 5, waitForConnections: true };
}

// --- Definición de todas las tablas y datos iniciales ---
// Nota: CREATE INDEX IF NOT EXISTS es para SQLite/PostgreSQL, MySQL usa ALTER TABLE o lo ignora si ya existe.
// Para simplificar, se asume que los índices se crean si no existen sin error.
const SQL_STATEMENTS: string[] = [
  // roles
  `CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  `INSERT IGNORE INTO roles (id, name, description) VALUES 
    ('admin', 'Administrador', 'Acceso total a todas las funcionalidades y configuraciones del sistema.'),
    ('user', 'Usuario', 'Usuario estándar con capacidad para publicar y comentar.');`,

  // plans
  `CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0.00,
    price_currency VARCHAR(3) DEFAULT 'CLP',
    max_properties_allowed INT DEFAULT NULL,
    max_requests_allowed INT DEFAULT NULL,
    can_feature_properties BOOLEAN DEFAULT FALSE,
    property_listing_duration_days INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  // Insertar plan gratuito por defecto (opcional, puede ser gestionado desde la app)
  `INSERT IGNORE INTO plans (id, name, description, price_monthly, max_properties_allowed, max_requests_allowed, property_listing_duration_days) VALUES
    ('${randomUUID()}', 'Gratuito', 'Plan básico con funcionalidades limitadas.', 0.00, 1, 1, 30);`,
  
  // users
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rut_tin VARCHAR(20) DEFAULT NULL,
    phone_number VARCHAR(50) DEFAULT NULL,
    avatar_url VARCHAR(2048) DEFAULT NULL,
    role_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) DEFAULT NULL,
    plan_expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
  );`,
  // Índices para users (MySQL crea índices para PK y FK automáticamente, estos son adicionales)
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_rut_tin ON users(rut_tin);`,
  `CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);`,

  // properties
  `CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    property_type ENUM('rent', 'sale') NOT NULL,
    category ENUM('apartment', 'house', 'condo', 'land', 'commercial', 'other') NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 0,
    bathrooms INT NOT NULL DEFAULT 0,
    area_sq_meters DECIMAL(10,2) NOT NULL,
    images JSON,
    features JSON,
    upvotes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);`,

  // property_requests
  `CREATE TABLE IF NOT EXISTS property_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    desired_property_type_rent BOOLEAN DEFAULT FALSE,
    desired_property_type_sale BOOLEAN DEFAULT FALSE,
    desired_category_apartment BOOLEAN DEFAULT FALSE,
    desired_category_house BOOLEAN DEFAULT FALSE,
    desired_category_condo BOOLEAN DEFAULT FALSE,
    desired_category_land BOOLEAN DEFAULT FALSE,
    desired_category_commercial BOOLEAN DEFAULT FALSE,
    desired_category_other BOOLEAN DEFAULT FALSE,
    desired_location_city VARCHAR(100) NOT NULL,
    desired_location_neighborhood VARCHAR(100) DEFAULT NULL,
    min_bedrooms INT DEFAULT NULL,
    min_bathrooms INT DEFAULT NULL,
    budget_max DECIMAL(15,2) DEFAULT NULL,
    comments_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_slug ON property_requests(slug);`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_user_id ON property_requests(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_city ON property_requests(desired_location_city);`,

  // comments
  `CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    parent_id VARCHAR(36) DEFAULT NULL,
    property_id VARCHAR(36) DEFAULT NULL,
    request_id VARCHAR(36) DEFAULT NULL,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE CASCADE,
    CONSTRAINT chk_comment_target CHECK (
        (property_id IS NOT NULL AND request_id IS NULL) OR
        (property_id IS NULL AND request_id IS NOT NULL)
    )
  );`,
  `CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_property_id ON comments(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(request_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);`,

  // google_sheet_configs
  `CREATE TABLE IF NOT EXISTS google_sheet_configs (
    id INT PRIMARY KEY DEFAULT 1,
    sheet_id VARCHAR(255) DEFAULT NULL,
    sheet_name VARCHAR(255) DEFAULT NULL,
    columns_to_display TEXT DEFAULT NULL,
    is_configured BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_google_sheet CHECK (id = 1)
  );`,
  `INSERT IGNORE INTO google_sheet_configs (id, is_configured) VALUES (1, FALSE);`,

  // site_settings
  `CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(255) DEFAULT 'PropSpot - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL,
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_ai_matching_section BOOLEAN DEFAULT TRUE,
    show_google_sheet_section BOOLEAN DEFAULT TRUE,
    landing_sections_order TEXT DEFAULT '["featured_list_requests", "ai_matching", "google_sheet"]',
    announcement_bar_text TEXT DEFAULT NULL,
    announcement_bar_link_url VARCHAR(2048) DEFAULT NULL,
    announcement_bar_link_text VARCHAR(255) DEFAULT NULL,
    announcement_bar_is_active BOOLEAN DEFAULT FALSE,
    announcement_bar_bg_color VARCHAR(20) DEFAULT '#FFB74D',
    announcement_bar_text_color VARCHAR(20) DEFAULT '#18181b',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_site_settings CHECK (id = 1)
  );`,
  `INSERT IGNORE INTO site_settings (id, site_title, landing_sections_order) VALUES
    (1, 'PropSpot - Encuentra Tu Próxima Propiedad', '["featured_list_requests", "ai_matching", "google_sheet"]');`,
  
  // contacts
  `CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    company_name VARCHAR(255) DEFAULT NULL,
    status ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'unqualified') DEFAULT 'new',
    source VARCHAR(100) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    last_contacted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_contacts_user_id_status (user_id, status),
    INDEX idx_contacts_user_id_email (user_id, email)
  );`,

  // contact_interactions
  `CREATE TABLE IF NOT EXISTS contact_interactions (
    id VARCHAR(36) PRIMARY KEY,
    contact_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    interaction_type ENUM('note', 'email_sent', 'email_received', 'call_made', 'call_received', 'meeting', 'message_sent', 'message_received', 'task_completed', 'property_viewing', 'offer_made', 'other') NOT NULL,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subject VARCHAR(255) DEFAULT NULL,
    description TEXT NOT NULL,
    outcome VARCHAR(255) DEFAULT NULL,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_interactions_contact_id_date (contact_id, interaction_date DESC),
    INDEX idx_interactions_user_id (user_id),
    INDEX idx_interactions_follow_up_date (follow_up_date)
  );`,

  // chat_conversations
  `CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) DEFAULT NULL,
    request_id VARCHAR(36) DEFAULT NULL,
    user_a_id VARCHAR(36) NOT NULL,
    user_b_id VARCHAR(36) NOT NULL,
    user_a_unread_count INT UNSIGNED NOT NULL DEFAULT 0,
    user_b_unread_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_conversation_participants UNIQUE (user_a_id, user_b_id, property_id, request_id),
    CONSTRAINT chk_different_users CHECK (user_a_id <> user_b_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_a ON chat_conversations(user_a_id, last_message_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_b ON chat_conversations(user_b_id, last_message_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_property ON chat_conversations(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_request ON chat_conversations(request_id);`,

  // chat_messages
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_read ON chat_messages(receiver_id, read_at);`
];

// --- Función principal del script ---
async function setupDatabase() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let dbConfig: PoolOptions | null = null;
  let pool: Pool | null = null;

  try {
    dbConfig = await getCredentials(rl);

    // 1. Verificar conexión
    console.log('\nIntentando conectar a la base de datos...');
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa.');
    connection.release();

    // 2. Crear tablas
    console.log('\nCreando tablas...');
    for (const stmt of SQL_STATEMENTS) {
      try {
        // MySQL no soporta múltiples sentencias en una sola llamada a execute() por defecto,
        // a menos que 'multipleStatements: true' esté en la config, lo cual es un riesgo.
        // Ejecutaremos una por una.
        // También, MySQL trata 'CREATE INDEX IF NOT EXISTS' como sintaxis válida
        // o la ignora si el índice ya existe, dependiendo de la versión.
        // Para declaraciones DDL como CREATE TABLE, execute no devuelve filas significativas.
        await pool.query(stmt);
        // Pequeño indicador de progreso
        if (stmt.trim().toUpperCase().startsWith('CREATE TABLE')) {
            const tableName = stmt.trim().split(' ')[2].replace('IF NOT EXISTS', '').trim();
            console.log(`  -> Tabla ${tableName} procesada.`);
        } else if (stmt.trim().toUpperCase().startsWith('INSERT IGNORE INTO')) {
             const tableName = stmt.trim().split(' ')[3].trim();
             console.log(`  -> Datos iniciales para ${tableName} procesados.`);
        }

      } catch (err: any) {
        // IGNORAR errores de "Duplicate key name" para CREATE INDEX
        if (err.code === 'ER_DUP_KEYNAME' && stmt.toUpperCase().includes('CREATE INDEX')) {
          const indexName = stmt.split(' ')[2];
          console.warn(`  ⚠️  Índice ${indexName} ya existe, omitiendo.`);
        } else if (err.code === 'ER_CONSTRAINT_FORMAT_ERROR' && stmt.toUpperCase().includes('CHECK (ID = 1)')) {
          console.warn(`  ⚠️  Constraint de CHECK (id=1) puede no ser soportado o ya existe, omitiendo error específico.`);
        }
        else {
          console.error(`\n❌ Error ejecutando SQL: \n${stmt}\nError: ${err.message}`);
          throw err; // Detener si hay un error crítico
        }
      }
    }
    console.log('✅ Todas las tablas y datos iniciales han sido procesados.');

    // 3. Crear usuario administrador
    console.log('\nCreando usuario administrador...');
    const adminEmail = 'admin@konecte.cl';
    const adminPassword = 'ola12345';
    const adminName = 'Administrador PropSpot';
    const adminRoleId = 'admin'; // Asegúrate que este rol exista desde los INSERTs anteriores

    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    
    if (Array.isArray(existingAdmin[0]) && existingAdmin[0].length > 0) {
      console.log(`  ⚠️  El usuario administrador ${adminEmail} ya existe.`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUserId = randomUUID();
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
        [adminUserId, adminName, adminEmail, hashedPassword, adminRoleId]
      );
      console.log(`  ✅ Usuario administrador ${adminEmail} creado con éxito.`);
      console.log(`     Contraseña: ${adminPassword} (¡Cámbiala después del primer inicio de sesión!)`);
    }

    console.log('\n🎉 ¡Configuración de la base de datos completada! 🎉');

  } catch (error: any) {
    console.error('\n❌ Error durante la configuración de la base de datos:', error.message);
    if (error.sqlMessage) {
      console.error('   Detalle SQL:', error.sqlMessage);
    }
  } finally {
    if (pool) {
      await pool.end();
      console.log('\nConexión a la base de datos cerrada.');
    }
    rl.close();
  }
}

setupDatabase();
