import { redirect } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { listings, searches, users } from '@/lib/schema'
import { DealsClient, type DealRow, type RunStats } from './DealsClient'

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/listings')
  }

  const { search: initialSearch } = await searchParams
  const db = getDb()

  // Fetch user's plan for deal-score gate
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
  const userPlan = (user?.plan ?? 'free') as 'free' | 'pro' | 'dealer'
  const nowMs = new Date().getTime()

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      location: listings.location,
      url: listings.url,
      image: listings.image,
      provider: listings.provider,
      seenAt: listings.seenAt,
      searchName: searches.name,
      searchId: searches.id,
      // AI deal scoring
      dealScore: listings.dealScore,
      estimatedValue: listings.estimatedValue,
      savings: listings.savings,
      conditionRating: listings.conditionRating,
      conditionNotes: listings.conditionNotes,
      redFlags: listings.redFlags,
      aiSummary: listings.aiSummary,
    })
    .from(listings)
    .innerJoin(searches, eq(listings.searchId, searches.id))
    .where(eq(searches.userId, session.user.id))
    .orderBy(desc(listings.seenAt))
    .limit(500)

  const data: DealRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    price: r.price,
    location: r.location,
    url: r.url,
    image: r.image,
    provider: r.provider,
    seenAtMs: r.seenAt ? r.seenAt.getTime() : nowMs,
    searchName: r.searchName,
    searchId: r.searchId,
    dealScore: r.dealScore ?? null,
    estimatedValue: r.estimatedValue ?? null,
    savings: r.savings ?? null,
    conditionRating: r.conditionRating ?? null,
    conditionNotes: (r.conditionNotes as string[] | null) ?? null,
    redFlags: (r.redFlags as string[] | null) ?? null,
    aiSummary: r.aiSummary ?? null,
  }))

  const searchCount = new Set(rows.map((r) => r.searchId)).size

  // When a specific search is selected, fetch its run stats so the empty-state
  // diagnostic can show a meaningful filter breakdown.
  let runStats: RunStats | undefined
  if (initialSearch) {
    const [found] = await db
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
      .where(and(eq(searches.id, initialSearch), eq(searches.userId, session.user.id)))
      .limit(1)

    if (found) {
      runStats = {
        searchId: found.id,
        searchName: found.name,
        city: found.city,
        minPrice: found.minPrice,
        maxPrice: found.maxPrice,
        lastRunAt: found.lastRunAt ? found.lastRunAt.toISOString() : null,
        stats: found.lastRunStats ?? null,
      }
    }
  }

  return (
    <section className="px-6 py-8 sm:px-10">
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Deals</h1>
          {rows.length > 0 && (
            <p className="mt-1 text-sm text-zinc-400">
              {rows.length} listing{rows.length === 1 ? '' : 's'} across{' '}
              {searchCount} active search{searchCount === 1 ? '' : 'es'}
            </p>
          )}
        </div>

        <DealsClient
          rows={data}
          initialSearch={initialSearch}
          runStats={runStats}
          userPlan={userPlan}
        />
      </div>
    </section>
  )
}
