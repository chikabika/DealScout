ALTER TABLE "searches" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "radius_miles" integer DEFAULT 50;