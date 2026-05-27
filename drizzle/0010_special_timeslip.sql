ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "deal_score" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "estimated_value" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "savings" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "condition_rating" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "condition_notes" json;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "red_flags" json;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "ai_scored_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ai_calls_this_month" integer DEFAULT 0 NOT NULL;
