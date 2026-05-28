ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paddle_subscription_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paddle_price_id" text;
