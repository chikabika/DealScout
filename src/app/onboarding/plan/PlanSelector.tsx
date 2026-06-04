'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Building2, Gift } from 'lucide-react'
import { openOverlayCheckout } from '@/lib/lemonsqueezy-overlay'

type Props = {
  userName: string | null
  userId: string
  userEmail: string
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try DealScout and see deals before others.',
    icon: Gift,
    iconColor: 'text-zinc-400',
    borderColor: 'border-zinc-700',
    bgColor: 'bg-zinc-900',
    features: [
      '3 searches (lifetime)',
      'Facebook Marketplace',
      'Twice daily alerts',
      'Daily email digest',
      '20 total runs lifetime',
    ],
    cta: 'Start for free',
    ctaClass: 'bg-zinc-700 hover:bg-zinc-600 text-white',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For serious buyers and car flippers.',
    icon: Zap,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    bgColor: 'bg-zinc-900',
    features: [
      '5 searches',
      'Facebook + Craigslist',
      'Every 4 hours polling',
      'Instant email alerts',
      'AI deal scoring (Sonnet 4)',
      'Condition analysis + red flags',
    ],
    cta: 'Start with Pro',
    ctaClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    popular: true,
  },
  {
    id: 'dealer',
    name: 'Dealer',
    price: '$149',
    period: '/month',
    description: 'For dealers and high-volume buyers.',
    icon: Building2,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-zinc-900',
    features: [
      '15 searches',
      'Facebook + Craigslist + Cars.com',
      'Every 2 hours polling',
      'Instant email alerts',
      'AI deal scoring (Sonnet 4)',
      'Full market coverage',
    ],
    cta: 'Start with Dealer',
    ctaClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    popular: false,
  },
]

export function PlanSelector({ userName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const firstName = userName?.split(' ')[0] ?? 'there'

  async function handleSelect(planId: string) {
    setError(null)
    setLoading(planId)

    if (planId === 'free') {
      router.push('/dashboard')
      return
    }

    try {
      const res = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      await openOverlayCheckout(data.url, () => {
        router.push('/dashboard?upgraded=1')
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <span className="text-2xl">🚗</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Welcome, {firstName}!
          </h1>
          <p className="mt-3 mx-auto max-w-md text-zinc-400">
            Choose your plan to start getting car deal alerts. You can upgrade or cancel anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isLoading = loading === plan.id

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${plan.borderColor} ${plan.bgColor} ${plan.popular ? 'ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-900/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                    <span className="text-sm font-semibold text-zinc-300">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-400">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">{plan.description}</p>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={loading !== null}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${plan.ctaClass}`}
                >
                  {isLoading
                    ? plan.id === 'free'
                      ? 'Redirecting...'
                      : 'Opening checkout...'
                    : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-red-400">{error}</p>
        )}

        <p className="mt-8 text-center text-xs text-zinc-600">
          <button
            onClick={() => router.push('/dashboard')}
            className="underline underline-offset-2 transition-colors hover:text-zinc-400"
          >
            Skip for now and continue with Free
          </button>
        </p>

      </div>
    </div>
  )
}
