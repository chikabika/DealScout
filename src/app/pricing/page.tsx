import Link from 'next/link'
import { Check } from 'lucide-react'
import { PLANS } from '@/lib/plans'

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

      {/* AI Deal Scoring ribbon — Pro only */}
      {'popular' in plan && plan.popular && (
        <div className="absolute -right-1 top-5">
          <div className="flex items-center gap-1 rounded-l-full bg-gradient-to-r from-emerald-600 to-emerald-500 pl-3 pr-2 py-1 text-[11px] font-semibold text-white shadow-lg shadow-emerald-900/40">
            🔥 AI Deal Scoring
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-zinc-400">/mo</span>
          )}
        </div>
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade or downgrade instantly with one click. Changes take effect immediately.',
  },
  {
    q: 'What happens to my searches if I downgrade?',
    a: "Searches over your new plan's limit are paused, not deleted. Upgrade again to resume them.",
  },
  {
    q: 'Do you charge per scrape?',
    a: 'No. Scrapes are included in your monthly plan — no surprise usage bills.',
  },
  {
    q: 'Is there a refund policy?',
    a: '14-day money-back guarantee on all paid plans. No questions asked.',
  },
  {
    q: 'Can I add more searches without upgrading?',
    a: 'Upgrade to Pro for 15 searches or Dealer for 50. The Free plan includes 3 searches permanently.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            DealScout
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero */}
        <div className="py-20 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-500">
            Pricing
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Find your perfect deal-hunting plan
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
            Start free with 3 searches. Upgrade when you&apos;re ready to scale.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <PlanCard
            plan={PLANS.free}
            cta="Get started free"
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

        {/* FAQ */}
        <div className="mt-24">
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
    </div>
  )
}
