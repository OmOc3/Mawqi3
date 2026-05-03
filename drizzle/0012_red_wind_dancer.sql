PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_client_orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`client_uid` text NOT NULL,
	`client_name` text NOT NULL,
	`station_id` text,
	`station_label` text NOT NULL,
	`proposal_location` text,
	`proposal_description` text,
	`proposal_lat` real,
	`proposal_lng` real,
	`note` text,
	`photo_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	`decision_note` text,
	FOREIGN KEY (`client_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`station_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_client_orders`("order_id", "client_uid", "client_name", "station_id", "station_label", "proposal_location", "proposal_description", "proposal_lat", "proposal_lng", "note", "photo_url", "status", "created_at", "reviewed_at", "reviewed_by", "decision_note") SELECT "order_id", "client_uid", "client_name", "station_id", "station_label", NULL, NULL, NULL, NULL, "note", "photo_url", "status", "created_at", "reviewed_at", "reviewed_by", NULL FROM `client_orders`;--> statement-breakpoint
DROP TABLE `client_orders`;--> statement-breakpoint
ALTER TABLE `__new_client_orders` RENAME TO `client_orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `client_orders_client_uid_idx` ON `client_orders` (`client_uid`);--> statement-breakpoint
CREATE INDEX `client_orders_station_id_idx` ON `client_orders` (`station_id`);--> statement-breakpoint
CREATE INDEX `client_orders_status_idx` ON `client_orders` (`status`);--> statement-breakpoint
CREATE INDEX `client_orders_created_at_idx` ON `client_orders` (`created_at`);