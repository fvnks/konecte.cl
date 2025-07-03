ALTER TABLE `contacts` ADD COLUMN `source_user_id` varchar(36);
--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_source_user_id_users_id_fk` FOREIGN KEY (`source_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action; 