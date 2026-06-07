import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { PLANS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for CarDealAlerts. Start free with 1 saved search.',
  alternates: { canonical: '/pricing' },
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cta,
  ctaHref,
  ctaVariant = 'outline',
}: {
  plan: (typeof PLANS)[keyof typeof PLANS]
  cta: string
  ctaHref: string
  ctaVariant?: 'primary' | 'outline' | 'ghost'
}) {
  const isPopular = 'popular' in plan && plan.popular

  const ctaClass =
    ctaVariant === 'primary'
      ? 'block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500'
      : ctaVariant === 'outline'
      ? 'block w-full rounded-xl border border-white/20 py-3 text-center text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-white/40 hover:text-white'
      : 'block w-full rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200'

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 ${
        isPopular
          ? 'border-2 border-emerald-500 bg-zinc-900'
          : 'border border-zinc-800 bg-zinc-900'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">
            Most popular
          </span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-zinc-400">/month</span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="mt-1 text-xs text-zinc-500">Billed monthly. Cancel anytime.</p>
        )}
      </div>

      <div className="my-6 border-t border-zinc-800" />

      <ul className="flex-1 space-y-3">
        {(plan.features as readonly string[]).map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link href={ctaHref} className={ctaClass}>
          {cta}
        </Link>
      </div>
    </div>
  )
}

// ─── What you get table ───────────────────────────────────────────────────────

const comparisonRows = [
  { label: 'Saved searches',      free: '1 (lifetime)',  pro: '5',           dealer: '15' },
  { label: 'Marketplaces',        free: 'Facebook only', pro: 'FB + CL',     dealer: 'FB + CL + Cars.com' },
  { label: 'Polling frequency',   free: 'Every 12 hrs',  pro: 'Every 4 hrs', dealer: 'Every 2 hrs' },
  { label: 'Email alerts',        free: 'Daily digest',  pro: 'Instant',     dealer: 'Instant' },
  { label: 'AI deal scoring',     free: false,           pro: true,          dealer: true },
  { label: 'Runs per day',        free: '6',             pro: '30',          dealer: '180' },
  { label: 'Items per run',       free: '10',            pro: '15',          dealer: '20' },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} className="mx-auto text-emerald-400" />
  if (value === false) return <X size={16} className="mx-auto text-zinc-600" />
  return <span className="text-zinc-300">{value}</span>
}

