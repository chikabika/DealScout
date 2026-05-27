/**
 * One-time script — rescues existing DB listings whose images are broken
 * (expired Facebook CDN URLs) by:
 *   1. Re-fetching a fresh image URL from the listing's OG tags (always — even
 *      if we already have a thumbnailUrl — because OG gives a scontent URL that
 *      is directly accessible, vs the potentially crawler-protected thumbnailUrl)
 *   2. Uploading to Cloudinary via cacheImageSmart (direct fetch → download
 *      fallback) for a permanent, resized, hotlink-proof URL
 *   3. Updating the DB row in place
 *
 * Usage:
 *   npm run refresh-images
 *
 * Safe to run multiple times — listings already on Cloudinary are skipped.
 * Throttled to 500 ms between requests to avoid rate-limiting Facebook.
 *
 * Free-tier Cloudinary: 25 GB storage + 25 GB bandwidth/month.
 * No credit card or paid plan needed for typical DealScout volumes.
 */

import 'dotenv/config'
import { getDb } from '@/lib/db'
import { listings } from '@/lib/schema'
import { eq, isNotNull } from 'drizzle-orm'
import { fetchOgData } from '@/lib/enrichment/og-fetcher'
import { cacheImageSmart } from '@/lib/image-cache'

async function main(): Promise<void> {
  const db = getDb()

  console.log('Fetching all listings with a URL...')
  const all = await db.select().from(listings).where(isNotNull(listings.url))
  console.log(`Found ${all.length} listings to process.\n`)

  let fixed = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < all.length; i++) {
    const listing = all[i]
    const prefix = `[${i + 1}/${all.length}]`

    // ── Already on Cloudinary — nothing to do ─────────────────────────────────
    if (listing.image?.includes('cloudinary.com')) {
      console.log(`${prefix} ⏭️  Already cached: ${listing.externalId}`)
      skipped++
      continue
    }

    // ── Step 1: always run OG to get the freshest image URL ───────────────────
    // OG gives a scontent-*.fbcdn.net URL (directly accessible) even when the
    // Apify-scraped thumbnailUrl is a lookaside.fbsbx.com protected URL.
    const og = await fetchOgData(listing.url)

    // Prefer fresh OG image; fall back to whatever we already have in the DB
    const sourceImage = og.image ?? listing.image
    if (!sourceImage) {
      console.log(`${prefix} ❌ No image found for ${listing.externalId}`)
      failed++
      continue
    }

    // ── Step 2: upload to Cloudinary (smart: direct → download fallback) ──────
    const cdnUrl = await cacheImageSmart(sourceImage, listing.externalId)
    if (!cdnUrl) {
      console.log(`${prefix} ❌ Upload failed for ${listing.externalId}`)
      failed++
      continue
    }

    // ── Step 3: persist permanent URL ─────────────────────────────────────────
    await db
      .update(listings)
      .set({ image: cdnUrl })
      .where(eq(listings.id, listing.id))

    console.log(`${prefix} ✅ Refreshed: ${listing.externalId}`)
    fixed++

    // Throttle — 500 ms between requests to avoid rate-limiting Facebook's OG endpoint
    await new Promise<void>((r) => setTimeout(r, 500))
  }

  console.log(`\nDone.`)
  console.log(`  ✅ Fixed  : ${fixed}`)
  console.log(`  ❌ Failed : ${failed}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  console.log(`  📋 Total  : ${all.length}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
