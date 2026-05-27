-- Add vehicle_type column (classifier output: sedan, suv, truck, motorcycle, etc.)
-- Using IF NOT EXISTS because earlier migration attempts may have partially run.
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "vehicle_type" text;
