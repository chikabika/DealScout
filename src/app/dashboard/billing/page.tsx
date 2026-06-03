import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { Check, Clock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan, PLANS } from '@/lib/plans'
import { CheckoutButton, ManageSubscriptionButton } from './CheckoutButton'

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

// ─── Usage bar card ───────────────────────────────────────────────────────────

function UsageBar({
  label,
  sublabel,
  used,
  max,
}: {
  label: string
  sublabel: string
  used: number
  max: number
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{used.toLocaleString()}</p>
      <p className="mb-3 text-xs text-zinc-600">{sublabel}</p>
      <ProgressBar used={used} max={max} />
      <p className="mt-2 text-xs text-zinc-600">{used.toLocaleString()} / {max.toLocaleString()}</p>
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
          Polls every {plan.pollingMinutes < 60
            ? `${plan.pollingMinutes} min`
            : `${plan.pollingMinutes / 60}h`}
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

      {!isCurrent && plan.id === 'free' && (
        <Link
          href="/pricing"
          className="mt-5 block rounded-lg border border-white/10 py-2 text-center text-xs font-semibold text-zinc-300 hover:border-white/20 hover:text-zinc-100 transition-colors"
        >
          Switch to Free
        </Link>
      )}

      {!isCurrent && plan.id !== 'free' && (
        <div className="mt-5">
          <CheckoutButton
            planId={plan.id}
            className="block w-full rounded-lg bg-emerald-600 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            Upgrade to {plan.name}
          </CheckoutButton>
        </div>
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

  const userId = session.user.id
  const db = getDb()

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      runsToday: users.runsToday,
      runsThisMonth: users.runsThisMonth,
      lsSubscriptionStatus: users.lsSubscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const [{ count: searchCount }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(searches)
    .where(eq(searches.userId, userId))

  const plan = getPlan(user?.plan ?? 'free')
  const runsToday = user?.runsToday ?? 0
  const runsThisMonth = user?.runsThisMonth ?? 0

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
              <CheckoutButton
                planId="pro"
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upgrade to Pro
              </CheckoutButton>
            ) : (
              <ManageSubscriptionButton className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60" />
            )}
          </div>
          {user?.lsSubscriptionStatus && (
            <p className="mt-4 text-xs text-zinc-500">
              Subscription status: <span className="text-zinc-300">{user.lsSubscriptionStatus}</span>
            </p>
          )}
        </div>

        {/* Usage */}
        <div className="mt-6">
          <h2 className="text-base font-semibold text-zinc-200">Usage</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <UsageBar
              label="Searches"
              sublabel={plan.id === 'free' ? 'Lifetime limit' : 'Active searches'}
              used={searchCount}
              max={plan.maxSearches}
            />
            <UsageBar
              label="Runs today"
              sublabel="Resets at midnight UTC"
              used={runsToday}
              max={plan.maxRunsPerDay}
            />
            <UsageBar
              label={plan.id === 'free' ? 'Total runs used' : 'Runs this month'}
              sublabel={plan.id === 'free' ? 'Lifetime limit — never resets' : 'Resets on the 1st'}
              used={runsThisMonth}
              max={plan.maxRunsPerMonth}
            />
          </div>
        </div>

        {/* Plan comparison */}
        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-200">All plans</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Free polls every 12h. Pro polls every 4h. Dealer polls every 2h.
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
              <CompactPlanCard
                key={p.id}
                plan={p}
                isCurrent={p.id === plan.id}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
