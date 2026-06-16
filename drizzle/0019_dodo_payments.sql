-- Rename ls_* columns to provider-agnostic names
ALTER TABLE "users" RENAME COLUMN "ls_customer_id"          TO "provider_customer_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "ls_subscription_id"      TO "provider_subscription_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "ls_subscription_status"  TO "subscription_status";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "ls_variant_id"           TO "provider_product_id";--> statement-breakpoint

-- Add new columns
ALTER TABLE "users" ADD COLUMN "payment_provider"    text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_payment_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_period_end"  timestamp;--> statement-breakpoint

-- Backfill: tag existing LS rows
UPDATE "users"
SET "payment_provider" = 'lemonsqueezy'
WHERE "provider_customer_id" IS NOT NULL;--> statement-breakpoint

-- Idempotency table for webhook deduplication
CREATE TABLE "processed_webhook_events" (
  "id"           text      PRIMARY KEY,
  "provider"     text      NOT NULL,
  "processed_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX "processed_webhook_events_processed_at_idx"
  ON "processed_webhook_events" ("processed_at");
