ALTER TABLE `codes` ADD `kind` text DEFAULT 'link' NOT NULL;--> statement-breakpoint
ALTER TABLE `codes` ADD `payload` text;