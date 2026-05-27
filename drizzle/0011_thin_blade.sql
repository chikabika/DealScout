ALTER TABLE "searches" ADD COLUMN IF NOT EXISTS "frequency_minutes" integer DEFAULT 240 NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN IF NOT EXISTS "next_run_at" timestamp;--> statement-breakpoint
UPDATE "searches" SET "next_run_at" = now() + interval '1 hour' WHERE "next_run_at" IS NULL;
