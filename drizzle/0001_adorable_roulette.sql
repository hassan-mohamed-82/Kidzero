CREATE TABLE `promocodes` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`code` varchar(30) NOT NULL,
	`amount` int NOT NULL,
	`promocode_type` enum('percentage','amount') NOT NULL,
	`description` text NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	CONSTRAINT `promocodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promocodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `promocode_id` char(36);--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_promocode_id_promocodes_id_fk` FOREIGN KEY (`promocode_id`) REFERENCES `promocodes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bus_types` DROP COLUMN `organization_id`;