/**
 * One-time cleanup script — fixes HTML entities in existing listing titles.
 *
 * Before the `decodeEntities` fix in og-fetcher.ts, titles were stored with
 * raw HTML entities: "2018 Honda Accord &#183; 42k miles" instead of
 * "2018 Honda Accord · 42k miles".
 *
 * Usage:
 *   npm run decode-titles
 *
 * Safe to run multiple times — only updates rows that still contain entities.
 */

import 'dotenv/config'
import { getDb } from '@/lib/db'
import { listings } from '@/lib/schema'
import { eq, like, or } from 'drizzle-orm'

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Numeric hex entities: &#xB7; &#x2019; etc.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    // Numeric decimal entities: &#183; &#8217; etc.
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

async function main(): Promise<void> {
  const db = getDb()

  // Fetch only rows that contain HTML entity patterns — avoids loading the whole table
  const all = await db
    .select()
    .from(listings)
    .where(
      or(
        like(listings.title, '%&#%'),
        like(listings.title, '%&amp;%'),
        like(listings.title, '%&quot;%'),
        like(listings.title, '%&lt;%'),
        like(listings.title, '%&gt;%'),
      ),
    )

  console.log(`Found ${all.length} listing(s) with HTML entities in title.`)

  let fixed = 0

  for (const listing of all) {
    const decoded = decodeEntities(listing.title)
    if (decoded === listing.title) continue // nothing changed (defensive)

    await db
      .update(listings)
      .set({ title: decoded })
      .where(eq(listings.id, listing.id))

    console.log(`  Fixed: "${listing.title}"`)
    console.log(`      → "${decoded}"`)
    fixed++
  }

  console.log(`\nDone. Fixed ${fixed} title(s).`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
