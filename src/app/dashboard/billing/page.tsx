import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { Calendar, Check, Clock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan, PLANS } from '@/lib/plans'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ used, max }: { used: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, (used / max) * 100)
  const color =
    pct < 70 ? 'bg-emerald-500' : pct < 95 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className={`h-full rounded-full ${color} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Compact plan card ────────────────────────────────────────────────────────

function CompactPlanCard({
  plan,
  isCurrent,
}: {
  plan: (typeof PLANS)[keyof typeof PLANS]
  isCurrent: boolean
}) {
  const isPopular = 'popular' in plan && plan.popular

  return (
    <div
      className={`relative flex flex-col rounded-xl p-5 ${
        isCurrent
          ? 'border-2 border-zinc-600 bg-zinc-800'
          : isPopular
          ? 'border border-emerald-500/50 bg-zinc-900'
          : 'border border-zinc-800 bg-zinc-900'
      }`}
    >
      {isCurrent && (
        <span className="absolute right-3 top-3 rounded-full bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
          Current
        </span>
      )}

      <h3 className="text-sm font-bold text-white">{plan.name}</h3>
      <p className="mt-1 text-xl font-bold text-white">
        {plan.price === 0 ? 'Free' : `$${plan.price}`}
        {plan.price > 0 && <span className="text-sm font-normal text-zinc-400">/mo</span>}
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
        <Clock size={13} className="text-emerald-400" />
        <span>
          Polls every {plan.minFrequencyMinutes < 60
            ? `${plan.minFrequencyMinutes} min`
            : `${plan.minFrequencyMinutes / 60}h`}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5">
        {(plan.features as readonly string[]).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
            <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>

      {!isCurrent && (
        <Link
          href={plan.price === 0 ? '/pricing' : `/dashboard/billing?plan=${plan.id}`}
          className="mt-5 block rounded-lg bg-emerald-600 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          {plan.price > 0 ? `Upgrade to ${plan.name}` : 'Switch to Free'}
        </Link>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/billing')
  }

  const db = getDb()

  const [user] = await db
    .select({
      plan: users.plan,
      scrapesUsedThisMonth: users.scrapesUsedThisMonth,
      scrapesResetAt: users.scrapesResetAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const [{ count: searchCount }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(searches)
    .where(eq(searches.userId, session.user.id))

  const plan = getPlan(user?.plan ?? 'free')
  const scrapesUsed = user?.scrapesUsedThisMonth ?? 0

  const now = new Date()
  const resetAt =
    user?.scrapesResetAt && user.scrapesResetAt > now
      ? user.scrapesResetAt
      : new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const daysUntilReset = Math.max(
    1,
    Math.ceil((resetAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  )

  const usageItems = [
    {
      label: 'Searches',
      used: searchCount,
      max: plan.maxSearches,
      suffix: `of ${plan.maxSearches}`,
    },
    {
      label: 'Scrapes this month',
      used: scrapesUsed,
      max: plan.maxScrapesPerMonth,
      suffix: `of ${plan.maxScrapesPerMonth.toLocaleString()}`,
    },
  ]

  return (
    <section className="px-6 py-8 sm:px-10">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-white">Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your plan and usage</p>

        {/* Current plan */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Current plan
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">{plan.name}</h2>
              <p className="mt-1 text-xl text-zinc-400">{plan.priceLabel}</p>
            </div>
            {plan.id === 'free' ? (
              <Link
                href="/pricing"
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Upgrade to unlock more
              </Link>
            ) : (
              <button
                disabled
                className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 cursor-not-allowed"
                title="Stripe portal coming soon"
              >
                Manage subscription
              </button>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="mt-6">
          <h2 className="text-base font-semibold text-zinc-200">Usage this month</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {usageItems.map(({ label, used, max, suffix }) => (
              <div
                key={label}
                className="rounded-xl border border-white/5 bg-zinc-900 p-5"
              >
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-100">{used.toLocaleString()}</p>
                <p className="mb-3 text-xs text-zinc-600">{suffix}</p>
                <ProgressBar used={used} max={max} />
              </div>
            ))}

            <div className="rounded-xl border border-white/5 bg-zinc-900 p-5">
              <p className="text-xs text-zinc-500">Resets in</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-zinc-100">{daysUntilReset}</span>
                <span className="text-sm text-zinc-400">day{daysUntilReset === 1 ? '' : 's'}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                <Calendar size={11} />
                <span>{resetAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan comparison */}
        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-200">All plans</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Free polls every 4h. Pro polls every 30min for fresher deals.
              </p>
            </div>
            {plan.id === 'free' && (
              <Link href="/pricing" className="text-sm font-medium text-emerald-400 hover:underline">
                Upgrade for faster polling
              </Link>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(Object.values(PLANS) as (typeof PLANS)[keyof typeof PLANS][]).map((p) => (
              <CompactPlanCard key={p.id} plan={p} isCurrent={p.id === plan.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
