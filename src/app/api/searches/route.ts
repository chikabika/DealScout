import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { FREQUENCY_LABELS, getPlan } from '@/lib/plans'
import { PROVIDERS } from '@/lib/providers'

const createSearchSchema = z.object({
  name: z.string().min(3).max(60),
  providers: z.array(z.string()).min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  minPrice: z.number().min(500).max(100000).optional(),
  maxPrice: z.number().min(500).max(100000),
  minYear: z.number().min(1900).max(2026).optional(),
  maxMileage: z.number().min(1000).max(500000).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  keywords: z.string().optional(),
  blacklist: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}$/).nullable().optional(),
  radiusMiles: z.number().int().min(10).max(500).default(50),
  pollingFrequency: z.enum(['hourly', '30min', '15min']).default('hourly'),
  frequencyMinutes: z.number().int().positive().default(240),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  // Fetch user plan
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const plan = getPlan(user?.plan ?? 'free')

  // Enforce search count limit
  const [{ count: currentCount }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(searches)
    .where(eq(searches.userId, session.user.id))

  if (currentCount >= plan.maxSearches) {
    return NextResponse.json(
      {
        error: 'SEARCH_LIMIT_REACHED',
        message: `You've reached your ${plan.maxSearches} search limit on the ${plan.name} plan. Upgrade to add more.`,
        currentPlan: plan.id,
        limit: plan.maxSearches,
      },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = createSearchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 422 },
    )
  }

  const { data } = result

  if (data.frequencyMinutes < plan.pollingMinutes) {
    return NextResponse.json(
      {
        error: 'INVALID_FREQUENCY',
        message: `${FREQUENCY_LABELS[data.frequencyMinutes] ?? `${data.frequencyMinutes} minutes`} is not available on your ${plan.name} plan.`,
      },
      { status: 403 },
    )
  }

  // Enforce provider allowlist
  for (const providerId of data.providers) {
    if (!(plan.allowedProviders as readonly string[]).includes(providerId)) {
      const providerName = PROVIDERS.find((p) => p.id === providerId)?.name ?? providerId
      return NextResponse.json(
        {
          error: 'PROVIDER_NOT_ALLOWED',
          message: `${providerName} is only available on Pro and Dealer plans.`,
        },
        { status: 403 },
      )
    }
  }

  const firstRunAt = new Date(Date.now() + 2 * 60 * 1000)

  await db.insert(searches).values({
    userId: session.user.id,
    name: data.name,
    providers: data.providers,
    city: data.city,
    state: data.state,
    minPrice: data.minPrice ?? null,
    maxPrice: data.maxPrice,
    minYear: data.minYear ?? null,
    maxMileage: data.maxMileage ?? null,
    make: data.make ?? null,
    model: data.model ?? null,
    keywords: data.keywords ?? null,
    blacklist: data.blacklist ?? null,
    zipCode: data.zipCode ?? null,
    radiusMiles: data.radiusMiles ?? 50,
    pollingFrequency: data.pollingFrequency,
    frequencyMinutes: data.frequencyMinutes,
    nextRunAt: firstRunAt,
    active: true,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
