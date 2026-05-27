import { type NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
  }

  const payload = body as { active?: unknown; frequencyMinutes?: unknown }
  const updates: Partial<typeof searches.$inferInsert> = {}
  const db = getDb()

  if (typeof payload.active === 'boolean') {
    updates.active = payload.active
    if (payload.active) {
      updates.nextRunAt = new Date(Date.now() + 60 * 1000)
    }
  }

  if (typeof payload.frequencyMinutes === 'number') {
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
    const plan = getPlan(user?.plan ?? 'free')

    if (!(plan.allowedFrequencies as readonly number[]).includes(payload.frequencyMinutes)) {
      return NextResponse.json({ error: 'INVALID_FREQUENCY' }, { status: 403 })
    }

    updates.frequencyMinutes = payload.frequencyMinutes
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 422 })
  }

  await db
    .update(searches)
    .set(updates)
    .where(and(eq(searches.id, id), eq(searches.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
