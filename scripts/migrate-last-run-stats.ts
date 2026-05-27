/**
 * One-time migration — adds last_run_at and last_run_stats columns to searches.
 *
 * Drizzle's migrate() silently skips migrations against the single-snapshot
 * setup in this repo, so we run DDL directly via the Neon HTTP driver.
 *
 * Safe to run multiple times — uses IF NOT EXISTS.
 *
 * Usage:
 *   npx tsx scripts/migrate-last-run-stats.ts
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const sql = neon(url)

  console.log('Running migration: add last_run_at + last_run_stats to searches…')

  await sql`
    ALTER TABLE searches
      ADD COLUMN IF NOT EXISTS last_run_at  timestamptz,
      ADD COLUMN IF NOT EXISTS last_run_stats json
  `

  // Verify
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'searches'
      AND column_name IN ('last_run_at', 'last_run_stats')
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

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
