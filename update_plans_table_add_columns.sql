
-- Comandos SQL para actualizar la tabla `plans` añadiendo las nuevas columnas.
-- Ejecuta estos comandos en tu cliente MySQL.

-- Añadir columna can_view_contact_data
ALTER TABLE `plans`
ADD COLUMN `can_view_contact_data` BOOLEAN DEFAULT FALSE AFTER `can_feature_properties`;

-- Añadir columna manual_searches_daily_limit
ALTER TABLE `plans`
ADD COLUMN `manual_searches_daily_limit` INT DEFAULT NULL AFTER `can_view_contact_data`;

-- Añadir columna automated_alerts_enabled (reemplaza a whatsapp_bot_enabled)
ALTER TABLE `plans`
ADD COLUMN `automated_alerts_enabled` BOOLEAN DEFAULT FALSE AFTER `manual_searches_daily_limit`;

-- Añadir columna advanced_dashboard_access
ALTER TABLE `plans`
ADD COLUMN `advanced_dashboard_access` BOOLEAN DEFAULT FALSE AFTER `max_ai_searches_monthly`;

-- Añadir columna daily_profile_views_limit
ALTER TABLE `plans`
ADD COLUMN `daily_profile_views_limit` INT DEFAULT NULL AFTER `advanced_dashboard_access`;

-- Añadir columna weekly_matches_reveal_limit
ALTER TABLE `plans`
ADD COLUMN `weekly_matches_reveal_limit` INT DEFAULT NULL AFTER `daily_profile_views_limit`;

-- Añadir columna is_enterprise_plan
ALTER TABLE `plans`
ADD COLUMN `is_enterprise_plan` BOOLEAN DEFAULT FALSE AFTER `is_publicly_visible`;

-- Opcional: Si tenías una columna llamada 'whatsapp_bot_enabled' y quieres eliminarla
-- porque 'automated_alerts_enabled' la reemplaza, puedes ejecutar:
-- ALTER TABLE `plans` DROP COLUMN `whatsapp_bot_enabled`;
-- Asegúrate de que esto es lo que quieres antes de ejecutar el DROP.

-- Verificar la estructura de la tabla después de los cambios:
-- DESCRIBE `plans`;

-- Actualizar los planes existentes con valores por defecto para los nuevos campos si es necesario:
-- Ejemplo para el plan 'Gratis Corredor' (ajusta el ID o nombre según tu base de datos):
-- UPDATE `plans` SET
--   `can_view_contact_data` = FALSE,
--   `manual_searches_daily_limit` = 5,
--   `automated_alerts_enabled` = FALSE,
--   `advanced_dashboard_access` = FALSE,
--   `daily_profile_views_limit` = 20,
--   `weekly_matches_reveal_limit` = 5,
--   `is_enterprise_plan` = FALSE
-- WHERE `name` = 'Gratis Corredor'; -- O usa el ID del plan

-- Ejemplo para el plan 'PRO Corredor':
-- UPDATE `plans` SET
--   `can_view_contact_data` = TRUE,
--   `manual_searches_daily_limit` = 50,
--   `automated_alerts_enabled` = FALSE,
--   `advanced_dashboard_access` = FALSE,
--   `daily_profile_views_limit` = 100,
--   `weekly_matches_reveal_limit` = 20,
--   `is_enterprise_plan` = FALSE
-- WHERE `name` = 'PRO Corredor';

-- Ejemplo para el plan 'PREMIUM Corredor':
-- UPDATE `plans` SET
--   `can_view_contact_data` = TRUE,
--   `manual_searches_daily_limit` = NULL, -- Ilimitado
--   `automated_alerts_enabled` = TRUE,
--   `advanced_dashboard_access` = TRUE,
--   `daily_profile_views_limit` = NULL, -- Ilimitado
--   `weekly_matches_reveal_limit` = 100,
--   `is_enterprise_plan` = FALSE
-- WHERE `name` = 'PREMIUM Corredor';

-- Nota: Los comandos UPDATE son ejemplos. Ajusta los IDs o nombres de los planes
-- y los valores según los datos de tus planes "Gratuito", "PRO Corredor" y "PREMIUM Corredor"
-- que insertaste con el script setup-db.ts o manualmente.
-- Si tus planes ya fueron creados con el nuevo script setup-db.ts, estos UPDATEs no serían necesarios.
-- Estos son principalmente si estás alterando una tabla `plans` más antigua.
