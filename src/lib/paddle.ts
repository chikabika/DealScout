import 'server-only'

import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import type { PlanId } from '@/lib/plans'

let paddle: Paddle | null = null

export function getPaddle() {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error('PADDLE_API_KEY is not set.')
  }

  paddle ??= new Paddle(process.env.PADDLE_API_KEY, {
    environment: process.env.PADDLE_ENV === 'production'
      ? Environment.production
      : Environment.sandbox,
  })

  return paddle
}

export function getPlanIdForPaddlePrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_DEALER_PRICE_ID) return 'dealer'
  return null
}

export function getPaddlePriceIdForPlan(planId: PlanId): string | null {
  if (planId === 'pro') return process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID ?? null
  if (planId === 'dealer') return process.env.NEXT_PUBLIC_PADDLE_DEALER_PRICE_ID ?? null
  return null
}

export function mapSubscriptionStatusToPlan(status: string | null | undefined, priceId: string | null | undefined): PlanId {
  if (status !== 'active' && status !== 'trialing') return 'free'
  return getPlanIdForPaddlePrice(priceId) ?? 'free'
}
