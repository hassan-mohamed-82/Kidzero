DROP TABLE `organization_admins`;--> statement-breakpoint
ALTER TABLE `admins` ADD `type` enum('organizer','admin') DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_email_unique` UNIQUE(`email`);