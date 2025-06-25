-- Agrega la columna 'source' a la tabla 'properties' para identificar el origen de la publicación.
ALTER TABLE `properties` ADD COLUMN `source` ENUM('web', 'bot') NOT NULL DEFAULT 'web'; 