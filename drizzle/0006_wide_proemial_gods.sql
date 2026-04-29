CREATE TABLE `client_profiles` (
	`client_uid` text PRIMARY KEY NOT NULL,
	`phone` text,
	`addresses` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`client_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_profiles_updated_at_idx` ON `client_profiles` (`updated_at`);