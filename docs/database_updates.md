
# Comandos de Actualización de Base de Datos MySQL para konecte

-- Fecha de Actualización: 2024-05-23
-- Copia y pega estos comandos en tu cliente MySQL para actualizar el esquema de tu base de datos.
-- Estas actualizaciones son incrementales y no deberían eliminar datos existentes si se ejecutan correctamente.

-- --- Actualizaciones a la tabla `users` ---
-- Añadir nuevos campos para perfiles de Corredor/Inmobiliaria
ALTER TABLE `users` ADD COLUMN `company_name` VARCHAR(255) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Nombre de la empresa' AFTER `rut_tin`;
ALTER TABLE `users` ADD COLUMN `main_operating_region` VARCHAR(100) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Región principal de operación' AFTER `company_name`;
ALTER TABLE `users` ADD COLUMN `main_operating_commune` VARCHAR(100) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Comuna principal de operación' AFTER `main_operating_region`;
ALTER TABLE `users` ADD COLUMN `properties_in_portfolio_count` INT DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Cantidad de propiedades en cartera' AFTER `main_operating_commune`;
ALTER TABLE `users` ADD COLUMN `website_social_media_link` VARCHAR(2048) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Enlace a sitio web o red social' AFTER `properties_in_portfolio_count`;

-- --- Actualizaciones a la tabla `properties` ---
-- Renombrar columna de superficie y añadir nuevos campos
-- (Si el comando RENAME falla porque la columna no existe, ignora el error. Si falla porque ya existe 'total_area_sq_meters', también está bien)
ALTER TABLE `properties` RENAME COLUMN `area_sq_meters` TO `total_area_sq_meters`;
ALTER TABLE `properties` ADD COLUMN `useful_area_sq_meters` DECIMAL(10,2) DEFAULT NULL AFTER `total_area_sq_meters`;
ALTER TABLE `properties` ADD COLUMN `parking_spaces` INT DEFAULT 0 AFTER `useful_area_sq_meters`;
ALTER TABLE `properties` ADD COLUMN `pets_allowed` BOOLEAN DEFAULT FALSE AFTER `parking_spaces`;
ALTER TABLE `properties` ADD COLUMN `furnished` BOOLEAN DEFAULT FALSE AFTER `pets_allowed`;
ALTER TABLE `properties` ADD COLUMN `commercial_use_allowed` BOOLEAN DEFAULT FALSE AFTER `furnished`;
ALTER TABLE `properties` ADD COLUMN `has_storage` BOOLEAN DEFAULT FALSE AFTER `commercial_use_allowed`;
ALTER TABLE `properties` ADD COLUMN `orientation` VARCHAR(50) DEFAULT NULL AFTER `has_storage`;
ALTER TABLE `properties` ADD COLUMN `region` VARCHAR(100) NOT NULL AFTER `city`;

-- --- Actualizaciones a la tabla `property_requests` ---
-- Añadir región a la ubicación deseada
ALTER TABLE `property_requests` ADD COLUMN `desired_location_region` VARCHAR(100) NOT NULL AFTER `desired_location_city`;

-- --- Actualizaciones a la tabla `site_settings` ---
-- Añadir el flag para mostrar la sección de planes destacados y asegurar el orden de las secciones
ALTER TABLE `site_settings` ADD COLUMN `show_featured_plans_section` BOOLEAN DEFAULT TRUE AFTER `show_featured_listings_section`;
UPDATE `site_settings` SET `landing_sections_order` = '["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"]' WHERE id = 1 AND (`landing_sections_order` IS NULL OR `landing_sections_order` NOT LIKE '%featured_plans%');


-- --- Creación de NUEVAS TABLAS ---

-- Tabla `user_listing_interactions` para Likes/Dislikes
CREATE TABLE IF NOT EXISTS `user_listing_interactions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `listing_id` VARCHAR(36) NOT NULL,
  `listing_type` ENUM('property', 'request') NOT NULL,
  `interaction_type` ENUM('like', 'dislike', 'skip') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_listing_interaction` (`user_id`, `listing_id`, `listing_type`)
);
CREATE INDEX IF NOT EXISTS `idx_user_listing_interactions_user_listing` ON `user_listing_interactions`(`user_id`, `listing_type`, `listing_id`);
CREATE INDEX IF NOT EXISTS `idx_user_listing_interactions_listing` ON `user_listing_interactions`(`listing_type`, `listing_id`, `interaction_type`);


-- Tabla `ai_matches` para almacenar resultados de IA
CREATE TABLE IF NOT EXISTS `ai_matches` (
    `id` VARCHAR(36) PRIMARY KEY,
    `property_id` VARCHAR(36) NOT NULL,
    `request_id` VARCHAR(36) NOT NULL,
    `match_score` DECIMAL(5,4) NOT NULL,
    `reason` TEXT,
    `last_calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`request_id`) REFERENCES `property_requests`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_property_request_match` (`property_id`, `request_id`),
    INDEX `idx_ai_matches_property_id` (`property_id`),
    INDEX `idx_ai_matches_request_id` (`request_id`),
    INDEX `idx_ai_matches_score` (`match_score`)
);


-- Tabla `user_usage_metrics` (Reemplaza a la antigua user_ai_search_usage)
DROP TABLE IF EXISTS `user_ai_search_usage`;
CREATE TABLE IF NOT EXISTS `user_usage_metrics` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `plan_id_at_usage` VARCHAR(36) DEFAULT NULL,
    `metric_type` ENUM('profile_view', 'match_reveal', 'ai_search', 'manual_search_executed') NOT NULL,
    `reference_id` VARCHAR(36) DEFAULT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plan_id_at_usage`) REFERENCES `plans`(`id`) ON DELETE SET NULL,
    INDEX `idx_user_usage_user_metric_time` (`user_id`, `metric_type`, `timestamp`),
    INDEX `idx_user_usage_plan_id` (`plan_id_at_usage`)
);


-- Tabla `user_action_logs` para auditoría
CREATE TABLE IF NOT EXISTS `user_action_logs` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `action_type` ENUM(
        'view_property_details', 'view_request_details', 'view_user_profile', 'view_contact_info_property', 'view_contact_info_request',
        'execute_manual_property_search', 'execute_manual_request_search', 'execute_ai_match_search', 'execute_ai_find_requests_for_property', 'execute_ai_find_properties_for_request',
        'create_property', 'update_property', 'delete_property', 'create_request', 'update_request', 'delete_request',
        'create_comment', 'update_comment', 'delete_comment', 'create_crm_contact', 'update_crm_contact', 'log_crm_interaction',
        'user_login_success', 'user_login_fail', 'user_logout', 'user_registration', 'password_reset_request', 'password_reset_success',
        'listing_like', 'listing_dislike', 'listing_skip', 'comment_like',
        'plan_subscription_change',
        'unusual_activity_detected', 'account_locked_temporarily', 'admin_action'
    ) NOT NULL,
    `target_entity_id` VARCHAR(36) DEFAULT NULL,
    `target_entity_type` VARCHAR(50) DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `details` JSON DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_action_logs_user_action_time` (`user_id`, `action_type`, `created_at`),
    INDEX `idx_user_action_logs_target_entity` (`target_entity_type`, `target_entity_id`)
);

SELECT '¡Actualización de esquema completada!' AS status;
