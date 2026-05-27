import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches } from '@/lib/schema'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const searchId = searchParams.get('searchId')
  if (!searchId) {
    return NextResponse.json({ error: 'Missing searchId' }, { status: 400 })
  }

  const [row] = await getDb()
    .select({
      id: searches.id,
      name: searches.name,
      city: searches.city,
      state: searches.state,
      minPrice: searches.minPrice,
      maxPrice: searches.maxPrice,
      lastRunAt: searches.lastRunAt,
      lastRunStats: searches.lastRunStats,
    })
    .from(searches)
    .where(and(eq(searches.id, searchId), eq(searches.userId, session.user.id)))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    searchId: row.id,
    searchName: row.name,
    city: row.city,
    state: row.state,
    minPrice: row.minPrice,
    maxPrice: row.maxPrice,
    lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    lastRunStats: row.lastRunStats ?? null,
  })
}
