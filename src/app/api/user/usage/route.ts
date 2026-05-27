import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  const [user] = await db
    .select({
      plan: users.plan,
      scrapesUsedThisMonth: users.scrapesUsedThisMonth,
      scrapesResetAt: users.scrapesResetAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const [{ count: searchCount }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(searches)
    .where(eq(searches.userId, session.user.id))

  const plan = getPlan(user?.plan ?? 'free')

  // Compute days until scrape counter resets (first of next calendar month)
  const now = new Date()
  const resetAt =
    user?.scrapesResetAt && user.scrapesResetAt > now
      ? user.scrapesResetAt
      : new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const daysUntilReset = Math.max(
    1,
    Math.ceil((resetAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  )

  return NextResponse.json({
    plan: {
      id: plan.id,
      name: plan.name,
      maxSearches: plan.maxSearches,
      maxScrapesPerMonth: plan.maxScrapesPerMonth,
      allowedProviders: plan.allowedProviders,
    },
    usage: {
      searches: searchCount,
      scrapes: user?.scrapesUsedThisMonth ?? 0,
      daysUntilReset,
    },
  })
}
