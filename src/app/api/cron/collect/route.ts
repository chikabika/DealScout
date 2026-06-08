import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { runCollectionForSearch } from '@/lib/cron/collect-runner'

export const maxDuration = 180

const MANUAL_RUN_COOLDOWN_MS = 60 * 1000 // 60 seconds

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const searchId = req.nextUrl.searchParams.get('searchId')
  if (!searchId) {
    return NextResponse.json({ error: 'searchId required' }, { status: 400 })
  }

  const db = getDb()
  const [row] = await db
    .select({ search: searches, user: users })
    .from(searches)
    .innerJoin(users, eq(searches.userId, users.id))
    .where(and(eq(searches.id, searchId), eq(searches.userId, session.user.id)))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const lastRun = row.search.lastRunAt
  if (lastRun && Date.now() - new Date(lastRun).getTime() < MANUAL_RUN_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((MANUAL_RUN_COOLDOWN_MS - (Date.now() - new Date(lastRun).getTime())) / 1000)
    return NextResponse.json(
      { success: false, error: 'COOLDOWN', secondsLeft },
      { status: 429 },
    )
  }

  const result = await runCollectionForSearch(row.search, row.user)

  return NextResponse.json({
    success: true,
    newListings: result.inserted,
    ...result,
  })
}
