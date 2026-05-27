-- Add vehicle_type column to listings table
-- Populated by the AI classifier going forward; NULL for pre-existing rows.
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "vehicle_type" text;
