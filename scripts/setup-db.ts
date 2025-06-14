
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
  const database = await rl.question('Nombre de la Base de Datos (ej: konecte_db): ') || 'konecte_db';

  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error('El puerto debe ser un número válido.');
  }

  return { host, port, user, password, database, connectionLimit: 5, waitForConnections: true };
}

// --- Definición de todas las tablas y datos iniciales ---
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
    views_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
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
  `INSERT INTO google_sheet_configs (id, is_configured) VALUES (1, FALSE)
   ON DUPLICATE KEY UPDATE id = 1;`,

  // site_settings
  `CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(255) DEFAULT 'konecte - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL,
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_ai_matching_section BOOLEAN DEFAULT TRUE,
    show_google_sheet_section BOOLEAN DEFAULT TRUE,
    landing_sections_order TEXT DEFAULT NULL,
    announcement_bar_text TEXT DEFAULT NULL,
    announcement_bar_link_url VARCHAR(2048) DEFAULT NULL,
    announcement_bar_link_text VARCHAR(255) DEFAULT NULL,
    announcement_bar_is_active BOOLEAN DEFAULT FALSE,
    announcement_bar_bg_color VARCHAR(20) DEFAULT '#FFB74D',
    announcement_bar_text_color VARCHAR(20) DEFAULT '#18181b',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_site_settings CHECK (id = 1)
  );`,
  `INSERT INTO site_settings (
    id, site_title, logo_url,
    show_featured_listings_section, show_ai_matching_section, show_google_sheet_section,
    landing_sections_order,
    announcement_bar_is_active, announcement_bar_bg_color, announcement_bar_text_color
  )
  VALUES (
    1, 
    'konecte - Encuentra Tu Próxima Propiedad', 
    NULL, 
    TRUE, 
    TRUE, 
    TRUE, 
    '["featured_list_requests", "ai_matching", "google_sheet"]',
    FALSE,
    '#FFB74D',
    '#18181b'
  )
  ON DUPLICATE KEY UPDATE
    site_title = VALUES(site_title),
    logo_url = VALUES(logo_url),
    show_featured_listings_section = VALUES(show_featured_listings_section),
    show_ai_matching_section = VALUES(show_ai_matching_section),
    show_google_sheet_section = VALUES(show_google_sheet_section),
    landing_sections_order = COALESCE(site_settings.landing_sections_order, VALUES(landing_sections_order)),
    announcement_bar_text = COALESCE(site_settings.announcement_bar_text, VALUES(announcement_bar_text)),
    announcement_bar_link_url = COALESCE(site_settings.announcement_bar_link_url, VALUES(announcement_bar_link_url)),
    announcement_bar_link_text = COALESCE(site_settings.announcement_bar_link_text, VALUES(announcement_bar_link_text)),
    announcement_bar_is_active = VALUES(announcement_bar_is_active),
    announcement_bar_bg_color = VALUES(announcement_bar_bg_color),
    announcement_bar_text_color = VALUES(announcement_bar_text_color),
    updated_at = CURRENT_TIMESTAMP;`,
  `UPDATE site_settings
   SET landing_sections_order = '["featured_list_requests", "ai_matching", "google_sheet"]'
   WHERE id = 1 AND landing_sections_order IS NULL;`,
  
  // contacts (CRM)
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

  // contact_interactions (CRM)
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
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_read ON chat_messages(receiver_id, read_at);`,

  // editable_texts
  `CREATE TABLE IF NOT EXISTS editable_texts (
    id VARCHAR(255) PRIMARY KEY,
    page_group VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    content_default TEXT,
    content_current TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  `CREATE INDEX IF NOT EXISTS idx_editable_texts_page_group ON editable_texts(page_group);`,

  // --- Default Editable Texts ---
  `INSERT IGNORE INTO editable_texts (id, page_group, description, content_default, content_current) VALUES
    ('home_hero_title', 'home', 'Título principal de la página de inicio', 'Encuentra Tu Espacio Ideal en konecte', 'Encuentra Tu Espacio Ideal en konecte'),
    ('home_hero_subtitle', 'home', 'Subtítulo de la página de inicio', 'Descubre, publica y comenta sobre propiedades en arriendo o venta. ¡O publica lo que estás buscando!', 'Descubre, publica y comenta sobre propiedades en arriendo o venta. ¡O publica lo que estás buscando!'),
    ('home_search_placeholder', 'home', 'Placeholder para la barra de búsqueda en la página de inicio', 'Buscar por ubicación, tipo, características...', 'Buscar por ubicación, tipo, características...'),
    ('home_publish_property_button', 'home', 'Texto del botón "Publicar Propiedad" en el hero', 'Publicar Propiedad', 'Publicar Propiedad'),
    ('home_publish_request_button', 'home', 'Texto del botón "Publicar Solicitud" en el hero', 'Publicar Solicitud', 'Publicar Solicitud'),
    ('plans_page_main_title', 'plans_page', 'Título principal de la página de planes', '¡Contratación 100% online!', '¡Contratación 100% online!'),
    ('auth_signin_page_title', 'auth_signin', 'Título de la página de inicio de sesión', '¡Bienvenido de Nuevo!', '¡Bienvenido de Nuevo!'),
    ('auth_signin_page_description', 'auth_signin', 'Descripción de la página de inicio de sesión', 'Inicia sesión para acceder a tu cuenta de konecte.', 'Inicia sesión para acceder a tu cuenta de konecte.'),
    ('auth_signin_email_label', 'auth_signin', 'Etiqueta para el campo de email en inicio de sesión', 'Correo Electrónico', 'Correo Electrónico'),
    ('auth_signin_password_label', 'auth_signin', 'Etiqueta para el campo de contraseña en inicio de sesión', 'Contraseña', 'Contraseña'),
    ('auth_signin_forgot_password_link', 'auth_signin', 'Texto del enlace "¿Olvidaste tu contraseña?"', '¿Olvidaste tu contraseña?', '¿Olvidaste tu contraseña?'),
    ('auth_signin_button_text', 'auth_signin', 'Texto del botón de inicio de sesión', 'Iniciar Sesión', 'Iniciar Sesión'),
    ('auth_signin_signup_prompt', 'auth_signin', 'Texto del prompt para registrarse', '¿No tienes una cuenta?', '¿No tienes una cuenta?'),
    ('auth_signin_signup_link_text', 'auth_signin', 'Texto del enlace para registrarse', 'Regístrate', 'Regístrate'),
    ('auth_signup_page_title', 'auth_signup', 'Título de la página de registro', 'Crear una Cuenta', 'Crear una Cuenta'),
    ('auth_signup_page_description', 'auth_signup', 'Descripción de la página de registro', 'Únete a konecte para listar, encontrar y discutir propiedades.', 'Únete a konecte para listar, encontrar y discutir propiedades.'),
    ('auth_signup_name_label', 'auth_signup', 'Etiqueta para el campo de nombre en registro', 'Nombre Completo *', 'Nombre Completo *'),
    ('auth_signup_email_label', 'auth_signup', 'Etiqueta para el campo de email en registro', 'Correo Electrónico *', 'Correo Electrónico *'),
    ('auth_signup_rut_label', 'auth_signup', 'Etiqueta para el campo de RUT en registro', 'RUT (Empresa o Persona)', 'RUT (Empresa o Persona)'),
    ('auth_signup_phone_label', 'auth_signup', 'Etiqueta para el campo de teléfono en registro', 'Teléfono de Contacto', 'Teléfono de Contacto'),
    ('auth_signup_password_label', 'auth_signup', 'Etiqueta para el campo de contraseña en registro', 'Contraseña *', 'Contraseña *'),
    ('auth_signup_confirm_password_label', 'auth_signup', 'Etiqueta para el campo de confirmar contraseña en registro', 'Confirmar Contraseña *', 'Confirmar Contraseña *'),
    ('auth_signup_terms_label_part1', 'auth_signup', 'Texto de términos (parte 1)', 'Declaro conocer y aceptar los', 'Declaro conocer y aceptar los'),
    ('auth_signup_terms_link_terms', 'auth_signup', 'Texto del enlace a Términos y Condiciones', 'Términos y Condiciones', 'Términos y Condiciones'),
    ('auth_signup_terms_label_part2', 'auth_signup', 'Texto de términos (parte 2)', 'y la', 'y la'),
    ('auth_signup_terms_link_privacy', 'auth_signup', 'Texto del enlace a Política de Privacidad', 'Política de Privacidad', 'Política de Privacidad'),
    ('auth_signup_terms_label_part3', 'auth_signup', 'Texto de términos (parte 3)', '. *', '. *'),
    ('auth_signup_button_text', 'auth_signup', 'Texto del botón de registro', 'Registrarse', 'Registrarse'),
    ('auth_signup_signin_prompt', 'auth_signup', 'Texto del prompt para iniciar sesión', '¿Ya tienes una cuenta?', '¿Ya tienes una cuenta?'),
    ('auth_signup_signin_link_text', 'auth_signup', 'Texto del enlace para iniciar sesión', 'Inicia sesión', 'Inicia sesión');`,
  
  // --- Lead Tracking Tables ---
  `CREATE TABLE IF NOT EXISTS property_views (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON property_views(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);`,

  `CREATE TABLE IF NOT EXISTS property_inquiries (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    property_owner_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (property_owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_owner_id ON property_inquiries(property_owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id ON property_inquiries(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_submitted_at ON property_inquiries(submitted_at);`,

  // --- Property Visits Table ---
  `CREATE TABLE IF NOT EXISTS property_visits (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    visitor_user_id VARCHAR(36) NOT NULL,
    property_owner_user_id VARCHAR(36) NOT NULL,
    proposed_datetime DATETIME NOT NULL,
    confirmed_datetime DATETIME DEFAULT NULL,
    status ENUM(
        'pending_confirmation',
        'confirmed',
        'cancelled_by_visitor',
        'cancelled_by_owner',
        'rescheduled_by_owner',
        'completed',
        'visitor_no_show',
        'owner_no_show'
    ) NOT NULL DEFAULT 'pending_confirmation',
    visitor_notes TEXT DEFAULT NULL,
    owner_notes TEXT DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_visits_property_id_status ON property_visits(property_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_visitor_id_status ON property_visits(visitor_user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_owner_id_status ON property_visits(property_owner_user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_proposed_datetime ON property_visits(proposed_datetime);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_confirmed_datetime ON property_visits(confirmed_datetime);`
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

    console.log('\nIntentando conectar a la base de datos...');
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa.');
    connection.release();

    console.log('\nCreando tablas y datos iniciales...');
    for (const stmt of SQL_STATEMENTS) {
      try {
        await pool.query(stmt);
        if (stmt.trim().toUpperCase().startsWith('CREATE TABLE')) {
            const tableNameMatch = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
                 console.log(`  -> Tabla ${tableNameMatch[1]} procesada.`);
            } else {
                 console.log(`  -> Sentencia CREATE TABLE procesada.`);
            }
        } else if (stmt.trim().toUpperCase().startsWith('INSERT INTO') || stmt.trim().toUpperCase().startsWith('INSERT IGNORE INTO')) {
             const tableNameMatch = stmt.match(/INSERT (?:IGNORE )?INTO (\w+)/i);
             if (tableNameMatch && tableNameMatch[1]) {
                 console.log(`  -> Datos iniciales para ${tableNameMatch[1]} procesados.`);
             } else {
                  console.log(`  -> Sentencia INSERT procesada.`);
             }
        } else if (stmt.trim().toUpperCase().startsWith('UPDATE')) {
            const tableNameMatch = stmt.match(/UPDATE (\w+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
                console.log(`  -> Sentencia UPDATE para ${tableNameMatch[1]} procesada.`);
            } else {
                 console.log(`  -> Sentencia UPDATE procesada.`);
            }
        } else if (stmt.trim().toUpperCase().startsWith('CREATE INDEX')) {
            const indexNameMatch = stmt.match(/CREATE INDEX IF NOT EXISTS (\w+)/i) || stmt.match(/INDEX (\w+)/i);
            const indexName = indexNameMatch ? indexNameMatch[1] : 'desconocido';
            console.log(`  -> Índice ${indexName} procesado.`);
        }
      } catch (err: any) {
        if (err.code === 'ER_DUP_KEYNAME' && stmt.toUpperCase().includes('CREATE INDEX')) {
          const indexNameMatch = stmt.match(/CREATE INDEX IF NOT EXISTS (\w+)/i) || stmt.match(/INDEX (\w+)/i);
          const indexName = indexNameMatch ? indexNameMatch[1] : 'desconocido';
          console.warn(`  ⚠️  Índice ${indexName} ya existe, omitiendo.`);
        } else if (err.code === 'ER_CONSTRAINT_FORMAT_ERROR' && stmt.toUpperCase().includes('CHECK (ID = 1)')) {
          console.warn(`  ⚠️  Constraint de CHECK (id=1) puede no ser soportado o ya existe, omitiendo error específico.`);
        } else if (err.code === 'ER_WRONG_VALUE_FOR_TYPE' && stmt.toUpperCase().includes('CONSTRAINT CHK_COMMENT_TARGET CHECK')) {
          console.warn(`  ⚠️  Constraint CHECK para comments (chk_comment_target) puede no ser soportado en su versión de MySQL o ya existe. Omitiendo error específico.`);
        } else if (err.code === 'ER_CANT_CREATE_TABLE' && err.message.includes('errno: 150')) {
            console.warn(`  ⚠️  Error al crear tabla (posiblemente FK a tabla no existente aún, o error de tipo). MySQL a veces es sensible al orden. Statement: ${stmt.substring(0,100)}... Error: ${err.message}`);
        }
        else {
          console.error(`\n❌ Error ejecutando SQL: \n${stmt.substring(0, 200)}...\nError: ${err.message}`);
          // Considerar no detener el script por errores no críticos, o hacer el error handling más granular.
          // Por ahora, continuaremos para intentar crear el resto.
          // throw err; // Descomentar para detener en error crítico
        }
      }
    }
    console.log('✅ Todas las tablas y datos iniciales han sido procesados.');

    console.log('\nCreando usuario administrador...');
    const adminEmail = 'admin@konecte.cl';
    const adminPassword = 'ola12345';
    const adminName = 'Administrador konecte';
    const adminRoleId = 'admin'; 

    const existingAdminResult = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    // MySQL/Promise returns [rows, fields]
    const existingAdmin = Array.isArray(existingAdminResult) && Array.isArray(existingAdminResult[0]) ? existingAdminResult[0] : [];


    if (Array.isArray(existingAdmin) && existingAdmin.length > 0) {
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


    
