/**
 * Migration: add frequency_minutes and next_run_at to searches.
 * Uses IF NOT EXISTS — safe to re-run.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/migrate-scheduler.ts
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  console.log('Running migration: scheduler columns on searches…')

  await sql`
    ALTER TABLE searches
      ADD COLUMN IF NOT EXISTS frequency_minutes integer NOT NULL DEFAULT 240,
      ADD COLUMN IF NOT EXISTS next_run_at       timestamptz
  `

  // Backfill: existing searches that have never run get scheduled 1 hour from now
  const updated = await sql`
    UPDATE searches
    SET next_run_at = now() + interval '1 hour'
    WHERE next_run_at IS NULL
  `
  console.log(`  Backfilled next_run_at for ${updated.length} existing searches`)

  // Verify
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'searches'
      AND column_name IN ('frequency_minutes', 'next_run_at')
    ORDER BY column_name
  `

  if (cols.length === 2) {
    console.log('✅ Migration applied successfully:')
    cols.forEach((c) => console.log(`   ${c.column_name}  (${c.data_type})`))
  } else {
    console.error('❌ Expected 2 columns, found:', cols)
    process.exit(1)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
