ALTER TABLE "listings" DROP CONSTRAINT IF EXISTS "listings_external_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "listings_provider_external_id_unique" ON "listings" USING btree ("provider","external_id");
