import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, inArray, isNotNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { sendDailyDigest, type DigestGroup } from '@/lib/email'
import { getPlan } from '@/lib/plans'
import { listings, searches, users } from '@/lib/schema'

export const maxDuration = 800
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  || process.env.NEXTAUTH_URL
  || process.env.AUTH_URL
  || 'https://your-domain.com'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const authHeader = req.headers.get('authorization')
  const isProduction = process.env.NODE_ENV === 'production'

  if (!isVercelCron) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      if (isProduction || cronSecret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
    }
  }

  const db = getDb()
  const startedAt = Date.now()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  console.log('[DIGEST] Starting daily digest cron at', new Date().toISOString())

  const freeUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
    })
    .from(users)
    .where(eq(users.plan, 'free'))

  console.log(`[DIGEST] Found ${freeUsers.length} Free users to check`)

  const summary = { sent: 0, skipped: 0, errors: 0, totalListings: 0 }

  for (const user of freeUsers) {
    try {
      const plan = getPlan(user.plan)
      if (plan.emailMode !== 'digest_daily') {
        summary.skipped++
        continue
      }

      const userSearches = await db
        .select({
          id: searches.id,
          name: searches.name,
          providers: searches.providers,
        })
        .from(searches)
        .where(and(
          eq(searches.userId, user.id),
          eq(searches.active, true),
        ))

      if (userSearches.length === 0) {
        summary.skipped++
        continue
      }

      const searchIds = userSearches.map((search) => search.id)

      const newListings = await db
        .select({
          id: listings.id,
          searchId: listings.searchId,
          provider: listings.provider,
          title: listings.title,
          price: listings.price,
          location: listings.location,
          url: listings.url,
          image: listings.image,
          year: listings.year,
          mileage: listings.mileage,
          dealScore: listings.dealScore,
          aiSummary: listings.aiSummary,
          seenAt: listings.seenAt,
        })
        .from(listings)
        .where(and(
          inArray(listings.searchId, searchIds),
          eq(listings.alerted, false),
          gte(listings.seenAt, since),
          isNotNull(listings.url),
        ))

      if (newListings.length === 0) {
        console.log(`[DIGEST] No new listings for ${user.email} — skipping`)
        summary.skipped++
        continue
      }

      const groups: DigestGroup[] = userSearches
        .flatMap((search) => {
          const searchListings = newListings
            .filter((listing) => listing.searchId === search.id)
            .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0))

          const providers = Array.from(
            new Set(searchListings.map((listing) => listing.provider || 'facebook')),
          )

          return providers.map((provider) => ({
            searchName: search.name,
            searchId: search.id,
            provider,
            listings: searchListings
              .filter((listing) => (listing.provider || 'facebook') === provider)
              .slice(0, 5)
              .map((listing) => ({
                title: listing.title,
                price: listing.price,
                location: listing.location,
                url: listing.url,
                image: listing.image,
                year: listing.year,
                mileage: listing.mileage,
                dealScore: listing.dealScore,
                aiSummary: listing.aiSummary,
              })),
          }))
        })
        .filter((group) => group.listings.length > 0)

      if (groups.length === 0) {
        summary.skipped++
        continue
      }

      const totalShown = groups.reduce((sum, group) => sum + group.listings.length, 0)

      await sendDailyDigest({
        to: user.email,
        userName: user.name,
        groups,
        totalNewListings: newListings.length,
        appUrl: APP_URL,
      })

      await db
        .update(listings)
        .set({ alerted: true })
        .where(and(
          inArray(listings.searchId, searchIds),
          eq(listings.alerted, false),
          gte(listings.seenAt, since),
        ))

      summary.sent++
      summary.totalListings += totalShown
      console.log(`[DIGEST] ✅ ${user.email} — ${totalShown} listings across ${groups.length} groups`)
    } catch (e) {
      summary.errors++
      console.error(`[DIGEST] ❌ Failed for ${user.email}:`, e instanceof Error ? e.message : e)
    }
  }

  const elapsed = Date.now() - startedAt
  console.log('[DIGEST] Complete:', { ...summary, elapsedMs: elapsed })
  return NextResponse.json({ ...summary, elapsedMs: elapsed })
}
