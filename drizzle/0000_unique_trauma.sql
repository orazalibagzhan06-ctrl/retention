CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`group_id` text NOT NULL,
	`title` text NOT NULL,
	`reason` text NOT NULL,
	`method` text NOT NULL,
	`result` text NOT NULL,
	`status` text NOT NULL,
	`follow_up` text NOT NULL,
	`file_id` text,
	`file_name` text,
	`created` text NOT NULL,
	`author` text NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_entries_created` ON `entries` (`created`);--> statement-breakpoint
CREATE TABLE `metrics` (
	`group_id` text PRIMARY KEY NOT NULL,
	`total` integer NOT NULL,
	`renewed` integer,
	`updated` text NOT NULL,
	`source` text NOT NULL,
	`user_id` text NOT NULL
);
