/**
 * Migration: add AI deal-scoring columns to listings, and aiCallsThisMonth to users.
 * Uses IF NOT EXISTS throughout — safe to re-run.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/migrate-deal-scoring.ts
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  console.log('Running migration: AI deal-scoring columns…')

  await sql`
    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS deal_score       integer,
      ADD COLUMN IF NOT EXISTS estimated_value  integer,
      ADD COLUMN IF NOT EXISTS savings          integer,
      ADD COLUMN IF NOT EXISTS condition_rating text,
      ADD COLUMN IF NOT EXISTS condition_notes  json,
      ADD COLUMN IF NOT EXISTS red_flags        json,
      ADD COLUMN IF NOT EXISTS ai_summary       text,
      ADD COLUMN IF NOT EXISTS ai_scored_at     timestamptz
  `

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS ai_calls_this_month integer NOT NULL DEFAULT 0
  `

  // Verify
  const listingCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'listings'
      AND column_name IN (
        'deal_score','estimated_value','savings',
        'condition_rating','condition_notes','red_flags',
        'ai_summary','ai_scored_at'
      )
    ORDER BY column_name
  `

  const userCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ai_calls_this_month'
  `

  if (listingCols.length === 8 && userCols.length === 1) {
    console.log('✅ Migration applied successfully')
    console.log('  listings columns:', listingCols.map((c) => c.column_name).join(', '))
    console.log('  users column:    ai_calls_this_month')
  } else {
    console.error('❌ Expected 8 listing cols + 1 user col, found:', listingCols.length, userCols.length)
    process.exit(1)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