// ─── Dashboard mockup ─────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl shadow-black/50">
      {/* Top bar */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-950 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-3 text-xs text-zinc-500">CarDealAlerts — Dashboard</span>
      </div>
      <div className="flex h-[340px]">
        {/* Sidebar */}
        <div className="hidden w-36 shrink-0 border-r border-white/8 bg-zinc-950 p-4 sm:block">
          <div className="space-y-1">
            {['Dashboard', 'Searches', 'Deals', 'Billing'].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-xs ${i === 0 ? 'bg-emerald-500/15 font-medium text-emerald-300' : 'text-zinc-500'}`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        {/* Main */}
        <div className="flex-1 overflow-hidden p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Recent deals</p>
          <div className="space-y-2">
            {[
              { title: '2018 Toyota Tacoma SR5', price: '$18,900', score: 91, savings: '+$4,200', loc: 'Tampa, FL' },
              { title: '2020 Honda Civic EX',    price: '$14,200', score: 78, savings: '+$1,800', loc: 'Austin, TX' },
              { title: '2017 Ford F-150 XLT',    price: '$22,500', score: 84, savings: '+$3,100', loc: 'Denver, CO' },
            ].map((deal) => (
              <div key={deal.title} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-zinc-800/50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-200">{deal.title}</p>
                  <p className="text-[11px] text-zinc-500">{deal.loc} · {deal.price}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-400">{deal.savings}</span>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                    {deal.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <p className="text-[11px] text-emerald-300">
              <span className="font-semibold">3 new deals</span> found in the last 4 hours across 2 searches.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'What do I get immediately after upgrading?',
    a: 'Your account is upgraded instantly. You can create additional saved searches right away, and the next scheduled run will use your new plan limits, polling frequency, and marketplaces.',
  },
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade or downgrade at any time through your billing dashboard. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What happens to my searches if I downgrade?',
    a: "Searches over your new plan's limit are paused, not deleted. Upgrade again to resume them.",
  },
  {
    q: 'How does billing work?',
    a: 'Paid plans are billed monthly and renew automatically. You can cancel at any time before the next billing date to stop renewals. You keep access until the end of the period you paid for.',
  },
  {
    q: 'What is your refund policy?',
    a: 'Payments are generally non-refundable once a billing period starts. We may approve refunds for billing errors, duplicate charges, or major technical issues. See our Refund Policy for full details.',
  },
  {
    q: 'Is there a free plan?',
    a: '1 saved search is enough to prove CarDealAlerts\' value. When you\'re ready for more, upgrade to Pro.',
  },
  {
    q: "What does 'runs' mean?",
    a: "A run is one scan of a marketplace for a search. Each search runs automatically on your plan's polling schedule.",
  },
  {
    q: 'Is CarDealAlerts affiliated with Facebook or Craigslist?',
    a: 'No. CarDealAlerts is an independent tool and is not affiliated with, endorsed by, or partnered with Facebook, Craigslist, Cars.com, or any marketplace.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/">
            <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pb-24">

        {/* Hero */}
        <div className="py-20 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-500">Pricing</p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
            Start free with 1 saved search. Upgrade when you need more speed, more searches, or more marketplaces.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            All paid plans are billed monthly and can be cancelled at any time.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <PlanCard
            plan={PLANS.free}
            cta="Create Your First Alert"
            ctaHref="/register"
            ctaVariant="ghost"
          />
          <PlanCard
            plan={PLANS.pro}
            cta="Upgrade to Pro"
            ctaHref="/dashboard/billing?plan=pro"
            ctaVariant="primary"
          />
          <PlanCard
            plan={PLANS.dealer}
            cta="Upgrade to Dealer"
            ctaHref="/dashboard/billing?plan=dealer"
            ctaVariant="outline"
          />
        </div>

        {/* What you get after payment */}
        <div className="mt-20 rounded-2xl border border-white/10 bg-zinc-900/60 p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white">What you get after upgrading</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Your plan upgrades instantly after payment. Here is exactly what changes.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500">Feature</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">Free</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-widest text-emerald-400">Pro</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">Dealer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows.map(({ label, free, pro, dealer }) => (
                  <tr key={label}>
                    <td className="py-3 text-zinc-300">{label}</td>
                    <td className="py-3 text-center text-zinc-400"><Cell value={free} /></td>
                    <td className="py-3 text-center"><Cell value={pro} /></td>
                    <td className="py-3 text-center text-zinc-400"><Cell value={dealer} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-zinc-600">
            Paid plans renew monthly. Cancel at any time before your next billing date. After cancellation, your plan stays active until the end of the period you paid for.
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">What you'll see</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Your deal dashboard</h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              After signing up, your dashboard shows every matching listing, sorted by AI deal score with estimated savings and red flags.
            </p>
          </div>
          <DashboardMockup />
          <p className="mt-4 text-center text-xs text-zinc-600">
            Dashboard mockup — actual layout may vary. Deal scores and savings are AI estimates, not guarantees.
          </p>
        </div>

        {/* Billing transparency box */}
        <div className="mt-16 rounded-xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">Billing &amp; cancellation</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ['Monthly billing', 'Paid plans renew on the same day each month. No annual commitment required.'],
              ['Cancel anytime', 'Cancel through your billing portal at any time. Access continues until the end of your paid period.'],
              ['Refund policy', 'Payments are non-refundable unless there was a billing error or major technical issue. See our Refund Policy.'],
            ].map(([title, body]) => (
              <div key={title as string} className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">{title as string}</p>
                <p className="text-xs leading-5 text-zinc-500">{body as string}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span>Questions?</span>
            <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
              support@cardealalerts.com
            </a>
            <Link href="/refund-policy" className="hover:text-zinc-300 underline">Refund Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 underline">Terms of Service</Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold text-white">
            Frequently asked questions
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="font-semibold text-zinc-100">{q}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-zinc-950 px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md space-y-3">
              <Link href="/">
                <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-8 w-auto" />
              </Link>
              <p className="text-xs leading-5 text-zinc-500">
                CarDealAlerts is not affiliated with Facebook, Craigslist, Cars.com, OfferUp, AutoTrader, or any vehicle marketplace. All trademarks belong to their respective owners.
              </p>
              <p className="text-xs text-zinc-500">
                Support:{' '}
                <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
                  support@cardealalerts.com
                </a>
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
              <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">Refund Policy</Link>
              <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link>
            </nav>
          </div>
          <div className="border-t border-white/8 pt-5 text-xs text-zinc-600">
            © {new Date().getFullYear()} CarDealAlerts. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
