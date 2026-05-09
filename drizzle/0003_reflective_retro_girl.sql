CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`currency` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `products` (`id`, `name`, `description`, `price`, `currency`, `active`, `created_at`, `updated_at`) VALUES
  ('starter-pass', 'Starter Yoga Pass', 'A great introduction to yoga. Perfect for beginners ready to start their practice.', 19, 'USD', 1, '2026-05-09T00:00:00.000Z', '2026-05-09T00:00:00.000Z'),
  ('full-retreat', 'Weekend Retreat', 'An immersive two-day retreat to deepen your practice and restore balance.', 79, 'USD', 1, '2026-05-09T00:00:00.000Z', '2026-05-09T00:00:00.000Z'),
  ('premium-plan', 'Premium Monthly Plan', 'Unlimited classes for an entire month. The full Yoga Land experience.', 129, 'USD', 1, '2026-05-09T00:00:00.000Z', '2026-05-09T00:00:00.000Z');
