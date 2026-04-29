CREATE TABLE `client_station_access` (
	`access_id` text PRIMARY KEY NOT NULL,
	`client_uid` text NOT NULL,
	`station_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`client_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`station_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_station_access_unique` ON `client_station_access` (`client_uid`,`station_id`);--> statement-breakpoint
CREATE INDEX `client_station_access_client_uid_idx` ON `client_station_access` (`client_uid`);--> statement-breakpoint
CREATE INDEX `client_station_access_station_id_idx` ON `client_station_access` (`station_id`);--> statement-breakpoint
CREATE TABLE `daily_report_photos` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`daily_report_id` text NOT NULL,
	`url` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`daily_report_id`) REFERENCES `daily_work_reports`(`daily_report_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_report_photos_report_idx` ON `daily_report_photos` (`daily_report_id`);--> statement-breakpoint
CREATE INDEX `daily_report_photos_uploaded_at_idx` ON `daily_report_photos` (`uploaded_at`);--> statement-breakpoint
CREATE TABLE `daily_work_report_stations` (
	`daily_report_id` text NOT NULL,
	`station_id` text NOT NULL,
	FOREIGN KEY (`daily_report_id`) REFERENCES `daily_work_reports`(`daily_report_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`station_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_work_report_stations_unique` ON `daily_work_report_stations` (`daily_report_id`,`station_id`);--> statement-breakpoint
CREATE INDEX `daily_work_report_stations_report_idx` ON `daily_work_report_stations` (`daily_report_id`);--> statement-breakpoint
CREATE INDEX `daily_work_report_stations_station_idx` ON `daily_work_report_stations` (`station_id`);--> statement-breakpoint
CREATE TABLE `daily_work_reports` (
	`daily_report_id` text PRIMARY KEY NOT NULL,
	`technician_uid` text NOT NULL,
	`technician_name` text NOT NULL,
	`report_date` integer NOT NULL,
	`summary` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`technician_uid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `daily_work_reports_technician_uid_idx` ON `daily_work_reports` (`technician_uid`);--> statement-breakpoint
CREATE INDEX `daily_work_reports_report_date_idx` ON `daily_work_reports` (`report_date`);--> statement-breakpoint
CREATE INDEX `daily_work_reports_created_at_idx` ON `daily_work_reports` (`created_at`);--> statement-breakpoint
CREATE TABLE `report_photos` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`category` text NOT NULL,
	`url` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`report_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `report_photos_report_id_idx` ON `report_photos` (`report_id`);--> statement-breakpoint
CREATE INDEX `report_photos_category_idx` ON `report_photos` (`category`);--> statement-breakpoint
CREATE INDEX `report_photos_uploaded_at_idx` ON `report_photos` (`uploaded_at`);--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_lat` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_lng` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_accuracy_meters` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_station_id` text REFERENCES stations(station_id);--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_station_label` text;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_client_uid` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_client_name` text;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_in_distance_meters` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_lat` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_lng` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_accuracy_meters` real;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_station_id` text REFERENCES stations(station_id);--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_station_label` text;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_client_uid` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_client_name` text;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD `clock_out_distance_meters` real;--> statement-breakpoint
CREATE INDEX `attendance_sessions_clock_in_client_idx` ON `attendance_sessions` (`clock_in_client_uid`);--> statement-breakpoint
CREATE INDEX `attendance_sessions_clock_in_station_idx` ON `attendance_sessions` (`clock_in_station_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `client_station_access` (`access_id`, `client_uid`, `station_id`, `created_at`, `created_by`)
SELECT
	'legacy_' || `client_uid` || '_' || `station_id`,
	`client_uid`,
	`station_id`,
	min(`created_at`),
	`client_uid`
FROM `client_orders`
GROUP BY `client_uid`, `station_id`;
