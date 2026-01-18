CREATE TABLE `parent_subscriptions` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`parent_id` varchar(255) NOT NULL,
	`parent_plan_id` varchar(255) NOT NULL,
	`parent_payment_id` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_services` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`service_name` varchar(255) NOT NULL,
	`service_description` varchar(255) NOT NULL,
	`use_zone_pricing` boolean NOT NULL DEFAULT true,
	`service_price` double NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `payment_type` enum('subscription','renewal','plan_price') DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_installments` ADD `payment_method_id` char(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `codrivers` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `pickup_points` ADD `zone_id` char(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `parents` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `parents` ADD `is_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `codrivers` ADD CONSTRAINT `codrivers_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `parent_subscriptions` ADD CONSTRAINT `parent_subscriptions_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_subscriptions` ADD CONSTRAINT `parent_subscriptions_parent_plan_id_parent_plan_id_fk` FOREIGN KEY (`parent_plan_id`) REFERENCES `parent_plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_subscriptions` ADD CONSTRAINT `parent_subscriptions_parent_payment_id_parent_payments_id_fk` FOREIGN KEY (`parent_payment_id`) REFERENCES `parent_payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_services` ADD CONSTRAINT `organization_services_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_installments` ADD CONSTRAINT `fee_installments_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pickup_points` ADD CONSTRAINT `pickup_points_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pickup_points` ADD CONSTRAINT `pickup_points_zone_id_zones_id_fk` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_plan` DROP COLUMN `start_date`;--> statement-breakpoint
ALTER TABLE `parent_plan` DROP COLUMN `end_date`;--> statement-breakpoint
ALTER TABLE `parents` DROP COLUMN `organization_id`;