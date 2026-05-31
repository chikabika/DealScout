import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import { Lock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { listings, searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'
import { SearchCard, type SearchCardData } from './SearchCard'

export default async function SearchesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/searches')
  }

  const { created } = await searchParams
  const db = getDb()

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const plan = getPlan(user?.plan ?? 'free')

  const userSearches = await db
    .select()
    .from(searches)
    .where(eq(searches.userId, session.user.id))
    .orderBy(desc(searches.createdAt))

  // Fetch deal counts + last-seen date per search in one query
  const searchIds = userSearches.map((s) => s.id)
  const searchStats =
    searchIds.length > 0
      ? await db
          .select({
            searchId: listings.searchId,
            count: sql<number>`cast(count(*) as int)`,
            lastSeenAt: sql<Date>`max(${listings.seenAt})`,
          })
          .from(listings)
          .where(inArray(listings.searchId, searchIds))
          .groupBy(listings.searchId)
      : []

  const statsMap = Object.fromEntries(
    searchStats.map((r) => [r.searchId, { count: r.count, lastSeenAt: r.lastSeenAt }]),
  )

  // Aggregate stats
  const totalDeals = searchStats.reduce((sum, r) => sum + r.count, 0)
  const activeCount = userSearches.filter((s) => s.active).length
  const pausedCount = userSearches.length - activeCount
  const atLimit = userSearches.length >= plan.maxSearches
  const nowMs = new Date().getTime()

  // Shape data for SearchCard
  const cardData: SearchCardData[] = userSearches.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    minYear: s.minYear,
    maxMileage: s.maxMileage,
    make: s.make,
    model: s.model,
    providers: (s.providers as string[]) ?? ['facebook'],
    active: s.active,
    frequencyMinutes: s.frequencyMinutes,
    nextRunAt: s.nextRunAt ? new Date(s.nextRunAt).getTime() : null,
    dealCount: statsMap[s.id]?.count ?? 0,
    lastSeenAtMs: statsMap[s.id]?.lastSeenAt
      ? new Date(statsMap[s.id].lastSeenAt).getTime()
      : null,
    lastRunAt: s.lastRunAt ? new Date(s.lastRunAt).getTime() : null,
    lastRunStats: s.lastRunStats ?? null,
    nowMs,
  }))

  return (
    <section className="px-6 py-8 sm:px-10">
      <div className="max-w-5xl">
        {/* Success banner */}
        {created === '1' && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Search created. Hit Run now to scan it.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Searches</h1>
            {userSearches.length > 0 && (
              <p className="mt-1 text-sm text-zinc-400">
                {activeCount} active{pausedCount > 0 ? ` · ${pausedCount} paused` : ''}
              </p>
            )}
          </div>
          {atLimit ? (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500"
            >
              <Lock size={13} />
              Upgrade for more
            </Link>
          ) : (
            <Link
              href="/dashboard/searches/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500"
            >
              + New search
            </Link>
          )}
        </div>

        {/* Usage indicator pill */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              atLimit
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {userSearches.length} / {plan.maxSearches} searches used
            {atLimit && ' · at limit'}
          </span>
        </div>

        {/* Stats row */}
        {userSearches.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'Total searches', value: String(userSearches.length) },
              { label: 'Active', value: String(activeCount) },
              { label: 'Deals found', value: String(totalDeals) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/5 bg-zinc-900 px-4 py-2.5">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {userSearches.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <svg
              viewBox="0 0 220 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-48"
              aria-hidden="true"
            >
              <rect x="0" y="88" width="220" height="4" rx="2" fill="#27272a" />
              <rect x="80" y="89" width="20" height="2" rx="1" fill="#3f3f46" />
              <rect x="120" y="89" width="20" height="2" rx="1" fill="#3f3f46" />
              <path d="M28 72 L36 52 L76 48 L144 48 L184 52 L192 72 Z" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
              <path d="M64 48 L80 28 L140 28 L156 48 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
              <path d="M80 48 L93 32 L127 32 L140 48 Z" fill="#1e3a5f" opacity="0.7" />
              <circle cx="68" cy="76" r="14" fill="#09090b" stroke="#52525b" strokeWidth="2.5" />
              <circle cx="68" cy="76" r="6" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
              <circle cx="152" cy="76" r="14" fill="#09090b" stroke="#52525b" strokeWidth="2.5" />
              <circle cx="152" cy="76" r="6" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
              <ellipse cx="189" cy="64" rx="5" ry="4" fill="#34d399" opacity="0.6" />
              <ellipse cx="189" cy="64" rx="3" ry="2.5" fill="#6ee7b7" opacity="0.8" />
              <ellipse cx="31" cy="64" rx="5" ry="4" fill="#ef4444" opacity="0.5" />
              <line x1="110" y1="50" x2="108" y2="72" stroke="#3f3f46" strokeWidth="1" />
              <line x1="36" y1="62" x2="184" y2="62" stroke="#059669" strokeWidth="1" opacity="0.4" />
            </svg>

            <h2 className="mt-8 text-2xl font-semibold text-emerald-400">No searches yet</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
              Create your first search to start hunting for deals 24/7.
              <br />
              We&apos;ll scan Facebook Marketplace and alert you instantly.
            </p>
            <Link
              href="/dashboard/searches/new"
              className="mt-8 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500"
            >
              Create your first search
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3">
            {cardData.map((search) => (
              <li key={search.id}>
                <SearchCard search={search} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
