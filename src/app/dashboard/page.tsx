import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import {
  Activity,
  ChevronRight,
  Clock,
  Lock,
  Package,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { listings, searches, users } from '@/lib/schema'
import { getPlan, FREQUENCY_LABELS } from '@/lib/plans'
import { RunNowButton } from './searches/RunNowButton'
import { UpgradeBanner } from './UpgradeBanner'
import type { LastRunStats } from '@/lib/schema'

// ─── Small primitives ─────────────────────────────────────────────────────────

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  tone?: 'emerald' | 'amber' | 'red' | 'zinc'
}

function StatCard({ icon, label, value, subtext, tone = 'zinc' }: StatCardProps) {
  const iconColor =
    tone === 'emerald' ? 'text-emerald-400'
    : tone === 'amber'  ? 'text-amber-400'
    : tone === 'red'    ? 'text-red-400'
    :                     'text-zinc-500'
  const ringColor =
    tone === 'emerald' ? 'border-emerald-500/20'
    : tone === 'amber'  ? 'border-amber-500/20'
    : tone === 'red'    ? 'border-red-500/20'
    :                     'border-white/8'

  return (
    <div className={`rounded-xl border ${ringColor} bg-zinc-900 p-5`}>
      <div className={`mb-3 ${iconColor}`}>{icon}</div>
      <div className="text-2xl font-bold text-zinc-100">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-xs text-zinc-600">{subtext}</div>
    </div>
  )
}

function ProgressBar({
  label,
  current,
  max,
  locked = false,
}: {
  label: string
  current: number
  max: number
  locked?: boolean
}) {
  if (locked) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">{label}</span>
          <Link href="/pricing" className="text-xs text-emerald-400 hover:underline">
            Upgrade
          </Link>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full w-0 rounded-full bg-zinc-700" />
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-600">Upgrade to unlock</p>
      </div>
    )
  }

  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const barColor =
    pct >= 100 ? 'bg-red-500'
    : pct >= 80  ? 'bg-amber-500'
    :              'bg-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-xs text-zinc-400">
          {current.toLocaleString('en-US')} / {max.toLocaleString('en-US')}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: 'active' | 'paused' | 'no-matches' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    )
  }
  if (status === 'paused') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
        Paused
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      No matches
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const [bg, text] =
    score >= 80 ? ['bg-emerald-500/15', 'text-emerald-400']
    : score >= 60 ? ['bg-amber-500/15', 'text-amber-400']
    : score >= 40 ? ['bg-orange-500/15', 'text-orange-400']
    :               ['bg-red-500/15', 'text-red-400']

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
      {score}
    </span>
  )
}

function getSearchStatus(
  s: { active: boolean; lastRunStats: LastRunStats | null },
): 'active' | 'paused' | 'no-matches' {
  if (!s.active) return 'paused'
  if (s.lastRunStats && s.lastRunStats.newlyInserted === 0) return 'no-matches'
  return 'active'
}

function humanizeProviderError(providerErrors: Record<string, string> | undefined): string | null {
  if (!providerErrors) return null
  const entries = Object.entries(providerErrors)
  if (entries.length === 0) return null
  const [provider, raw] = entries[0]
  const msg = (raw || '').toLowerCase()
  let reason: string
  if (msg.includes('402') || msg.includes('insufficient credits')) reason = 'out of credits'
  else if (msg.includes('429') || msg.includes('rate limit')) reason = 'rate limited'
  else if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted')) reason = 'timed out'
  else if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden')) reason = 'auth failed'
  else reason = 'scrape failed'
  return `${provider}: ${reason}`
}

