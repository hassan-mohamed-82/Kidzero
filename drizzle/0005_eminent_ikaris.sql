CREATE TABLE `wallet_recharge_requests` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`parent_id` char(36) NOT NULL,
	`student_id` char(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`payment_method_id` char(36) NOT NULL,
	`proof_image` varchar(500),
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`notes` text,
	`reviewed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_recharge_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`student_id` char(36) NOT NULL,
	`type` enum('recharge','purchase') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`balance_before` decimal(10,2) NOT NULL,
	`balance_after` decimal(10,2) NOT NULL,
	`reference_id` char(36),
	`reference_type` varchar(50),
	`description` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `students` DROP INDEX `students_nfc_id_unique`;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `wallet_balance` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `wallet_recharge_requests` ADD CONSTRAINT `wallet_recharge_requests_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_recharge_requests` ADD CONSTRAINT `wallet_recharge_requests_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_recharge_requests` ADD CONSTRAINT `wallet_recharge_requests_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_recharge_requests` ADD CONSTRAINT `wallet_recharge_requests_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;