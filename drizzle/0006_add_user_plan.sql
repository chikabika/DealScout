ALTER TABLE "users" ADD COLUMN "plan" text NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "scrapes_used_this_month" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "scrapes_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;
