ALTER TABLE "searches" ADD COLUMN "last_run_at" timestamp;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "last_run_stats" json;