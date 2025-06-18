-- konecte Project - Full SQL Schema
-- Generated: YYYY-MM-DD HH:MM:SS

-- -----------------------------------------------------
-- Table `roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `permissions` TEXT NULL DEFAULT NULL COMMENT 'JSON array of permission strings',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB;

INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `permissions`) VALUES
('admin', 'Administrador', 'Acceso total a todas las funcionalidades y configuraciones del sistema.', '["*"]'),
('user', 'Usuario', 'Usuario estándar con capacidad para publicar y comentar.', '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request"]'),
('broker', 'Corredor', 'Usuario corredor de propiedades con acceso a funcionalidades de colaboración y planes pagos.', '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request", "crm:access_own", "collaboration:propose", "collaboration:manage", "visit:manage_own_property_visits", "ai:use_matching_tools"]');

-- -----------------------------------------------------
-- Table `plans`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `price_monthly` DECIMAL(10,2) NULL DEFAULT 0.00,
  `price_currency` VARCHAR(3) NULL DEFAULT 'CLP',
  `max_properties_allowed` INT NULL DEFAULT NULL,
  `max_requests_allowed` INT NULL DEFAULT NULL,
  `property_listing_duration_days` INT NULL DEFAULT NULL,
  `can_feature_properties` TINYINT(1) NULL DEFAULT 0,
  `can_view_contact_data` TINYINT(1) NULL DEFAULT 0,
  `manual_searches_daily_limit` INT NULL DEFAULT NULL,
  `automated_alerts_enabled` TINYINT(1) NULL DEFAULT 0,
  `max_ai_searches_monthly` INT NULL DEFAULT NULL,
  `advanced_dashboard_access` TINYINT(1) NULL DEFAULT 0,
  `daily_profile_views_limit` INT NULL DEFAULT NULL,
  `weekly_matches_reveal_limit` INT NULL DEFAULT NULL,
  `is_active` TINYINT(1) NULL DEFAULT 1,
  `is_publicly_visible` TINYINT(1) NULL DEFAULT 1,
  `is_enterprise_plan` TINYINT(1) NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB;

-- Sample plans data might be inserted by setup-db.ts using randomUUID(), so direct INSERTs here are for reference
-- Example:
-- INSERT IGNORE INTO `plans` (id, name, description, price_monthly, max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties, can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly, advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit, is_active, is_publicly_visible, is_enterprise_plan) VALUES
-- (UUID(), 'Gratis Corredor', 'Publicación gratuita...', 0.00, 5, 5, 30, FALSE, FALSE, 5, FALSE, 0, FALSE, 20, 5, TRUE, TRUE, FALSE),
-- (UUID(), 'PRO Corredor', 'Ideal para corredores...', 14900.00, 20, 20, 60, TRUE, TRUE, 50, FALSE, 10, FALSE, 100, 20, TRUE, TRUE, FALSE),
-- (UUID(), 'PREMIUM Corredor', 'Funcionalidad completa...', 24900.00, NULL, NULL, 90, TRUE, TRUE, NULL, TRUE, 50, TRUE, NULL, 100, TRUE, TRUE, FALSE);


-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rut_tin` VARCHAR(20) NULL DEFAULT NULL,
  `phone_number` VARCHAR(50) NULL DEFAULT NULL,
  `avatar_url` VARCHAR(2048) NULL DEFAULT NULL,
  `role_id` VARCHAR(36) NOT NULL,
  `plan_id` VARCHAR(36) NULL DEFAULT NULL,
  `plan_expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  INDEX `idx_users_role_id` (`role_id` ASC) VISIBLE,
  INDEX `idx_users_plan_id` (`plan_id` ASC) VISIBLE,
  INDEX `idx_users_rut_tin` (`rut_tin` ASC) VISIBLE,
  INDEX `idx_users_phone_number` (`phone_number` ASC) VISIBLE,
  CONSTRAINT `fk_users_role_id`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles` (`id`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_users_plan_id`
    FOREIGN KEY (`plan_id`)
    REFERENCES `plans` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `properties`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `property_type` ENUM('rent', 'sale') NOT NULL,
  `category` ENUM('apartment', 'house', 'condo', 'land', 'commercial', 'other') NOT NULL,
  `price` DECIMAL(15,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `bedrooms` INT NOT NULL DEFAULT 0,
  `bathrooms` INT NOT NULL DEFAULT 0,
  `area_sq_meters` DECIMAL(10,2) NOT NULL,
  `images` JSON NULL,
  `features` JSON NULL,
  `upvotes` INT NULL DEFAULT 0,
  `comments_count` INT NULL DEFAULT 0,
  `views_count` INT NULL DEFAULT 0,
  `inquiries_count` INT NULL DEFAULT 0,
  `is_active` TINYINT(1) NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE,
  INDEX `idx_properties_user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_properties_city` (`city` ASC) VISIBLE,
  INDEX `idx_properties_property_type` (`property_type` ASC) VISIBLE,
  INDEX `idx_properties_category` (`category` ASC) VISIBLE,
  INDEX `idx_properties_upvotes` (`upvotes` ASC) VISIBLE,
  CONSTRAINT `fk_properties_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `property_requests`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `property_requests` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `desired_property_type_rent` TINYINT(1) NULL DEFAULT 0,
  `desired_property_type_sale` TINYINT(1) NULL DEFAULT 0,
  `desired_category_apartment` TINYINT(1) NULL DEFAULT 0,
  `desired_category_house` TINYINT(1) NULL DEFAULT 0,
  `desired_category_condo` TINYINT(1) NULL DEFAULT 0,
  `desired_category_land` TINYINT(1) NULL DEFAULT 0,
  `desired_category_commercial` TINYINT(1) NULL DEFAULT 0,
  `desired_category_other` TINYINT(1) NULL DEFAULT 0,
  `desired_location_city` VARCHAR(100) NOT NULL,
  `desired_location_neighborhood` VARCHAR(100) NULL DEFAULT NULL,
  `min_bedrooms` INT NULL DEFAULT NULL,
  `min_bathrooms` INT NULL DEFAULT NULL,
  `budget_max` DECIMAL(15,2) NULL DEFAULT NULL,
  `open_for_broker_collaboration` TINYINT(1) NULL DEFAULT 0,
  `comments_count` INT NULL DEFAULT 0,
  `upvotes` INT NULL DEFAULT 0,
  `is_active` TINYINT(1) NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE,
  INDEX `idx_property_requests_user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_property_requests_city` (`desired_location_city` ASC) VISIBLE,
  INDEX `idx_property_requests_broker_collab` (`open_for_broker_collaboration` ASC) VISIBLE,
  INDEX `idx_property_requests_upvotes` (`upvotes` ASC) VISIBLE,
  CONSTRAINT `fk_property_requests_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `comments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `parent_id` VARCHAR(36) NULL DEFAULT NULL,
  `property_id` VARCHAR(36) NULL DEFAULT NULL,
  `request_id` VARCHAR(36) NULL DEFAULT NULL,
  `upvotes` INT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_comments_user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_comments_property_id` (`property_id` ASC) VISIBLE,
  INDEX `idx_comments_request_id` (`request_id` ASC) VISIBLE,
  INDEX `idx_comments_parent_id` (`parent_id` ASC) VISIBLE,
  CONSTRAINT `fk_comments_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comments_parent_id`
    FOREIGN KEY (`parent_id`)
    REFERENCES `comments` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comments_property_id`
    FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comments_request_id`
    FOREIGN KEY (`request_id`)
    REFERENCES `property_requests` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `chk_comment_target` CHECK (((`property_id` IS NOT NULL) AND (`request_id` IS NULL)) OR ((`property_id` IS NULL) AND (`request_id` IS NOT NULL))))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `user_comment_interactions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_comment_interactions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `comment_id` VARCHAR(36) NOT NULL,
  `interaction_type` ENUM('like') NOT NULL DEFAULT 'like',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_user_comment_interaction` (`user_id` ASC, `comment_id` ASC, `interaction_type` ASC) VISIBLE,
  INDEX `idx_user_comment_interactions_comment` (`comment_id` ASC) VISIBLE,
  CONSTRAINT `fk_user_comment_interactions_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_comment_interactions_comment_id`
    FOREIGN KEY (`comment_id`)
    REFERENCES `comments` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `google_sheet_configs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `google_sheet_configs` (
  `id` INT NOT NULL DEFAULT 1,
  `sheet_id` VARCHAR(255) NULL DEFAULT NULL,
  `sheet_name` VARCHAR(255) NULL DEFAULT NULL,
  `columns_to_display` TEXT NULL DEFAULT NULL,
  `is_configured` TINYINT(1) NULL DEFAULT 0,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `id_must_be_1_google_sheet` CHECK ((`id` = 1)))
ENGINE = InnoDB;

INSERT INTO `google_sheet_configs` (`id`, `is_configured`) VALUES (1, FALSE) ON DUPLICATE KEY UPDATE id = 1;


-- -----------------------------------------------------
-- Table `site_settings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `site_title` VARCHAR(255) NULL DEFAULT 'konecte - Encuentra Tu Próxima Propiedad',
  `logo_url` VARCHAR(2048) NULL DEFAULT NULL,
  `show_featured_listings_section` TINYINT(1) NULL DEFAULT 1,
  `show_ai_matching_section` TINYINT(1) NULL DEFAULT 1,
  `show_google_sheet_section` TINYINT(1) NULL DEFAULT 1,
  `landing_sections_order` TEXT NULL DEFAULT NULL,
  `announcement_bar_text` TEXT NULL DEFAULT NULL,
  `announcement_bar_link_url` VARCHAR(2048) NULL DEFAULT NULL,
  `announcement_bar_link_text` VARCHAR(255) NULL DEFAULT NULL,
  `announcement_bar_is_active` TINYINT(1) NULL DEFAULT 0,
  `announcement_bar_bg_color` VARCHAR(20) NULL DEFAULT '#FFB74D',
  `announcement_bar_text_color` VARCHAR(20) NULL DEFAULT '#18181b',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `id_must_be_1_site_settings` CHECK ((`id` = 1)))
ENGINE = InnoDB;

INSERT INTO `site_settings` (`id`, `site_title`, `logo_url`, `show_featured_listings_section`, `show_ai_matching_section`, `show_google_sheet_section`, `landing_sections_order`, `announcement_bar_is_active`, `announcement_bar_bg_color`, `announcement_bar_text_color`)
VALUES (1, 'konecte - Encuentra Tu Próxima Propiedad', NULL, TRUE, TRUE, TRUE, '["featured_list_requests", "ai_matching", "analisis_whatsbot"]', FALSE, '#FFB74D', '#18181b')
ON DUPLICATE KEY UPDATE
  site_title = VALUES(site_title), logo_url = VALUES(logo_url), show_featured_listings_section = VALUES(show_featured_listings_section), show_ai_matching_section = VALUES(show_ai_matching_section), show_google_sheet_section = VALUES(show_google_sheet_section), landing_sections_order = COALESCE(site_settings.landing_sections_order, VALUES(landing_sections_order)), announcement_bar_text = COALESCE(site_settings.announcement_bar_text, VALUES(announcement_bar_text)), announcement_bar_link_url = COALESCE(site_settings.announcement_bar_link_url, VALUES(announcement_bar_link_url)), announcement_bar_link_text = COALESCE(site_settings.announcement_bar_link_text, VALUES(announcement_bar_link_text)), announcement_bar_is_active = VALUES(announcement_bar_is_active), announcement_bar_bg_color = VALUES(announcement_bar_bg_color), announcement_bar_text_color = VALUES(announcement_bar_text_color), updated_at = CURRENT_TIMESTAMP;

UPDATE `site_settings` SET `landing_sections_order` = '["featured_list_requests", "ai_matching", "analisis_whatsbot"]' WHERE `id` = 1 AND (`landing_sections_order` IS NULL OR `landing_sections_order` != '["featured_list_requests", "ai_matching", "analisis_whatsbot"]');


-- -----------------------------------------------------
-- Table `contacts` (CRM)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL DEFAULT NULL,
  `phone` VARCHAR(50) NULL DEFAULT NULL,
  `company_name` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'unqualified') NULL DEFAULT 'new',
  `source` VARCHAR(100) NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `last_contacted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_contacts_user_id_status` (`user_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_contacts_user_id_email` (`user_id` ASC, `email` ASC) VISIBLE,
  CONSTRAINT `fk_contacts_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `contact_interactions` (CRM)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_interactions` (
  `id` VARCHAR(36) NOT NULL,
  `contact_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `interaction_type` ENUM('note', 'email_sent', 'email_received', 'call_made', 'call_received', 'meeting', 'message_sent', 'message_received', 'task_completed', 'property_viewing', 'offer_made', 'other') NOT NULL,
  `interaction_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `subject` VARCHAR(255) NULL DEFAULT NULL,
  `description` TEXT NOT NULL,
  `outcome` VARCHAR(255) NULL DEFAULT NULL,
  `follow_up_needed` TINYINT(1) NULL DEFAULT 0,
  `follow_up_date` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_interactions_contact_id_date` (`contact_id` ASC, `interaction_date` DESC) VISIBLE,
  INDEX `idx_interactions_user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_interactions_follow_up_date` (`follow_up_date` ASC) VISIBLE,
  CONSTRAINT `fk_contact_interactions_contact_id`
    FOREIGN KEY (`contact_id`)
    REFERENCES `contacts` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_contact_interactions_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `chat_conversations`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NULL DEFAULT NULL,
  `request_id` VARCHAR(36) NULL DEFAULT NULL,
  `user_a_id` VARCHAR(36) NOT NULL,
  `user_b_id` VARCHAR(36) NOT NULL,
  `user_a_unread_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `user_b_unread_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_message_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_conversation_participants` (`user_a_id` ASC, `user_b_id` ASC, `property_id` ASC, `request_id` ASC) VISIBLE,
  INDEX `idx_chat_conversations_user_b` (`user_b_id` ASC, `last_message_at` DESC) VISIBLE,
  INDEX `idx_chat_conversations_property` (`property_id` ASC) VISIBLE,
  INDEX `idx_chat_conversations_request` (`request_id` ASC) VISIBLE,
  CONSTRAINT `fk_chat_conversations_user_a_id`
    FOREIGN KEY (`user_a_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_conversations_user_b_id`
    FOREIGN KEY (`user_b_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_conversations_property_id`
    FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_conversations_request_id`
    FOREIGN KEY (`request_id`)
    REFERENCES `property_requests` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT `chk_different_users` CHECK ((`user_a_id` <> `user_b_id`)))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `chat_messages`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `receiver_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_chat_messages_conversation_created` (`conversation_id` ASC, `created_at` DESC) VISIBLE,
  INDEX `idx_chat_messages_sender` (`sender_id` ASC) VISIBLE,
  INDEX `idx_chat_messages_receiver_read` (`receiver_id` ASC, `read_at` ASC) VISIBLE,
  CONSTRAINT `fk_chat_messages_conversation_id`
    FOREIGN KEY (`conversation_id`)
    REFERENCES `chat_conversations` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_messages_sender_id`
    FOREIGN KEY (`sender_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_chat_messages_receiver_id`
    FOREIGN KEY (`receiver_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `editable_texts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `editable_texts` (
  `id` VARCHAR(255) NOT NULL,
  `page_group` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `content_default` TEXT NULL DEFAULT NULL,
  `content_current` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_editable_texts_page_group` (`page_group` ASC) VISIBLE)
