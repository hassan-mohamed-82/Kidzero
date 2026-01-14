CREATE TABLE `fee_installments` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`subscription_id` char(36) NOT NULL,
	`organization_id` char(36) NOT NULL,
	`total_fee_amount` double NOT NULL,
	`paid_amount` double NOT NULL DEFAULT 0,
	`remaining_amount` double NOT NULL,
	`installment_amount` double NOT NULL,
	`due_date` timestamp,
	`status` enum('pending','approved','rejected','overdue') NOT NULL DEFAULT 'pending',
	`rejected_reason` varchar(255),
	`receipt_image` varchar(500),
	`installment_number` int NOT NULL DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fee_installments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_plan` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`price` double NOT NULL DEFAULT 0,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`min_subscription_fees_pay` double NOT NULL DEFAULT 0,
	`subscription_fees` double NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_plan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_payments` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`parent_id` char(36) NOT NULL,
	`plan_id` char(36) NOT NULL,
	`payment_method_id` char(36) NOT NULL,
	`amount` double NOT NULL,
	`receipt_image` varchar(500) NOT NULL,
	`status` enum('pending','completed','rejected') NOT NULL DEFAULT 'pending',
	`rejected_reason` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`city_id` char(36) NOT NULL,
	`cost` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`user_id` char(36) NOT NULL,
	`user_type` enum('parent','driver','admin') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`data` text,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ride_occurrence_students` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`occurrence_id` char(36) NOT NULL,
	`student_id` char(36) NOT NULL,
	`pickup_point_id` char(36) NOT NULL,
	`pickup_time` time,
	`status` enum('pending','picked_up','dropped_off','absent','excused') DEFAULT 'pending',
	`excuse_reason` text,
	`picked_up_at` timestamp,
	`dropped_off_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ride_occurrence_students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ride_occurrences` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`ride_id` char(36) NOT NULL,
	`occur_date` date NOT NULL,
	`status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`started_at` timestamp,
	`completed_at` timestamp,
	`current_lat` decimal(10,8),
	`current_lng` decimal(11,8),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ride_occurrences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `plan` ADD `price` double DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `promocodes` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `admins` ADD `fcm_tokens` text;--> statement-breakpoint
ALTER TABLE `drivers` ADD `fcm_tokens` text;--> statement-breakpoint
ALTER TABLE `codrivers` ADD `fcm_tokens` text;--> statement-breakpoint
ALTER TABLE `students` ADD `zone_id` char(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `parents` ADD `fcm_tokens` text;--> statement-breakpoint
ALTER TABLE `fee_installments` ADD CONSTRAINT `fee_installments_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_installments` ADD CONSTRAINT `fee_installments_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_payments` ADD CONSTRAINT `parent_payments_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_payments` ADD CONSTRAINT `parent_payments_plan_id_parent_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `parent_plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_payments` ADD CONSTRAINT `parent_payments_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zones` ADD CONSTRAINT `zones_city_id_cities_id_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_occurrence_students` ADD CONSTRAINT `ride_occurrence_students_occurrence_id_ride_occurrences_id_fk` FOREIGN KEY (`occurrence_id`) REFERENCES `ride_occurrences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_occurrence_students` ADD CONSTRAINT `ride_occurrence_students_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_occurrence_students` ADD CONSTRAINT `ride_occurrence_students_pickup_point_id_pickup_points_id_fk` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_occurrences` ADD CONSTRAINT `ride_occurrences_ride_id_rides_id_fk` FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_type_idx` ON `notifications` (`user_type`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `occurrence_id_idx` ON `ride_occurrence_students` (`occurrence_id`);--> statement-breakpoint
CREATE INDEX `student_id_idx` ON `ride_occurrence_students` (`student_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `ride_occurrence_students` (`status`);--> statement-breakpoint
CREATE INDEX `ride_id_idx` ON `ride_occurrences` (`ride_id`);--> statement-breakpoint
CREATE INDEX `occur_date_idx` ON `ride_occurrences` (`occur_date`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `ride_occurrences` (`status`);--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_zone_id_zones_id_fk` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `subscription_type`;--> statement-breakpoint
ALTER TABLE `plan` DROP COLUMN `price_semester`;--> statement-breakpoint
ALTER TABLE `plan` DROP COLUMN `price_year`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `requested_subscription_type`;