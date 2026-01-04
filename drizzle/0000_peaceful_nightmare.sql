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
