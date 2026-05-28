import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Activity, Calendar, CreditCard, Mail, Search, Shield, Sparkles, User } from 'lucide-react'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { listings, searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'
import { LogoutButton } from '../LogoutButton'

function ProgressBar({
  label,
  current,
  max,
}: {
  label: string
  current: number
  max: number
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const color =
    pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <span className="text-xs text-zinc-400">
          {current.toLocaleString('en-US')} / {max.toLocaleString('en-US')}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-4 py-3">
      <div className="text-zinc-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-100">{value}</p>
      </div>
    </div>
  )
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/profile')
  }

  const db = getDb()
  const userId = session.user.id

  const [userRows, searchStatsRows, listingStatsRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),

    db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        active: sql<number>`cast(count(*) filter (where ${searches.active} = true) as int)`,
        paused: sql<number>`cast(count(*) filter (where ${searches.active} = false) as int)`,
      })
      .from(searches)
      .where(eq(searches.userId, userId)),

    db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        scored: sql<number>`cast(count(*) filter (where ${listings.dealScore} is not null) as int)`,
      })
      .from(listings)
      .innerJoin(searches, eq(listings.searchId, searches.id))
      .where(eq(searches.userId, userId)),
  ])

  const user = userRows[0]
  if (!user) {
    redirect('/login')
  }

  const plan = getPlan(user.plan)
  const searchStats = searchStatsRows[0] ?? { total: 0, active: 0, paused: 0 }
  const listingStats = listingStatsRows[0] ?? { total: 0, scored: 0 }
  const displayName = user.name?.trim() || session.user.name || 'DealScout user'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DS'

  const joinedAt = user.createdAt
    ? user.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown'
  const lastSeen = user.lastSeenAt
    ? formatDistanceToNow(user.lastSeenAt, { addSuffix: true })
    : 'First dashboard visit'

  return (
    <section className="px-6 py-8 sm:px-10">
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Profile</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your account details, plan, and current usage.
            </p>
          </div>
          <LogoutButton className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl font-bold text-emerald-400">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-semibold text-zinc-100">{displayName}</h2>
                <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    {plan.name} plan
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400">
                    {searchStats.active} active searches
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailRow icon={<User size={16} />} label="Name" value={displayName} />
              <DetailRow icon={<Mail size={16} />} label="Email" value={user.email} />
              <DetailRow icon={<Calendar size={16} />} label="Member since" value={joinedAt} />
              <DetailRow icon={<Activity size={16} />} label="Last seen" value={lastSeen} />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center gap-2">
              <Shield size={17} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Account status</h2>
            </div>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs text-zinc-500">Current plan</dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-100">{plan.priceLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Tracked deals</dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-100">
                  {listingStats.total.toLocaleString('en-US')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">AI scored listings</dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-100">
                  {listingStats.scored.toLocaleString('en-US')}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center gap-2">
              <CreditCard size={17} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-100">Plan usage</h2>
            </div>
            <div className="space-y-5">
              <ProgressBar label="Searches" current={searchStats.total} max={plan.maxSearches} />
              <ProgressBar label="Scrapes this month" current={user.scrapesUsedThisMonth} max={plan.maxScrapesPerMonth} />
              <ProgressBar label="AI calls this month" current={user.aiCallsThisMonth} max={plan.maxAiCallsPerMonth} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/billing"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100"
              >
                Billing details
              </Link>
              {plan.id !== 'dealer' && (
                <Link
                  href="/pricing"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  Upgrade plan
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Search size={17} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-100">Search summary</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/5 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Total</p>
                <p className="mt-1 text-2xl font-bold text-zinc-100">{searchStats.total}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4">
                <p className="text-xs text-zinc-500">Active</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">{searchStats.active}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Paused</p>
                <p className="mt-1 text-2xl font-bold text-zinc-300">{searchStats.paused}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/5 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles size={17} className="mt-0.5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">Deal scoring</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {plan.maxAiCallsPerMonth > 0
                      ? 'AI scoring is enabled for your account.'
                      : 'Upgrade to Pro to unlock AI deal scoring on matching listings.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
