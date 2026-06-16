'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanId } from '@/lib/plans'

export function CheckoutButton({
  planId,
  children,
  className,
}: {
  planId: Exclude<PlanId, 'free'>
  children: React.ReactNode
  className: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      router.push(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open checkout')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? 'Redirecting to checkout...' : children}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function ManageSubscriptionButton({ className }: { className: string }) {
  return (
    <div>
      <a
        href="mailto:support@cardealalerts.com?subject=Manage%20Subscription"
        className={className}
      >
        Manage subscription
      </a>
      <p className="mt-2 text-xs text-zinc-500">
        To cancel or update your plan, email{' '}
        <a href="mailto:support@cardealalerts.com" className="text-emerald-400 underline">
          support@cardealalerts.com
        </a>
      </p>
    </div>
  )
}
