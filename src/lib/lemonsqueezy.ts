import 'server-only'

import { lemonSqueezySetup, createCheckout, getSubscription } from '@lemonsqueezy/lemonsqueezy.js'

export { getSubscription }

export function setupLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (e) => console.error('[LS]', e),
  })
}

export function mapVariantToPlan(variantId: string | null | undefined): string {
  if (!variantId) return 'free'
  if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID) return 'pro'
  if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_DEALER_VARIANT_ID) return 'dealer'
  return 'free'
}

export function mapStatusToPlan(
  status: string | null | undefined,
  variantId: string | null | undefined,
): string {
  if (!status) return 'free'
  const activeStatuses = ['active', 'trialing', 'past_due']
  if (!activeStatuses.includes(status)) return 'free'
  return mapVariantToPlan(variantId)
}

export async function buildCheckoutUrl(input: {
  variantId: string
  userId: string
  email: string
  planId: string
  redirectUrl: string
}): Promise<string> {
  setupLemonSqueezy()
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!

  // Resolve the base URL — NEXTAUTH_URL is often unset on Vercel; fall back to
  // the canonical production URL that Vercel always provides.
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null)

  if (!baseUrl) {
    throw new Error('Unable to resolve app base URL. Set NEXTAUTH_URL.')
  }

  const redirectUrl = input.redirectUrl.startsWith('http')
    ? input.redirectUrl
    : `${baseUrl}${input.redirectUrl}`

  const { data, error } = await createCheckout(storeId, input.variantId, {
    checkoutOptions: {
      embed: false,
      media: false,
      logo: true,
    },
    checkoutData: {
      email: input.email,
      custom: {
        userId: input.userId,
        planId: input.planId,
      },
    },
    productOptions: {
      redirectUrl,
    },
    expiresAt: null,
    preview: false,
    testMode: process.env.NODE_ENV !== 'production',
  })

  if (error || !data?.data?.attributes?.url) {
    throw new Error(error?.message ?? 'Failed to create checkout')
  }
  return data.data.attributes.url
}
