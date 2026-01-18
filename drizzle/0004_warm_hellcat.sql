ALTER TABLE `students` MODIFY COLUMN `parent_id` char(36);--> statement-breakpoint
ALTER TABLE `students` ADD `code` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `nfc_id` varchar(100);--> statement-breakpoint
ALTER TABLE `students` ADD `wallet_balance` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `parents` ADD `fcm_token` text;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_nfc_id_unique` UNIQUE(`nfc_id`);--> statement-breakpoint
ALTER TABLE `parents` DROP COLUMN `fcm_tokens`;