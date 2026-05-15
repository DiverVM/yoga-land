ALTER TABLE `products` ADD `currency_code` text DEFAULT '933' NOT NULL;
--> statement-breakpoint
UPDATE `products`
SET `currency_code` = '933'
WHERE `currency_code` IS NULL OR `currency_code` = '';
--> statement-breakpoint
ALTER TABLE `transactions` ADD `currency_code` text DEFAULT '933' NOT NULL;
--> statement-breakpoint
UPDATE `transactions`
SET `currency_code` = '933'
WHERE `currency_code` IS NULL OR `currency_code` = '';
--> statement-breakpoint
ALTER TABLE `transactions` ADD `order_number` text;
--> statement-breakpoint
UPDATE `transactions`
SET `order_number` = `id`
WHERE `order_number` IS NULL OR `order_number` = '';
