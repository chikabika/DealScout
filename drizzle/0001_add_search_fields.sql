ALTER TABLE "searches" ADD COLUMN "providers" json DEFAULT '["facebook"]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "keywords" text;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "blacklist" text;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "polling_frequency" text DEFAULT 'hourly' NOT NULL;
