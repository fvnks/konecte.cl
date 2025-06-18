-- SQL Script to add the 'permissions' column to the 'roles' table if it doesn't exist.

-- Add the permissions column if it doesn't exist
ALTER TABLE `roles`
ADD COLUMN IF NOT EXISTS `permissions` TEXT NULL DEFAULT NULL COMMENT 'JSON array of permission strings' AFTER `description`;

-- Optional: Update existing roles with default permissions if the column was just added and is NULL
-- You might want to adjust these default permissions based on your application logic.

-- Example: Give 'admin' role all permissions (represented by ["*"])
UPDATE `roles`
SET `permissions` = '["*"]'
WHERE `id` = 'admin' AND (`permissions` IS NULL OR `permissions` = '');

-- Example: Give 'user' role a basic set of permissions
UPDATE `roles`
SET `permissions` = '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request"]'
WHERE `id` = 'user' AND (`permissions` IS NULL OR `permissions` = '');

-- Example: Give 'broker' role its specific set of permissions
UPDATE `roles`
SET `permissions` = '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request", "crm:access_own", "collaboration:propose", "collaboration:manage", "visit:manage_own_property_visits", "ai:use_matching_tools"]'
WHERE `id` = 'broker' AND (`permissions` IS NULL OR `permissions` = '');

-- Note: The `INSERT IGNORE INTO roles` statements in `setup-db.ts` will now handle
-- setting default permissions for newly created roles or when the script is run on an empty table.
-- These UPDATE statements are primarily for migrating an existing `roles` table
-- that was created before the `permissions` column was introduced.
