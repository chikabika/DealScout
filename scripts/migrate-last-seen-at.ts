/**
 * Migration: add last_seen_at to users table.
 * Safe to re-run (IF NOT EXISTS).
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/migrate-last-seen-at.ts
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  console.log('Running migration: last_seen_at on users…')

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_seen_at timestamptz
  `

  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'last_seen_at'
  `

  if (cols.length === 1) {
    console.log('✅ Migration applied successfully:')
    console.log(`   last_seen_at  (${cols[0].data_type})`)
  } else {
    console.error('❌ Expected 1 column, found:', cols.length)
    process.exit(1)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
