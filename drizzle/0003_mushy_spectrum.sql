DROP TABLE `organization_admins`;--> statement-breakpoint
ALTER TABLE `admins` ADD `type` enum('organizer','admin') DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` DROP COLUMN `organization_id`;