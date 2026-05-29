import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, inArray } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { listings, searches, users } from '@/lib/schema'
import { sendDailyDigest } from '@/lib/email'

export const maxDuration = 800
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Same auth pattern as /api/cron/scheduler
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const isProduction = process.env.NODE_ENV === 'production'

  if (!isVercelCron) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      if (isProduction || cronSecret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
    }
  }

  const db = getDb()
  const startedAt = new Date()
  console.log('[DIGEST] Starting daily digest at', startedAt.toISOString())

  // Window: last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Step 1: all Free users
  const candidates = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.plan, 'free'))

  console.log(`[DIGEST] ${candidates.length} Free user${candidates.length === 1 ? '' : 's'} to check`)

  const summary = { sent: 0, skipped: 0, errors: 0, totalListings: 0 }

  for (const user of candidates) {
    try {
      // Step 2: get all searches for this user
      const userSearches = await db
        .select({ id: searches.id, name: searches.name })
        .from(searches)
        .where(eq(searches.userId, user.userId))

      if (userSearches.length === 0) {
        summary.skipped++
        continue
      }

      const searchIds = userSearches.map((s) => s.id)

      // Step 3: unalerted listings in the last 24h across all this user's searches
      const newListings = await db
        .select()
        .from(listings)
        .where(
          and(
            inArray(listings.searchId, searchIds),
            eq(listings.alerted, false),
            gte(listings.seenAt, since),
          ),
        )

      if (newListings.length === 0) {
        summary.skipped++
        continue
      }

      // Step 4: group by search (most recent first, cap at 5 per search).
      // Collect the IDs we'll actually send so we can mark only those as alerted.
      const sentIds: string[] = []

      const groups = userSearches
        .map((s) => {
          const forThisSearch = newListings
            .filter((l) => l.searchId === s.id)
            .sort((a, b) => (b.seenAt?.getTime() ?? 0) - (a.seenAt?.getTime() ?? 0))
            .slice(0, 5)

          sentIds.push(...forThisSearch.map((l) => l.id))

          return {
            searchName: s.name,
            searchId:   s.id,
            listings:   forThisSearch.map((l) => ({
              title:    l.title,
              price:    l.price,
              location: l.location,
              url:      l.url,
              image:    l.image,
              year:     l.year,
              mileage:  l.mileage,
            })),
          }
        })
        .filter((g) => g.listings.length > 0)

      const totalIncluded = sentIds.length

      // Step 5: send the digest email
      await sendDailyDigest({
        to:            user.email,
        userName:      user.name,
        groups,
        totalListings: newListings.length,
      })

      // Step 6: mark included listings as alerted so they don't appear in the next digest
      await db
        .update(listings)
        .set({ alerted: true })
        .where(inArray(listings.id, sentIds))

      summary.sent++
      summary.totalListings += totalIncluded
      console.log(
        `[DIGEST] ✅ Sent to ${user.email} — ${totalIncluded} listing${totalIncluded === 1 ? '' : 's'} across ${groups.length} search${groups.length === 1 ? '' : 'es'}`,
      )
    } catch (e) {
      summary.errors++
      console.error(
        `[DIGEST] ❌ Failed for ${user.email}:`,
        e instanceof Error ? e.message : e,
      )
    }
  }

  const elapsed = Date.now() - startedAt.getTime()
  console.log('[DIGEST] Complete:', summary, `in ${(elapsed / 1000).toFixed(1)}s`)
  return NextResponse.json({ ...summary, elapsedMs: elapsed })
}
