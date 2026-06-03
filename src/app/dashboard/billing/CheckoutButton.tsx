'use client'

import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open checkout')
    } finally {
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
        {loading ? 'Opening checkout...' : children}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function ManageSubscriptionButton({ className }: { className: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/lemonsqueezy/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Unable to open portal')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Opening...' : 'Manage subscription'}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