function activityResult(stats: LastRunStats | null): {
  label: string
  color: 'emerald' | 'amber' | 'zinc' | 'red'
} {
  if (!stats) return { label: 'No data', color: 'zinc' }
  if (stats.newlyInserted > 0) return { label: `+${stats.newlyInserted} new`, color: 'emerald' }
  const errorLabel = humanizeProviderError(stats.providerErrors)
  if (errorLabel) return { label: errorLabel, color: 'red' }
  if (stats.apifyReturned === 0) return { label: 'Source empty', color: 'amber' }
  return { label: '0 matches', color: 'amber' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/dashboard')

  const db = getDb()
  const userId = session.user.id

  // ── Step 1: fetch the user row first (lightweight) ──────────────────────────
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!userRow) redirect('/login')

  const plan = getPlan(userRow.plan)
  const previousLastSeenAt = userRow.lastSeenAt ?? null

  // ── Step 2: all remaining queries in parallel ───────────────────────────────
  const [
    userSearches,
    listingStatsRaw,
    dealCountsRaw,
    recentActivity,
    topDeals,
    newSinceRaw,
  ] = await Promise.all([
    db
      .select()
      .from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.createdAt)),

    db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        last24h: sql<number>`cast(count(*) filter (where ${listings.seenAt} > now() - interval '24 hours') as int)`,
        prev24h: sql<number>`cast(count(*) filter (where ${listings.seenAt} between now() - interval '48 hours' and now() - interval '24 hours') as int)`,
        avgScore7d: sql<number | null>`cast(avg(${listings.dealScore}) filter (where ${listings.seenAt} > now() - interval '7 days') as int)`,
      })
      .from(listings)
      .innerJoin(searches, eq(listings.searchId, searches.id))
      .where(eq(searches.userId, userId)),

    db
      .select({
        searchId: listings.searchId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(listings)
      .innerJoin(searches, eq(listings.searchId, searches.id))
      .where(eq(searches.userId, userId))
      .groupBy(listings.searchId),

    db
      .select({
        id: searches.id,
        name: searches.name,
        lastRunAt: searches.lastRunAt,
        lastRunStats: searches.lastRunStats,
      })
      .from(searches)
      .where(and(eq(searches.userId, userId), isNotNull(searches.lastRunAt)))
      .orderBy(desc(searches.lastRunAt))
      .limit(10),

    db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        image: listings.image,
        dealScore: listings.dealScore,
        savings: listings.savings,
        searchName: searches.name,
        searchId: searches.id,
      })
      .from(listings)
      .innerJoin(searches, eq(listings.searchId, searches.id))
      .where(
        and(
          eq(searches.userId, userId),
          eq(searches.active, true),
          isNotNull(listings.dealScore),
          sql`${listings.seenAt} >= now() - interval '7 days'`,
        ),
      )
      .orderBy(desc(listings.dealScore))
      .limit(5),

    previousLastSeenAt
      ? db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(listings)
          .innerJoin(searches, eq(listings.searchId, searches.id))
          .where(and(eq(searches.userId, userId), gte(listings.seenAt, previousLastSeenAt)))
      : Promise.resolve([{ count: 0 as number }]),
  ])

  // ── Update lastSeenAt fire-and-forget (don't block render) ──────────────────
  db.update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.id, userId))
    .catch(() => {})

  // ── Derived values ──────────────────────────────────────────────────────────
  const firstName = (userRow.name ?? session.user?.name ?? 'there').split(' ')[0]
  const stats = listingStatsRaw[0] ?? { total: 0, last24h: 0, prev24h: 0, avgScore7d: null }
  const delta24h = (stats.last24h ?? 0) - (stats.prev24h ?? 0)
  const dealCountMap = Object.fromEntries(dealCountsRaw.map((r) => [r.searchId, r.count]))
  const newSinceLastVisit = newSinceRaw[0]?.count ?? 0
  const isProOrDealer = plan.id === 'pro' || plan.id === 'dealer'

  const activeSearchCount = userSearches.filter((s) => s.active).length
  const pausedSearchCount = userSearches.length - activeSearchCount

  // Stat card tone for searches
  const searchPct = plan.maxSearches > 0 ? activeSearchCount / plan.maxSearches : 0
  const searchTone =
    searchPct >= 1    ? 'red'
    : searchPct >= 0.8 ? 'amber'
    :                    'emerald'

  // Sort: active first (by nextRunAt ASC), then paused (by name)
  const sortedSearches = [...userSearches].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    if (a.active && b.active) {
      const an = a.nextRunAt?.getTime() ?? Infinity
      const bn = b.nextRunAt?.getTime() ?? Infinity
      return an - bn
    }
    return a.name.localeCompare(b.name)
  })

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className="px-6 py-8 sm:px-10">
      <div className="max-w-5xl space-y-8">

        {/* ── Upgrade success banner ── */}
        {upgraded === '1' && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span>
              <span className="font-semibold">Plan upgraded!</span> Your new limits are active immediately.
            </span>
          </div>
        )}

        {/* ── Zone 1: Header ── */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Last visit {formatDistanceToNow(previousLastSeenAt ?? userRow.createdAt ?? new Date(), { addSuffix: true })}
            {newSinceLastVisit > 0 && (
              <span className="ml-2 text-emerald-400">
                · {newSinceLastVisit} new deal{newSinceLastVisit !== 1 ? 's' : ''} while you were away
              </span>
            )}
          </p>
        </div>

        {/* ── Zone 2: Stat cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Active searches */}
          <StatCard
            icon={<Search size={18} />}
            label="Active Searches"
            value={`${activeSearchCount} of ${plan.maxSearches}`}
            subtext={pausedSearchCount > 0 ? `${pausedSearchCount} paused` : 'All running'}
            tone={searchTone as 'emerald' | 'amber' | 'red'}
          />

          {/* Card 2: Deals tracked */}
          <StatCard
            icon={<Package size={18} />}
            label="Deals Tracked"
            value={(stats.total ?? 0).toLocaleString('en-US')}
            subtext={`across ${userSearches.length} search${userSearches.length !== 1 ? 'es' : ''}`}
            tone="zinc"
          />

          {/* Card 3: New last 24h */}
          <StatCard
            icon={<TrendingUp size={18} />}
            label="New Last 24h"
            value={(stats.last24h ?? 0).toString()}
            subtext={
              delta24h > 0
                ? `+${delta24h} vs yesterday`
                : delta24h < 0
                ? `${delta24h} vs yesterday`
                : 'Same as yesterday'
            }
            tone={delta24h > 0 ? 'emerald' : 'zinc'}
          />

          {/* Card 4: Avg deal score */}
          {isProOrDealer ? (
            <StatCard
              icon={<Sparkles size={18} />}
              label="Avg Deal Score"
              value={stats.avgScore7d != null ? `${stats.avgScore7d}/100` : '—'}
              subtext="Last 7 days"
              tone={
                stats.avgScore7d == null ? 'zinc'
                : stats.avgScore7d >= 70 ? 'emerald'
                : stats.avgScore7d >= 50 ? 'amber'
                : 'red'
              }
            />
          ) : (
            <div className="rounded-xl border border-white/8 bg-zinc-900 p-5">
              <div className="mb-3 text-zinc-600">
                <Sparkles size={18} />
              </div>
              <div className="text-sm font-semibold text-zinc-500">AI Deal Score</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
                <Lock size={12} />
                Pro feature
              </div>
              <Link
                href="/pricing"
                className="mt-3 block text-xs font-medium text-emerald-400 hover:underline"
              >
                Unlock with Pro →
              </Link>
            </div>
          )}
        </div>

        {/* ── Zone 3: Two panels ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">

          {/* Panel A: Top deals this week */}
          <div className="rounded-xl border border-white/8 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Sparkles size={15} className="text-emerald-400" />
                Top deals this week
              </h2>
              <Link
                href="/dashboard/listings"
                className="flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <p className="mb-4 text-xs text-zinc-500">Highest-scored listings from your active searches</p>

            {!isProOrDealer ? (
              /* Free user: blurred preview + lock */
              <div className="relative">
                <div className="pointer-events-none select-none blur-sm">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-3/4 rounded bg-zinc-700" />
                        <div className="h-2 w-1/3 rounded bg-zinc-800" />
                      </div>
                      <div className="h-6 w-10 rounded-full bg-zinc-700" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                    <Lock size={18} className="text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-200">See your top deals with Pro</p>
                  <Link
                    href="/pricing"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            ) : topDeals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">No scored deals yet.</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {userSearches.length === 0
                    ? 'Create a search to start finding deals.'
                    : 'Run your searches to score deals automatically.'}
                </p>
                {userSearches.length === 0 && (
                  <Link
                    href="/dashboard/searches/new"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <Plus size={13} />
                    Create first search
                  </Link>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {topDeals.map((deal) => (
                  <li key={deal.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {/* Thumbnail */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      {deal.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={deal.image}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg viewBox="0 0 48 48" fill="none" className="h-7 w-7 text-zinc-600" aria-hidden="true">
                            <path d="M8 34 L12 22 L20 18 L28 18 L36 22 L40 34 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M17 18 L20 12 L28 12 L31 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <circle cx="16" cy="35" r="4" stroke="currentColor" strokeWidth="2" />
                            <circle cx="32" cy="35" r="4" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100" title={deal.title}>
                        {deal.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span>${deal.price.toLocaleString('en-US')}</span>
                        {deal.savings && deal.savings > 0 && (
                          <span className="text-emerald-500">
                            −${deal.savings.toLocaleString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score + link */}
                    <div className="flex shrink-0 items-center gap-2">
                      {deal.dealScore != null && <ScoreBadge score={deal.dealScore} />}
                      <Link
                        href={`/dashboard/listings?search=${deal.searchId}`}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Panel B: Recent activity */}
          <div className="rounded-xl border border-white/8 bg-zinc-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={15} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-100">Recent activity</h2>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-zinc-500">No runs yet.</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Click Run Now on a search to see activity.
                </p>
                {userSearches.length > 0 && (
                  <Link
                    href="/dashboard/searches"
                    className="mt-3 inline-block text-xs text-emerald-400 hover:underline"
                  >
                    Go to searches →
                  </Link>
                )}
              </div>
            ) : (
              <ul className="space-y-0 divide-y divide-white/5">
                {recentActivity.map((run) => {
                  const result = activityResult(run.lastRunStats)
                  const timeAgo = run.lastRunAt
                    ? formatDistanceToNow(run.lastRunAt, { addSuffix: true })
                    : null
                  const pillColor =
                    result.color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : result.color === 'amber'
                      ? 'bg-amber-500/10 text-amber-400'
                      : result.color === 'red'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-zinc-800 text-zinc-500'

                  return (
                    <li key={run.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-200">{run.name}</p>
                        {timeAgo && (
                          <p className="text-[11px] text-zinc-600">{timeAgo}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${pillColor}`}>
                        {result.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Zone 4: Your searches ── */}
        <div className="rounded-xl border border-white/8 bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-100">Your searches</h2>
            <Link
              href="/dashboard/searches/new"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <Plus size={13} />
              New search
            </Link>
          </div>

          {/* Rows */}
          {sortedSearches.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-400">No searches yet.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Create your first search to start hunting for deals 24/7.
              </p>
              <Link
                href="/dashboard/searches/new"
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <Plus size={14} />
                Create first search
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {sortedSearches.map((s) => {
                const status = getSearchStatus({ active: s.active, lastRunStats: s.lastRunStats })
                const dealCount = dealCountMap[s.id] ?? 0
                const nextRunText =
                  s.active && s.nextRunAt
                    ? `Next run ${formatDistanceToNow(s.nextRunAt, { addSuffix: true })}`
                    : s.active
                    ? 'Pending first run'
                    : null

                return (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap"
                  >
                    {/* Name + location */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/listings?search=${s.id}`}
                        className="text-sm font-medium text-zinc-100 hover:text-emerald-400 transition-colors"
                      >
                        {s.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600">
                        <span>{s.city}, {s.state}</span>
                        {s.frequencyMinutes && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Clock size={11} className="shrink-0" />
                              {FREQUENCY_LABELS[s.frequencyMinutes] ?? 'Custom'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <StatusPill status={status} />

                    {/* Next run / paused */}
                    <div className="hidden text-xs text-zinc-500 sm:block sm:w-40 sm:shrink-0">
                      {nextRunText ?? <span className="text-zinc-700">—</span>}
                    </div>

                    {/* Deal count */}
                    <div className="shrink-0 text-right text-xs font-medium text-zinc-400 sm:w-20">
                      {dealCount.toLocaleString('en-US')} deal{dealCount !== 1 ? 's' : ''}
                    </div>

                    {/* Run now */}
                    <div className="shrink-0">
                      <RunNowButton searchId={s.id} searchName={s.name} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Footer: view all */}
          {sortedSearches.length > 0 && (
            <div className="border-t border-white/5 px-5 py-3 text-center">
              <Link
                href="/dashboard/searches"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Manage all searches →
              </Link>
            </div>
          )}
        </div>

        {/* ── Zone 5: Plan & usage ── */}
        <div className="rounded-xl border border-white/8 bg-zinc-900 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Plan name + price */}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    plan.id === 'dealer'
                      ? 'bg-purple-500/15 text-purple-300'
                      : plan.id === 'pro'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {plan.name}
                </span>
                <span className="text-xs text-zinc-500">{plan.priceLabel}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">
                {plan.id === 'free'
                  ? 'Upgrade for faster polling, more searches, and AI scoring.'
                  : plan.id === 'pro'
                  ? 'AI deal scoring + instant alerts active.'
                  : 'Full dealer access — all features unlocked.'}
              </p>
            </div>

            {/* Upgrade CTA */}
            {plan.id === 'free' && (
              <Link
                href="/pricing"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Upgrade to Pro
              </Link>
            )}
            {plan.id === 'pro' && (
              <Link href="/pricing" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Upgrade to Dealer →
              </Link>
            )}
            {plan.id === 'dealer' && (
              <Link href="/dashboard/billing" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Manage subscription →
              </Link>
            )}
          </div>

          {/* Progress bars */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ProgressBar
              label="Searches"
              current={userSearches.length}
              max={plan.maxSearches}
            />
            <ProgressBar
              label="Runs today"
              current={userRow.runsToday}
              max={plan.maxRunsPerDay}
            />
            <ProgressBar
              label="Runs this month"
              current={userRow.runsThisMonth}
              max={plan.maxRunsPerMonth}
            />
          </div>
        </div>

      </div>
    </section>
  )
}
