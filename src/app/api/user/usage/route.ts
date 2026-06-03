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
      runsToday: users.runsToday,
      runsTodayResetAt: users.runsTodayResetAt,
      runsThisMonth: users.runsThisMonth,
      runsThisMonthResetAt: users.runsThisMonthResetAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const [{ count: searchCount }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(searches)
    .where(eq(searches.userId, session.user.id))

  const plan = getPlan(user?.plan ?? 'free')

  return NextResponse.json({
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      maxSearches: plan.maxSearches,
      allowedProviders: plan.allowedProviders,
    },
    usage: {
      searches: {
        used: searchCount,
        max: plan.maxSearches,
        isLifetime: true,
      },
      runsToday: {
        used: user?.runsToday ?? 0,
        max: plan.maxRunsPerDay,
        resetsAt: 'midnight UTC',
      },
      runsThisMonth: {
        used: user?.runsThisMonth ?? 0,
        max: plan.maxRunsPerMonth,
        resetsAt: 'first of month',
      },
    },
  })
}
