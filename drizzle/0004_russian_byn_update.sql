UPDATE `products`
SET
  `name` = CASE `id`
    WHEN 'starter-pass' THEN 'Стартовый абонемент'
    WHEN 'full-retreat' THEN 'Ретрит выходного дня'
    WHEN 'premium-plan' THEN 'Премиум-план на месяц'
    ELSE `name`
  END,
  `description` = CASE `id`
    WHEN 'starter-pass' THEN 'Отличный старт в мире йоги. Подходит новичкам, которые хотят начать регулярную практику.'
    WHEN 'full-retreat' THEN 'Двухдневный ретрит для глубокого погружения в практику и восстановления баланса.'
    WHEN 'premium-plan' THEN 'Безлимитные занятия на целый месяц. Полный доступ к возможностям Yoga Land.'
    ELSE `description`
  END,
  `currency` = 'BYN',
  `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE `id` IN ('starter-pass', 'full-retreat', 'premium-plan');

--> statement-breakpoint
UPDATE `transactions`
SET `currency` = 'BYN',
    `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE `currency` != 'BYN';
