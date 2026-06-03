ALTER TABLE "users" ADD COLUMN "runs_today" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "runs_today_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "runs_this_month" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "runs_this_month_reset_at" timestamp;