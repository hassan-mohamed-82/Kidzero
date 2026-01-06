CREATE TABLE `super_admins` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hashed` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `super_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `super_admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `organization_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_type_id` int,
	`subscription_id` char,
	`name` varchar(255) NOT NULL,
	`address` text,
	`logo` varchar(500),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`plan_id` char(36) NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`payment_id` char(36) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_payments` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`payment_id` char(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`price_semester` double NOT NULL DEFAULT 0,
	`price_year` double NOT NULL DEFAULT 0,
	`max_buses` int DEFAULT 10,
	`max_drivers` int DEFAULT 20,
	`max_students` int DEFAULT 100,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`plan_id` char(36) NOT NULL,
	`amount` double NOT NULL,
	`rejected_reason` varchar(255),
	`status` enum('pending','completed','rejected') NOT NULL DEFAULT 'pending',
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bus_types` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`capacity` int NOT NULL,
	`description` varchar(255),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bus_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`role_id` char(36),
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phone` varchar(20),
	`avatar` varchar(500),
	`type` enum('organizer','admin') NOT NULL DEFAULT 'admin',
	`permissions` json DEFAULT ('[]'),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`permissions` json DEFAULT ('[]'),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buses` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`bus_types_id` char NOT NULL,
	`bus_number` varchar(50) NOT NULL,
	`plate_number` varchar(20) NOT NULL,
	`model` varchar(100),
	`color` varchar(50),
	`year` int,
	`status` enum('active','inactive','maintenance') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`bus_id` char,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phone` varchar(20),
	`avatar` varchar(500),
	`license_number` varchar(50),
	`license_expiry` timestamp,
	`national_id` varchar(20),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codrivers` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`bus_id` char,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phone` varchar(20),
	`avatar` varchar(500),
	`national_id` varchar(20),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codrivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_pickup_points` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`route_id` char(36) NOT NULL,
	`pickup_point_id` char(36) NOT NULL,
	`stop_order` int NOT NULL,
	`estimated_arrival` time,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `route_pickup_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_time` time,
	`end_time` time,
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rides` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`bus_id` char NOT NULL,
	`driver_id` char(36) NOT NULL,
	`codriver_id` char(36),
	`route_id` char,
	`name` varchar(255),
	`ride_date` date NOT NULL,
	`ride_type` enum('morning','afternoon') NOT NULL,
	`status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`started_at` timestamp,
	`completed_at` timestamp,
	`current_lat` decimal(10,8),
	`current_lng` decimal(11,8),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`created_by_id` char(36) NOT NULL,
	`ride_id` char,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`type` enum('general','incident','reminder','complaint') DEFAULT 'general',
	`status` enum('active','archived') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pickup_points` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`lat` decimal(10,8) NOT NULL,
	`lng` decimal(11,8) NOT NULL,
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pickup_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_organization_type_id_organization_types_id_fk` FOREIGN KEY (`organization_type_id`) REFERENCES `organization_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_payments` ADD CONSTRAINT `organization_payments_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_payments` ADD CONSTRAINT `organization_payments_payment_id_organizations_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_plan_id_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buses` ADD CONSTRAINT `buses_bus_types_id_bus_types_id_fk` FOREIGN KEY (`bus_types_id`) REFERENCES `bus_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_bus_id_buses_id_fk` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codrivers` ADD CONSTRAINT `codrivers_bus_id_buses_id_fk` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_pickup_points` ADD CONSTRAINT `route_pickup_points_route_id_routes_id_fk` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_pickup_points` ADD CONSTRAINT `route_pickup_points_pickup_point_id_pickup_points_id_fk` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_bus_id_buses_id_fk` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_driver_id_drivers_id_fk` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_codriver_id_codrivers_id_fk` FOREIGN KEY (`codriver_id`) REFERENCES `codrivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_route_id_routes_id_fk` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_created_by_id_admins_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_ride_id_rides_id_fk` FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;