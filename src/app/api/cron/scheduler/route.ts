import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, isNotNull, lte } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { runCollectionForSearch } from '@/lib/cron/collect-runner'
import { getPlan } from '@/lib/plans'
import { searches, users } from '@/lib/schema'

export const maxDuration = 800

export async function GET(req: NextRequest) {
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

  const now = new Date()
  const db = getDb()
  console.log(`[SCHEDULER] Tick at ${now.toISOString()}`)

  const due = await db
    .select({ search: searches, user: users })
    .from(searches)
    .innerJoin(users, eq(searches.userId, users.id))
    .where(and(
      eq(searches.active, true),
      isNotNull(searches.nextRunAt),
      lte(searches.nextRunAt, now),
    ))
    .orderBy(asc(searches.nextRunAt))
    .limit(50)

  console.log(`[SCHEDULER] Found ${due.length} due searches`)

  const results = await Promise.allSettled(due.map(async ({ search, user }) => {
    const plan = getPlan(user.plan)

    try {
      await runCollectionForSearch(search, user)
      const freqMinutes = Math.max(search.frequencyMinutes, plan.pollingMinutes)
      const nextRun = new Date(Date.now() + freqMinutes * 60 * 1000)
      await db
        .update(searches)
        .set({ nextRunAt: nextRun, lastRunAt: new Date() })
        .where(eq(searches.id, search.id))
      return { searchId: search.id, status: 'ran' as const, nextRunAt: nextRun }
    } catch (e) {
      console.error(`[SCHEDULER] Search ${search.id} failed:`, e instanceof Error ? e.message : e)
      const freqMinutes = Math.max(search.frequencyMinutes, plan.pollingMinutes)
      await db
        .update(searches)
        .set({ nextRunAt: new Date(Date.now() + freqMinutes * 60 * 1000) })
        .where(eq(searches.id, search.id))
      return {
        searchId: search.id,
        status: 'error' as const,
        error: e instanceof Error ? e.message : 'unknown',
      }
    }
  }))

  const summary = {
    totalDue: due.length,
    ran: results.filter((r) => r.status === 'fulfilled' && r.value.status === 'ran').length,
    errored: results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error')).length,
  }

  console.log('[SCHEDULER] Done:', summary)
  return NextResponse.json(summary)
}
