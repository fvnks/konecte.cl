-- 004_add_whatsapp_permission_to_plans.sql

-- Añadir la columna para la integración de WhatsApp
ALTER TABLE `plans` ADD COLUMN `whatsapp_integration` BOOLEAN NOT NULL DEFAULT FALSE;

-- Opcional: Activar la nueva funcionalidad para los planes existentes que deberían tenerla.
-- Por ejemplo, para activar la integración en el plan 'PREMIUM Corredor'.
-- Asegúrate de que el nombre coincida exactamente con el de tu base de datos.
UPDATE `plans` SET `whatsapp_integration` = TRUE WHERE `name` = 'PREMIUM Corredor'; 