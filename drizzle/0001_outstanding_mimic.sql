CREATE INDEX `email_logs_qr_id_idx` ON `email_logs` (`qr_id`);--> statement-breakpoint
CREATE INDEX `qr_records_transaction_id_idx` ON `qr_records` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `qr_records_decision_status_idx` ON `qr_records` (`decision_status`);