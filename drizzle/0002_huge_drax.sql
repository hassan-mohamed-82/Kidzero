ALTER TABLE `admins` MODIFY COLUMN `role_id` char(36);--> statement-breakpoint
ALTER TABLE `organization_admins` MODIFY COLUMN `role_id` char(36);--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `buses` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `route_pickup_points` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `routes` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `rides` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `pickup_points` MODIFY COLUMN `id` char(36) NOT NULL DEFAULT (UUID());