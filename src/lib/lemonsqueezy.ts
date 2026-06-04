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

  const { data, error } = await createCheckout(storeId, input.variantId, {
    checkoutOptions: {
      embed: true,
      media: false,
      logo: true,
    },
    checkoutData: {
      email: input.email,
      redirectUrl: input.redirectUrl,
      custom: {
        userId: input.userId,
        planId: input.planId,
      },
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
