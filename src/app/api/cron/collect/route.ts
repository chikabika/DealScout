import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { runCollectionForSearch } from '@/lib/cron/collect-runner'

export const maxDuration = 180

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

  const result = await runCollectionForSearch(row.search, row.user)

  return NextResponse.json({
    success: true,
    newListings: result.inserted,
    ...result,
  })
}
