CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`to` text NOT NULL,
	`qr_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `qr_records` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`qr_url` text NOT NULL,
	`payload` text NOT NULL,
	`decision_status` text NOT NULL,
	`decision_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`payment_status` text NOT NULL,
	`qr_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
