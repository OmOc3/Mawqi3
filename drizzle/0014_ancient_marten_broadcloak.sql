CREATE TABLE `client_analysis_documents` (
	`document_id` text PRIMARY KEY NOT NULL,
	`client_uid` text NOT NULL,
	`title` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_url` text NOT NULL,
	`is_visible_to_client` integer DEFAULT true NOT NULL,
	`uploaded_by` text NOT NULL,
	`uploaded_by_role` text NOT NULL,
	`published_at` integer,
	`published_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`client_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_analysis_documents_client_uid_idx` ON `client_analysis_documents` (`client_uid`);--> statement-breakpoint
CREATE INDEX `client_analysis_documents_visible_idx` ON `client_analysis_documents` (`is_visible_to_client`);--> statement-breakpoint
CREATE INDEX `client_analysis_documents_created_at_idx` ON `client_analysis_documents` (`created_at`);--> statement-breakpoint
CREATE TABLE `client_service_areas` (
	`area_id` text PRIMARY KEY NOT NULL,
	`client_uid` text NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`description` text,
	`lat` real,
	`lng` real,
	`qr_code_value` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` integer,
	`updated_by` text,
	FOREIGN KEY (`client_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_service_areas_client_uid_idx` ON `client_service_areas` (`client_uid`);--> statement-breakpoint
CREATE INDEX `client_service_areas_active_idx` ON `client_service_areas` (`is_active`);--> statement-breakpoint
CREATE INDEX `client_service_areas_created_at_idx` ON `client_service_areas` (`created_at`);--> statement-breakpoint
CREATE TABLE `daily_area_task_scans` (
	`scan_id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`technician_uid` text NOT NULL,
	`spray_status` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `daily_area_tasks`(`task_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`technician_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `daily_area_task_scans_task_id_idx` ON `daily_area_task_scans` (`task_id`);--> statement-breakpoint
CREATE INDEX `daily_area_task_scans_technician_uid_idx` ON `daily_area_task_scans` (`technician_uid`);--> statement-breakpoint
CREATE INDEX `daily_area_task_scans_created_at_idx` ON `daily_area_task_scans` (`created_at`);--> statement-breakpoint
CREATE TABLE `daily_area_tasks` (
	`task_id` text PRIMARY KEY NOT NULL,
	`area_id` text NOT NULL,
	`client_uid` text NOT NULL,
	`technician_uid` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`status` text DEFAULT 'pending_manager_approval' NOT NULL,
	`spray_status` text,
	`notes` text,
	`client_visible` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_by_role` text NOT NULL,
	`approved_at` integer,
	`approved_by` text,
	`completed_at` integer,
	`completed_by` text,
	`published_at` integer,
	`published_by` text,
	`updated_at` integer,
	FOREIGN KEY (`area_id`) REFERENCES `client_service_areas`(`area_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`technician_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_area_tasks_unique_area_tech_date` ON `daily_area_tasks` (`area_id`,`technician_uid`,`scheduled_date`);--> statement-breakpoint
CREATE INDEX `daily_area_tasks_area_id_idx` ON `daily_area_tasks` (`area_id`);--> statement-breakpoint
CREATE INDEX `daily_area_tasks_client_uid_idx` ON `daily_area_tasks` (`client_uid`);--> statement-breakpoint
CREATE INDEX `daily_area_tasks_technician_uid_idx` ON `daily_area_tasks` (`technician_uid`);--> statement-breakpoint
CREATE INDEX `daily_area_tasks_status_idx` ON `daily_area_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `daily_area_tasks_scheduled_date_idx` ON `daily_area_tasks` (`scheduled_date`);--> statement-breakpoint
CREATE INDEX `daily_area_tasks_client_visible_idx` ON `daily_area_tasks` (`client_visible`);--> statement-breakpoint
ALTER TABLE `client_station_access` ADD `station_visible_to_client` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `client_station_access` ADD `reports_visible_to_client` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `client_station_access` ADD `visibility_updated_at` integer;--> statement-breakpoint
ALTER TABLE `client_station_access` ADD `visibility_updated_by` text;--> statement-breakpoint
CREATE INDEX `client_station_access_station_visible_idx` ON `client_station_access` (`station_visible_to_client`);--> statement-breakpoint
CREATE INDEX `client_station_access_reports_visible_idx` ON `client_station_access` (`reports_visible_to_client`);