ENGINE = InnoDB;

INSERT IGNORE INTO `editable_texts` (`id`, `page_group`, `description`, `content_default`, `content_current`) VALUES
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
    ('auth_signup_signin_link_text', 'auth_signup', 'Texto del enlace para iniciar sesión', 'Inicia sesión', 'Inicia sesión');

-- -----------------------------------------------------
-- Table `property_views` (Lead Tracking)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `property_views` (
  `id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL DEFAULT NULL,
  `viewed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_views_property_id` (`property_id` ASC) VISIBLE,
  INDEX `idx_property_views_user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_property_views_viewed_at` (`viewed_at` ASC) VISIBLE,
  CONSTRAINT `fk_property_views_property_id`
    FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_property_views_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `property_inquiries` (Lead Tracking)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `property_inquiries` (
  `id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `property_owner_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL DEFAULT NULL,
  `message` TEXT NOT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_property_inquiries_property_id` (`property_id` ASC) VISIBLE,
  INDEX `idx_property_inquiries_property_owner_id` (`property_owner_id` ASC) VISIBLE,
  INDEX `idx_property_inquiries_user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_property_inquiries_submitted_at` (`submitted_at` ASC) VISIBLE,
  CONSTRAINT `fk_property_inquiries_property_id`
    FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_property_inquiries_property_owner_id`
    FOREIGN KEY (`property_owner_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_property_inquiries_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `property_visits` (Scheduling)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `property_visits` (
  `id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `visitor_user_id` VARCHAR(36) NOT NULL,
  `property_owner_user_id` VARCHAR(36) NOT NULL,
  `proposed_datetime` DATETIME NOT NULL,
  `confirmed_datetime` DATETIME NULL DEFAULT NULL,
  `status` ENUM('pending_confirmation', 'confirmed', 'cancelled_by_visitor', 'cancelled_by_owner', 'rescheduled_by_owner', 'completed', 'visitor_no_show', 'owner_no_show') NOT NULL DEFAULT 'pending_confirmation',
  `visitor_notes` TEXT NULL DEFAULT NULL,
  `owner_notes` TEXT NULL DEFAULT NULL,
  `cancellation_reason` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_visits_property_id_status` (`property_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_visits_visitor_id_status` (`visitor_user_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_visits_owner_id_status` (`property_owner_user_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_visits_proposed_datetime` (`proposed_datetime` ASC) VISIBLE,
  INDEX `idx_visits_confirmed_datetime` (`confirmed_datetime` ASC) VISIBLE,
  CONSTRAINT `fk_property_visits_property_id`
    FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_property_visits_visitor_user_id`
    FOREIGN KEY (`visitor_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_property_visits_property_owner_user_id`
    FOREIGN KEY (`property_owner_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `broker_collaborations`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `broker_collaborations` (
  `id` VARCHAR(36) NOT NULL,
  `property_request_id` VARCHAR(36) NOT NULL,
  `requesting_broker_id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `offering_broker_id` VARCHAR(36) NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected', 'deal_in_progress', 'deal_closed_success', 'deal_failed') NULL DEFAULT 'pending',
  `commission_terms` TEXT NULL DEFAULT NULL,
  `chat_conversation_id` VARCHAR(36) NULL DEFAULT NULL,
  `proposed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` TIMESTAMP NULL DEFAULT NULL,
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_collaboration_request_property` (`property_request_id` ASC, `property_id` ASC) VISIBLE,
  INDEX `idx_broker_collaborations_requesting_broker` (`requesting_broker_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_broker_collaborations_offering_broker` (`offering_broker_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_broker_collaborations_property_id` (`property_id` ASC) VISIBLE,
  INDEX `idx_broker_collaborations_chat_conversation_id` (`chat_conversation_id` ASC) VISIBLE,
  CONSTRAINT `fk_broker_collaborations_property_request_id`
    FOREIGN KEY (`property_request_id`)
    REFERENCES `property_requests` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_broker_collaborations_requesting_broker_id`
    FOREIGN KEY (`requesting_broker_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_broker_collaborations_property_id`
    FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_broker_collaborations_offering_broker_id`
    FOREIGN KEY (`offering_broker_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_broker_collaborations_chat_conversation_id`
    FOREIGN KEY (`chat_conversation_id`)
    REFERENCES `chat_conversations` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT `chk_different_brokers` CHECK ((`requesting_broker_id` <> `offering_broker_id`)))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `contact_form_submissions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_form_submissions` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL DEFAULT NULL,
  `subject` VARCHAR(255) NULL DEFAULT NULL,
  `message` TEXT NOT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) NULL DEFAULT 0,
  `admin_notes` TEXT NULL DEFAULT NULL,
  `replied_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_contact_submissions_submitted_at` (`submitted_at` ASC) VISIBLE,
  INDEX `idx_contact_submissions_is_read` (`is_read` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `user_listing_interactions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_listing_interactions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `listing_id` VARCHAR(36) NOT NULL,
  `listing_type` ENUM('property', 'request') NOT NULL,
  `interaction_type` ENUM('like', 'dislike', 'skip') NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_user_listing_interaction` (`user_id` ASC, `listing_id` ASC, `listing_type` ASC) VISIBLE,
  INDEX `idx_user_listing_interactions_listing` (`listing_type` ASC, `listing_id` ASC, `interaction_type` ASC) VISIBLE,
  CONSTRAINT `fk_user_listing_interactions_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `user_usage_metrics`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_usage_metrics` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `plan_id_at_usage` VARCHAR(36) NULL DEFAULT NULL,
  `metric_type` ENUM('profile_view', 'match_reveal', 'ai_search', 'manual_search_executed') NOT NULL,
  `reference_id` VARCHAR(36) NULL DEFAULT NULL,
  `timestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_usage_user_metric_time` (`user_id` ASC, `metric_type` ASC, `timestamp` ASC) VISIBLE,
  INDEX `idx_user_usage_plan_id` (`plan_id_at_usage` ASC) VISIBLE,
  CONSTRAINT `fk_user_usage_metrics_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_usage_metrics_plan_id_at_usage`
    FOREIGN KEY (`plan_id_at_usage`)
    REFERENCES `plans` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `user_action_logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_action_logs` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `action_type` ENUM('view_property_details', 'view_request_details', 'view_user_profile', 'view_contact_info_property', 'view_contact_info_request', 'execute_manual_property_search', 'execute_manual_request_search', 'execute_ai_match_search', 'execute_ai_find_requests_for_property', 'execute_ai_find_properties_for_request', 'create_property', 'update_property', 'delete_property', 'create_request', 'update_request', 'delete_request', 'create_comment', 'update_comment', 'delete_comment', 'create_crm_contact', 'update_crm_contact', 'log_crm_interaction', 'user_login_success', 'user_login_fail', 'user_logout', 'user_registration', 'password_reset_request', 'password_reset_success', 'listing_like', 'listing_dislike', 'listing_skip', 'comment_like', 'plan_subscription_change', 'unusual_activity_detected', 'account_locked_temporarily', 'admin_action') NOT NULL,
  `target_entity_id` VARCHAR(36) NULL DEFAULT NULL,
  `target_entity_type` VARCHAR(50) NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL DEFAULT NULL,
  `details` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_action_logs_user_action_time` (`user_id` ASC, `action_type` ASC, `created_at` ASC) VISIBLE,
  INDEX `idx_user_action_logs_target_entity` (`target_entity_type` ASC, `target_entity_id` ASC) VISIBLE,
  CONSTRAINT `fk_user_action_logs_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- Default admin user (password: ola12345)
-- INSERT IGNORE INTO users (id, name, email, password_hash, role_id) VALUES
-- (UUID(), 'Administrador konecte', 'admin@konecte.cl', '$2a$10$V2sLg0n9jR8iO.xP9v.G8.U0z9iE.h1nQ.o0sP1cN2wE3kF4lG5tS', 'admin');

