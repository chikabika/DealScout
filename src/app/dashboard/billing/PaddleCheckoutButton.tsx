'use client'

import { useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import type { PlanId } from '@/lib/plans'

let paddlePromise: Promise<Paddle | undefined> | null = null

function getPaddleClient() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
  if (!token) return null

  paddlePromise ??= initializePaddle({
    token,
    environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        variant: 'one-page',
      },
    },
  })

  return paddlePromise
}

export function PaddleCheckoutButton({
  planId,
  priceId,
  userId,
  email,
  customerId,
  children,
  className,
}: {
  planId: Exclude<PlanId, 'free'>
  priceId: string | null
  userId: string
  email: string
  customerId?: string | null
  children: React.ReactNode
  className: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openCheckout() {
    setError(null)

    if (!priceId) {
      setError('Paddle price ID is missing for this plan.')
      return
    }

    const clientPromise = getPaddleClient()
    if (!clientPromise) {
      setError('Paddle client token is not configured.')
      return
    }

    setLoading(true)
    try {
      const paddle = await clientPromise
      if (!paddle) throw new Error('Paddle failed to initialize.')

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: customerId ? { id: customerId } : { email },
        customData: { userId, planId },
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          variant: 'one-page',
          successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open Paddle checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openCheckout}
        disabled={loading}
        className={className}
      >
        {loading ? 'Opening checkout...' : children}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
