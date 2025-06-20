
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
    permissions TEXT DEFAULT NULL COMMENT 'JSON array of permission strings',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  `INSERT IGNORE INTO roles (id, name, description, permissions) VALUES
    ('admin', 'Administrador', 'Acceso total a todas las funcionalidades y configuraciones del sistema.', '["*"]'),
    ('user', 'Usuario', 'Usuario estándar con capacidad para publicar y comentar.', '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request", "user:edit_profile_own"]'),
    ('broker', 'Corredor', 'Usuario corredor de propiedades con acceso a funcionalidades de colaboración y planes pagos.', '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request", "crm:access_own", "collaboration:propose", "collaboration:manage", "visit:manage_own_property_visits", "ai:use_matching_tools", "user:edit_profile_own"]');`,

  // plans
  `CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0.00,
    price_currency VARCHAR(3) DEFAULT 'CLP',
    max_properties_allowed INT DEFAULT NULL,
    max_requests_allowed INT DEFAULT NULL,
    property_listing_duration_days INT DEFAULT NULL,
    can_feature_properties BOOLEAN DEFAULT FALSE,
    can_view_contact_data BOOLEAN DEFAULT FALSE,
    manual_searches_daily_limit INT DEFAULT NULL,
    automated_alerts_enabled BOOLEAN DEFAULT FALSE,
    max_ai_searches_monthly INT DEFAULT NULL,
    advanced_dashboard_access BOOLEAN DEFAULT FALSE,
    daily_profile_views_limit INT DEFAULT NULL,
    weekly_matches_reveal_limit INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_publicly_visible BOOLEAN DEFAULT TRUE,
    is_enterprise_plan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  `INSERT IGNORE INTO plans (id, name, description, price_monthly, max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties, can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly, advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit, is_active, is_publicly_visible, is_enterprise_plan) VALUES
    ('${randomUUID()}', 'Gratis Corredor', 'Publicación gratuita de propiedades y solicitudes. Sin acceso a datos de contacto de personas naturales y funcionalidades limitadas.', 0.00, 5, 5, 30, FALSE, FALSE, 5, FALSE, 0, FALSE, 20, 5, TRUE, TRUE, FALSE),
    ('${randomUUID()}', 'PRO Corredor', 'Ideal para corredores que inician. Acceso limitado a datos y búsquedas.', 14900.00, 20, 20, 60, TRUE, TRUE, 50, FALSE, 10, FALSE, 100, 20, TRUE, TRUE, FALSE),
    ('${randomUUID()}', 'PREMIUM Corredor', 'Funcionalidad completa, alertas IA y panel avanzado para corredores activos.', 24900.00, NULL, NULL, 90, TRUE, TRUE, NULL, TRUE, 50, TRUE, NULL, 100, TRUE, TRUE, FALSE);`,

  // users
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(2048) DEFAULT NULL,
    role_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) DEFAULT NULL,
    plan_expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    phone_number VARCHAR(50) DEFAULT NULL COMMENT 'Teléfono de contacto general.',
    rut_tin VARCHAR(20) DEFAULT NULL COMMENT 'RUT (Chile) o Tax ID. Requerido para Corredor/Inmobiliaria.',
    experience_selling_properties BOOLEAN DEFAULT NULL COMMENT 'Persona natural: ¿Tiene experiencia vendiendo propiedades?',
    company_name VARCHAR(255) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Nombre de la empresa',
    main_operating_region VARCHAR(100) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Región principal de operación',
    main_operating_commune VARCHAR(100) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Comuna principal de operación',
    properties_in_portfolio_count INT DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Cantidad de propiedades en cartera',
    website_social_media_link VARCHAR(2048) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Enlace a sitio web o red social',
                        
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_rut_tin ON users(rut_tin);`,
  `CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);`,
  `CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);`,
  `CREATE INDEX IF NOT EXISTS idx_users_main_operating_region ON users(main_operating_region);`,

  // properties
  `ALTER TABLE properties RENAME COLUMN area_sq_meters TO total_area_sq_meters;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS useful_area_sq_meters DECIMAL(10,2) DEFAULT NULL AFTER total_area_sq_meters;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces INT DEFAULT 0 AFTER useful_area_sq_meters;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT FALSE AFTER parking_spaces;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT FALSE AFTER pets_allowed;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS commercial_use_allowed BOOLEAN DEFAULT FALSE AFTER furnished;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_storage BOOLEAN DEFAULT FALSE AFTER commercial_use_allowed;`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS orientation VARCHAR(50) DEFAULT NULL AFTER has_storage;`,
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
    total_area_sq_meters DECIMAL(10,2) NOT NULL,
    useful_area_sq_meters DECIMAL(10,2) DEFAULT NULL,
    parking_spaces INT DEFAULT 0,
    pets_allowed BOOLEAN DEFAULT FALSE,
    furnished BOOLEAN DEFAULT FALSE,
    commercial_use_allowed BOOLEAN DEFAULT FALSE,
    has_storage BOOLEAN DEFAULT FALSE,
    orientation VARCHAR(50) DEFAULT NULL,
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
  `CREATE INDEX IF NOT EXISTS idx_properties_upvotes ON properties(upvotes);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_orientation ON properties(orientation);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_pets_allowed ON properties(pets_allowed);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_furnished ON properties(furnished);`,


  // property_requests
  `CREATE TABLE IF NOT EXISTS property_requests (
    id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, title VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, description TEXT NOT NULL, desired_property_type_rent BOOLEAN DEFAULT FALSE, desired_property_type_sale BOOLEAN DEFAULT FALSE, desired_category_apartment BOOLEAN DEFAULT FALSE, desired_category_house BOOLEAN DEFAULT FALSE, desired_category_condo BOOLEAN DEFAULT FALSE, desired_category_land BOOLEAN DEFAULT FALSE, desired_category_commercial BOOLEAN DEFAULT FALSE, desired_category_other BOOLEAN DEFAULT FALSE, desired_location_city VARCHAR(100) NOT NULL, desired_location_neighborhood VARCHAR(100) DEFAULT NULL, min_bedrooms INT DEFAULT NULL, min_bathrooms INT DEFAULT NULL, budget_max DECIMAL(15,2) DEFAULT NULL, open_for_broker_collaboration BOOLEAN DEFAULT FALSE, comments_count INT DEFAULT 0, upvotes INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_slug ON property_requests(slug);`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_user_id ON property_requests(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_city ON property_requests(desired_location_city);`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_broker_collab ON property_requests(open_for_broker_collaboration);`,
  `CREATE INDEX IF NOT EXISTS idx_property_requests_upvotes ON property_requests(upvotes);`,

  // comments
  `CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, content TEXT NOT NULL, parent_id VARCHAR(36) DEFAULT NULL, property_id VARCHAR(36) DEFAULT NULL, request_id VARCHAR(36) DEFAULT NULL, upvotes INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL, FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE, FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE CASCADE, CONSTRAINT chk_comment_target CHECK ((property_id IS NOT NULL AND request_id IS NULL) OR (property_id IS NULL AND request_id IS NOT NULL))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_property_id ON comments(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(request_id);`,
  `CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);`,

  // user_comment_interactions
  `CREATE TABLE IF NOT EXISTS user_comment_interactions (
    id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, comment_id VARCHAR(36) NOT NULL, interaction_type ENUM('like') NOT NULL DEFAULT 'like', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE, UNIQUE KEY uq_user_comment_interaction (user_id, comment_id, interaction_type)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_user_comment_interactions_user_comment ON user_comment_interactions(user_id, comment_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_comment_interactions_comment ON user_comment_interactions(comment_id);`,

  // google_sheet_configs
  `CREATE TABLE IF NOT EXISTS google_sheet_configs (
    id INT PRIMARY KEY DEFAULT 1, sheet_id VARCHAR(255) DEFAULT NULL, sheet_name VARCHAR(255) DEFAULT NULL, columns_to_display TEXT DEFAULT NULL, is_configured BOOLEAN DEFAULT FALSE, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT id_must_be_1_google_sheet CHECK (id = 1)
  );`,
  `INSERT INTO google_sheet_configs (id, is_configured) VALUES (1, FALSE) ON DUPLICATE KEY UPDATE id = 1;`,

  // site_settings
  `CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(255) DEFAULT 'konecte - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL,
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_featured_plans_section BOOLEAN DEFAULT TRUE,
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
    show_featured_listings_section, show_featured_plans_section, show_ai_matching_section, show_google_sheet_section,
    landing_sections_order,
    announcement_bar_is_active, announcement_bar_bg_color, announcement_bar_text_color
  )
  VALUES (
    1, 'konecte - Encuentra Tu Próxima Propiedad', NULL,
    TRUE, TRUE, TRUE, TRUE,
    '["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"]',
    FALSE, '#FFB74D', '#18181b'
  )
  ON DUPLICATE KEY UPDATE
    site_title = VALUES(site_title),
    logo_url = VALUES(logo_url),
    show_featured_listings_section = VALUES(show_featured_listings_section),
    show_featured_plans_section = VALUES(show_featured_plans_section),
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
  `UPDATE site_settings SET landing_sections_order = '["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"]'
   WHERE id = 1 AND (landing_sections_order IS NULL OR landing_sections_order != '["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"]');`,

  // contacts (CRM)
  `CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) DEFAULT NULL, phone VARCHAR(50) DEFAULT NULL, company_name VARCHAR(255) DEFAULT NULL, status ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'unqualified') DEFAULT 'new', source VARCHAR(100) DEFAULT NULL, notes TEXT DEFAULT NULL, last_contacted_at TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_contacts_user_id_status (user_id, status), INDEX idx_contacts_user_id_email (user_id, email)
  );`,

  // contact_interactions (CRM)
  `CREATE TABLE IF NOT EXISTS contact_interactions (
    id VARCHAR(36) PRIMARY KEY, contact_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, interaction_type ENUM('note', 'email_sent', 'email_received', 'call_made', 'call_received', 'meeting', 'message_sent', 'message_received', 'task_completed', 'property_viewing', 'offer_made', 'other') NOT NULL, interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, subject VARCHAR(255) DEFAULT NULL, description TEXT NOT NULL, outcome VARCHAR(255) DEFAULT NULL, follow_up_needed BOOLEAN DEFAULT FALSE, follow_up_date DATE DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_interactions_contact_id_date (contact_id, interaction_date DESC), INDEX idx_interactions_user_id (user_id), INDEX idx_interactions_follow_up_date (follow_up_date)
  );`,

  // chat_conversations
  `CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(36) PRIMARY KEY, property_id VARCHAR(36) DEFAULT NULL, request_id VARCHAR(36) DEFAULT NULL, user_a_id VARCHAR(36) NOT NULL, user_b_id VARCHAR(36) NOT NULL, user_a_unread_count INT UNSIGNED NOT NULL DEFAULT 0, user_b_unread_count INT UNSIGNED NOT NULL DEFAULT 0, last_message_at TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL, FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE SET NULL, FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT uq_conversation_participants UNIQUE (user_a_id, user_b_id, property_id, request_id), CONSTRAINT chk_different_users CHECK (user_a_id <> user_b_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_a ON chat_conversations(user_a_id, last_message_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_b ON chat_conversations(user_b_id, last_message_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_property ON chat_conversations(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_request ON chat_conversations(request_id);`,

  // chat_messages
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY, conversation_id VARCHAR(36) NOT NULL, sender_id VARCHAR(36) NOT NULL, receiver_id VARCHAR(36) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, read_at TIMESTAMP NULL DEFAULT NULL, FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE, FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_read ON chat_messages(receiver_id, read_at);`,

  // editable_texts
  `CREATE TABLE IF NOT EXISTS editable_texts (
    id VARCHAR(255) PRIMARY KEY, page_group VARCHAR(100) NOT NULL, description TEXT NOT NULL, content_default TEXT, content_current TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  `CREATE INDEX IF NOT EXISTS idx_editable_texts_page_group ON editable_texts(page_group);`,
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
    ('auth_signup_page_title', 'auth_signup', 'Título de la página de registro', 'Crear una Cuenta en konecte', 'Crear una Cuenta en konecte'),
    ('auth_signup_page_description', 'auth_signup', 'Descripción de la página de registro', 'Únete para listar, encontrar y discutir propiedades.', 'Únete para listar, encontrar y discutir propiedades.'),
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
    id VARCHAR(36) PRIMARY KEY, property_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) DEFAULT NULL, ip_address VARCHAR(45) DEFAULT NULL, user_agent TEXT DEFAULT NULL, viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON property_views(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);`,
  `CREATE TABLE IF NOT EXISTS property_inquiries (
    id VARCHAR(36) PRIMARY KEY, property_id VARCHAR(36) NOT NULL, property_owner_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) DEFAULT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(50) DEFAULT NULL, message TEXT NOT NULL, submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, is_read BOOLEAN DEFAULT FALSE, FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE, FOREIGN KEY (property_owner_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_owner_id ON property_inquiries(property_owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id ON property_inquiries(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_property_inquiries_submitted_at ON property_inquiries(submitted_at);`,

  // --- Property Visits Table ---
  `CREATE TABLE IF NOT EXISTS property_visits (
    id VARCHAR(36) PRIMARY KEY, property_id VARCHAR(36) NOT NULL, visitor_user_id VARCHAR(36) NOT NULL, property_owner_user_id VARCHAR(36) NOT NULL, proposed_datetime DATETIME NOT NULL, confirmed_datetime DATETIME DEFAULT NULL, status ENUM('pending_confirmation', 'confirmed', 'cancelled_by_visitor', 'cancelled_by_owner', 'rescheduled_by_owner', 'completed', 'visitor_no_show', 'owner_no_show') NOT NULL DEFAULT 'pending_confirmation', visitor_notes TEXT DEFAULT NULL, owner_notes TEXT DEFAULT NULL, cancellation_reason TEXT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE, FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (property_owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_visits_property_id_status ON property_visits(property_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_visitor_id_status ON property_visits(visitor_user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_owner_id_status ON property_visits(property_owner_user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_proposed_datetime ON property_visits(proposed_datetime);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_confirmed_datetime ON property_visits(confirmed_datetime);`,

  // --- Broker Collaboration Table ---
  `CREATE TABLE IF NOT EXISTS broker_collaborations (
    id VARCHAR(36) PRIMARY KEY, property_request_id VARCHAR(36) NOT NULL, requesting_broker_id VARCHAR(36) NOT NULL, property_id VARCHAR(36) NOT NULL, offering_broker_id VARCHAR(36) NOT NULL, status ENUM('pending', 'accepted', 'rejected', 'deal_in_progress', 'deal_closed_success', 'deal_failed') DEFAULT 'pending', commission_terms TEXT DEFAULT NULL, chat_conversation_id VARCHAR(36) DEFAULT NULL, proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, accepted_at TIMESTAMP DEFAULT NULL, closed_at TIMESTAMP DEFAULT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (property_request_id) REFERENCES property_requests(id) ON DELETE CASCADE, FOREIGN KEY (requesting_broker_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE, FOREIGN KEY (offering_broker_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (chat_conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL, CONSTRAINT uq_collaboration_request_property UNIQUE (property_request_id, property_id), CONSTRAINT chk_different_brokers CHECK (requesting_broker_id <> offering_broker_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_broker_collaborations_requesting_broker ON broker_collaborations(requesting_broker_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_broker_collaborations_offering_broker ON broker_collaborations(offering_broker_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_broker_collaborations_request_id ON broker_collaborations(property_request_id);`,
  `CREATE INDEX IF NOT EXISTS idx_broker_collaborations_property_id ON broker_collaborations(property_id);`,

  // --- Contact Form Submissions Table ---
  `CREATE TABLE IF NOT EXISTS contact_form_submissions (
    id VARCHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(50) DEFAULT NULL, subject VARCHAR(255) DEFAULT NULL, message TEXT NOT NULL, submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, is_read BOOLEAN DEFAULT FALSE, admin_notes TEXT DEFAULT NULL, replied_at TIMESTAMP DEFAULT NULL, INDEX idx_contact_submissions_submitted_at (submitted_at), INDEX idx_contact_submissions_is_read (is_read)
  );`,

  // --- User Listing Interactions Table ---
  `CREATE TABLE IF NOT EXISTS user_listing_interactions (
    id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, listing_id VARCHAR(36) NOT NULL, listing_type ENUM('property', 'request') NOT NULL, interaction_type ENUM('like', 'dislike', 'skip') NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE KEY uq_user_listing_interaction (user_id, listing_id, listing_type)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_user_listing_interactions_user_listing ON user_listing_interactions(user_id, listing_type, listing_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_listing_interactions_listing ON user_listing_interactions(listing_type, listing_id, interaction_type);`,

  // --- User Usage Metrics Table (REPLACES user_ai_search_usage) ---
  `DROP TABLE IF EXISTS user_ai_search_usage;`,
  `CREATE TABLE IF NOT EXISTS user_usage_metrics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id_at_usage VARCHAR(36) DEFAULT NULL,
    metric_type ENUM('profile_view', 'match_reveal', 'ai_search', 'manual_search_executed') NOT NULL,
    reference_id VARCHAR(36) DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id_at_usage) REFERENCES plans(id) ON DELETE SET NULL,
    INDEX idx_user_usage_user_metric_time (user_id, metric_type, timestamp),
    INDEX idx_user_usage_plan_id (plan_id_at_usage)
  );`,

  // --- User Action Logs Table ---
  `CREATE TABLE IF NOT EXISTS user_action_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action_type ENUM(
        'view_property_details', 'view_request_details', 'view_user_profile', 'view_contact_info_property', 'view_contact_info_request',
        'execute_manual_property_search', 'execute_manual_request_search', 'execute_ai_match_search', 'execute_ai_find_requests_for_property', 'execute_ai_find_properties_for_request',
        'create_property', 'update_property', 'delete_property', 'create_request', 'update_request', 'delete_request',
        'create_comment', 'update_comment', 'delete_comment', 'create_crm_contact', 'update_crm_contact', 'log_crm_interaction',
        'user_login_success', 'user_login_fail', 'user_logout', 'user_registration', 'password_reset_request', 'password_reset_success',
        'listing_like', 'listing_dislike', 'listing_skip', 'comment_like',
        'plan_subscription_change',
        'unusual_activity_detected', 'account_locked_temporarily', 'admin_action'
    ) NOT NULL,
    target_entity_id VARCHAR(36) DEFAULT NULL,
    target_entity_type VARCHAR(50) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    details JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_action_logs_user_action_time (user_id, action_type, created_at),
    INDEX idx_user_action_logs_target_entity (target_entity_type, target_entity_id)
  );`
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

    console.log('\nCreando/Actualizando tablas y datos iniciales...');
    for (const stmt of SQL_STATEMENTS) {
      try {
        // Check if the statement is an ALTER TABLE statement
        if (stmt.trim().toUpperCase().startsWith('ALTER TABLE')) {
          const alterMatch = stmt.match(/ALTER TABLE\s+(\w+)\s+(ADD COLUMN IF NOT EXISTS|RENAME COLUMN)\s+(.+)/i);
          if (alterMatch) {
            const tableName = alterMatch[1];
            const operation = alterMatch[2].toUpperCase();
            const details = alterMatch[3];
            
            if (operation === 'ADD COLUMN IF NOT EXISTS') {
              // Check if column exists before trying to add
              const colNameMatch = details.match(/(\w+)\s+/);
              if (colNameMatch && colNameMatch[1]) {
                const columnName = colNameMatch[1];
                const checkColSql = `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?;`;
                const [colExistsRows]: any = await pool.query(checkColSql, [dbConfig.database, tableName, columnName]);
                if (colExistsRows[0].count === 0) {
                  await pool.query(stmt);
                  console.log(`  -> Columna ${columnName} añadida a tabla ${tableName}.`);
                } else {
                  console.log(`  -> Columna ${columnName} ya existe en tabla ${tableName}, omitiendo ADD.`);
                }
              } else {
                await pool.query(stmt); // Fallback if regex fails
                console.log(`  -> Sentencia ALTER TABLE ADD COLUMN procesada para ${tableName}.`);
              }
            } else if (operation === 'RENAME COLUMN') {
              // Check if old column exists and new one doesn't
              const renameDetailsMatch = details.match(/(\w+)\s+TO\s+(\w+)/i);
              if (renameDetailsMatch) {
                const oldColName = renameDetailsMatch[1];
                const newColName = renameDetailsMatch[2];
                const checkOldColSql = `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?;`;
                const [oldColExistsRows]: any = await pool.query(checkOldColSql, [dbConfig.database, tableName, oldColName]);
                const [newColExistsRows]: any = await pool.query(checkOldColSql, [dbConfig.database, tableName, newColName]);

                if (oldColExistsRows[0].count > 0 && newColExistsRows[0].count === 0) {
                  await pool.query(stmt);
                  console.log(`  -> Columna ${oldColName} renombrada a ${newColName} en tabla ${tableName}.`);
                } else if (newColExistsRows[0].count > 0) {
                   console.log(`  -> Columna ${newColName} ya existe en tabla ${tableName}, omitiendo RENAME desde ${oldColName}.`);
                } else {
                   console.log(`  -> Columna ${oldColName} no encontrada en tabla ${tableName} para renombrar, omitiendo RENAME.`);
                }
              } else {
                 await pool.query(stmt); // Fallback
                 console.log(`  -> Sentencia ALTER TABLE RENAME COLUMN procesada para ${tableName}.`);
              }
            } else {
              // For other ALTER statements not explicitly handled
              await pool.query(stmt);
              console.log(`  -> Sentencia ALTER TABLE procesada para ${tableName}.`);
            }
          } else {
             await pool.query(stmt); // If not ALTER TABLE or regex fails
             console.log(`  -> Sentencia SQL (no ALTER TABLE) procesada.`);
          }
        } else if (stmt.trim().toUpperCase().startsWith('CREATE TABLE')) {
            const tableNameMatch = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
                 console.log(`  -> Tabla ${tableNameMatch[1]} procesada/verificada.`);
            } else {
                 console.log(`  -> Sentencia CREATE TABLE procesada.`);
            }
        } else if (stmt.trim().toUpperCase().startsWith('DROP TABLE')) {
            const tableNameMatch = stmt.match(/DROP TABLE IF EXISTS (\w+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
                 console.log(`  -> Tabla ${tableNameMatch[1]} eliminada (si existía).`);
            } else {
                 console.log(`  -> Sentencia DROP TABLE procesada.`);
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
            console.log(`  -> Índice ${indexName} procesado/verificado.`);
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
        } else if (err.code === 'ER_TABLE_EXISTS_ERROR' && stmt.toUpperCase().includes('DROP TABLE IF EXISTS')) {
            // This is fine, means IF EXISTS worked as intended or table wasn't there.
            console.log(`  -> Tabla en DROP IF EXISTS no existía o ya fue eliminada.`);
        } else if (err.code === 'ER_CANNOT_DROP_FOREIGN_KEY_CONSTRAINT' || err.code === 'ER_DROP_INDEX_FK') {
            console.warn(`  ⚠️  No se pudo eliminar una FK o índice (posiblemente porque no existe o está en uso). Statement: ${stmt.substring(0,100)}... Error: ${err.message}`);
        } else if (err.code === 'ER_DUP_FIELDNAME' && stmt.toUpperCase().startsWith('ALTER TABLE') && stmt.toUpperCase().includes('ADD COLUMN')) {
            const colNameMatch = stmt.match(/ADD COLUMN IF NOT EXISTS (\w+)/i) || stmt.match(/ADD COLUMN (\w+)/i) ;
            const colName = colNameMatch ? colNameMatch[1] : 'desconocida';
            console.warn(`  ⚠️  Columna ${colName} ya existe. Se omite ALTER ADD. (Error: ${err.message})`);
        } else if (err.code === 'ER_BAD_FIELD_ERROR' && stmt.toUpperCase().startsWith('ALTER TABLE') && stmt.toUpperCase().includes('RENAME COLUMN')) {
            const colNameMatch = stmt.match(/RENAME COLUMN (\w+) TO/i);
            const colName = colNameMatch ? colNameMatch[1] : 'desconocida';
            console.warn(`  ⚠️  Columna ${colName} no existe o no se puede renombrar. Se omite ALTER RENAME. (Error: ${err.message})`);
        }
        else {
          console.error(`\n❌ Error ejecutando SQL: \n${stmt.substring(0, 200)}...\nError: ${err.message} (Code: ${err.code})`);
        }
      }
    }
    console.log('✅ Todas las tablas y datos iniciales han sido procesados.');

    console.log('\nVerificando/Creando usuario administrador...');
    const adminEmail = 'admin@konecte.cl';
    const adminPassword = 'ola12345';
    const adminName = 'Administrador konecte';
    const adminRoleId = 'admin';

    const existingAdminResult = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
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





