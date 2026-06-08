import { type NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'

const editSearchSchema = z.object({
  name: z.string().min(3).max(60).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  minPrice: z.number().min(500).max(100000).optional(),
  maxPrice: z.number().min(500).max(100000).optional(),
  minYear: z.number().min(1900).max(2026).optional(),
  maxMileage: z.number().min(1000).max(500000).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  keywords: z.string().optional(),
  blacklist: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}$/).nullable().optional(),
  radiusMiles: z.number().int().min(10).max(500).optional(),
  frequencyMinutes: z.number().int().positive().optional(),
})

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

  const payload = body as { active?: unknown } & Record<string, unknown>
  const updates: Partial<typeof searches.$inferInsert> = {}
  const db = getDb()

  let plan: ReturnType<typeof getPlan> | null = null
  async function getUserPlan() {
    if (plan) return plan
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session!.user!.id))
      .limit(1)
    plan = getPlan(user?.plan ?? 'free')
    return plan
  }

  if (typeof payload.active === 'boolean') {
    updates.active = payload.active
    if (payload.active) {
      updates.nextRunAt = new Date(Date.now() + 60 * 1000)
    }
  }

  const result = editSearchSchema.safeParse(payload)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 422 },
    )
  }

  const { data } = result

  if (data.frequencyMinutes !== undefined) {
    const userPlan = await getUserPlan()
    if (data.frequencyMinutes < userPlan.pollingMinutes) {
      return NextResponse.json({ error: 'INVALID_FREQUENCY' }, { status: 403 })
    }
    updates.frequencyMinutes = data.frequencyMinutes
    updates.nextRunAt = new Date(Date.now() + data.frequencyMinutes * 60 * 1000)
  }

  if (data.name !== undefined) updates.name = data.name
  if (data.city !== undefined) updates.city = data.city
  if (data.state !== undefined) updates.state = data.state
  if (data.minPrice !== undefined) updates.minPrice = data.minPrice
  if (data.maxPrice !== undefined) updates.maxPrice = data.maxPrice
  if (data.minYear !== undefined) updates.minYear = data.minYear
  if (data.maxMileage !== undefined) updates.maxMileage = data.maxMileage
  if (data.make !== undefined) updates.make = data.make
  if (data.model !== undefined) updates.model = data.model
  if (data.keywords !== undefined) updates.keywords = data.keywords
  if (data.blacklist !== undefined) updates.blacklist = data.blacklist
  if (data.zipCode !== undefined) updates.zipCode = data.zipCode
  if (data.radiusMiles !== undefined) updates.radiusMiles = data.radiusMiles

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 422 })
  }

  await db
    .update(searches)
    .set(updates)
    .where(and(eq(searches.id, id), eq(searches.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
