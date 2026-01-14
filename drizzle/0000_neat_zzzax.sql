CREATE TABLE `super_admins` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hashed` varchar(255) NOT NULL,
	`role` enum('superadmin','subadmin') NOT NULL DEFAULT 'subadmin',
	`role_id` char(36),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `super_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `super_admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `organization_types` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_type_id` char(36) NOT NULL,
	`status` enum('active','blocked','subscribed') DEFAULT 'active',
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255) NOT NULL,
	`logo` varchar(500) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_phone_unique` UNIQUE(`phone`),
	CONSTRAINT `organizations_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`plan_id` char(36) NOT NULL,
	`organization_id` char(36) NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`payment_id` char(36) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`subscription_type` enum('yearly','semester') NOT NULL DEFAULT 'semester',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
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
	`min_subscription_fees_pay` double NOT NULL DEFAULT 0,
	`subscription_fees` double NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`plan_id` char(36) NOT NULL,
	`payment_method_id` char(36) NOT NULL,
	`amount` double NOT NULL,
	`receipt_image` varchar(500) NOT NULL,
	`promocode_id` char(36),
	`status` enum('pending','completed','rejected') NOT NULL DEFAULT 'pending',
	`rejected_reason` varchar(255),
	`requested_subscription_type` enum('yearly','semester') NOT NULL DEFAULT 'semester',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bus_types` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`capacity` int NOT NULL,
	`description` varchar(255),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bus_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `payment_methods` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`description` varchar(255),
	`logo` varchar(500) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`fee_status` boolean NOT NULL DEFAULT true,
	`fee_amount` double NOT NULL DEFAULT 0,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `super_admin_roles` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`permissions` json DEFAULT ('[]'),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `super_admin_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `super_admin_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`subscription_id` char(36) NOT NULL,
	`amount` double(10,2) NOT NULL,
	`plan_id` char(36) NOT NULL,
	`issued_at` timestamp DEFAULT (now()),
	`due_at` timestamp NOT NULL,
	`paid_at` timestamp,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
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
	`bus_types_id` char(36) NOT NULL,
	`plate_number` varchar(20) NOT NULL,
	`bus_number` varchar(50) NOT NULL,
	`max_seats` int NOT NULL,
	`license_number` varchar(50),
	`license_expiry_date` date,
	`license_image` varchar(500),
	`bus_image` varchar(500),
	`status` enum('active','inactive','maintenance') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`password` varchar(255) NOT NULL,
	`avatar` varchar(500),
	`license_expiry` timestamp,
	`license_image` varchar(500),
	`national_id` varchar(20),
	`national_id_image` varchar(500),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`),
	CONSTRAINT `drivers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `codrivers` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phone` varchar(20),
	`avatar` varchar(500),
	`national_id` varchar(20),
	`national_id_image` varchar(500),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codrivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` char(36) NOT NULL,
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','inactive'),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_pickup_points` (
	`id` char(36) NOT NULL,
	`route_id` char(36) NOT NULL,
	`pickup_point_id` char(36) NOT NULL,
	`stop_order` int NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `route_pickup_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rides` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`bus_id` char(36) NOT NULL,
	`driver_id` char(36) NOT NULL,
	`codriver_id` char(36),
	`route_id` char(36) NOT NULL,
	`name` varchar(255),
	`ride_type` enum('morning','afternoon') NOT NULL,
	`frequency` enum('once','repeat') NOT NULL,
	`repeat_type` enum('limited','unlimited'),
	`start_date` date NOT NULL,
	`end_date` date,
	`is_active` enum('on','off') DEFAULT 'on',
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
CREATE TABLE `departments` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`parent_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`avatar` varchar(500),
	`grade` varchar(50),
	`classroom` varchar(50),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`organization_id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`password` varchar(255) NOT NULL,
	`avatar` varchar(500),
	`address` varchar(500),
	`national_id` varchar(20),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parents_id` PRIMARY KEY(`id`),
	CONSTRAINT `parents_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `ride_students` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`ride_id` char(36) NOT NULL,
	`student_id` char(36) NOT NULL,
	`pickup_point_id` char(36) NOT NULL,
	`pickup_time` time,
	`status` enum('pending','picked_up','dropped_off','absent','excused') DEFAULT 'pending',
	`excuse_reason` text,
	`picked_up_at` timestamp,
	`dropped_off_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ride_students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `super_admins` ADD CONSTRAINT `super_admins_role_id_super_admin_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `super_admin_roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_organization_type_id_organization_types_id_fk` FOREIGN KEY (`organization_type_id`) REFERENCES `organization_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_payments` ADD CONSTRAINT `organization_payments_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_payments` ADD CONSTRAINT `organization_payments_payment_id_organizations_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_plan_id_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_promocode_id_promocodes_id_fk` FOREIGN KEY (`promocode_id`) REFERENCES `promocodes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_plan_id_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buses` ADD CONSTRAINT `buses_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buses` ADD CONSTRAINT `buses_bus_types_id_bus_types_id_fk` FOREIGN KEY (`bus_types_id`) REFERENCES `bus_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_pickup_points` ADD CONSTRAINT `route_pickup_points_route_id_routes_id_fk` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `route_pickup_points` ADD CONSTRAINT `route_pickup_points_pickup_point_id_pickup_points_id_fk` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_bus_id_buses_id_fk` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_driver_id_drivers_id_fk` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_codriver_id_codrivers_id_fk` FOREIGN KEY (`codriver_id`) REFERENCES `codrivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_route_id_routes_id_fk` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_students` ADD CONSTRAINT `ride_students_ride_id_rides_id_fk` FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_students` ADD CONSTRAINT `ride_students_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ride_students` ADD CONSTRAINT `ride_students_pickup_point_id_pickup_points_id_fk` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points`(`id`) ON DELETE no action ON UPDATE no action;