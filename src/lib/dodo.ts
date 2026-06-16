import 'server-only'
import DodoPayments from 'dodopayments'

function getClient() {
  const env = process.env.DODO_ENVIRONMENT === 'live' ? 'live_mode' : 'test_mode'
  return new DodoPayments({
    bearerToken: process.env.DODO_API_KEY!,
    environment: env,
  })
}

export function mapProductToPlan(productId: string | null | undefined): string {
  if (!productId) return 'free'
  if (productId === process.env.DODO_PRO_PRODUCT_ID) return 'pro'
  if (productId === process.env.DODO_DEALER_PRODUCT_ID) return 'dealer'
  return 'free'
}

export function effectivePlan(user: {
  plan: string
  subscriptionStatus: string | null
  currentPeriodEnd: Date | null
}): string {
  if (user.plan === 'free') return 'free'
  const gracelessStatuses = ['on_hold', 'failed', 'unpaid']
  if (gracelessStatuses.includes(user.subscriptionStatus ?? '')) return 'free'
  if (user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'expired') {
    if (!user.currentPeriodEnd || user.currentPeriodEnd < new Date()) return 'free'
  }
  return user.plan
}

export async function buildCheckoutUrl(input: {
  productId: string
  userId: string
  email: string
  name: string | null
  planId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const client = getClient()

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: input.productId, quantity: 1 }],
    customer: {
      email: input.email,
      name: input.name ?? input.email,
    },
    metadata: {
      userId: input.userId,
      planId: input.planId,
    },
    return_url: input.successUrl,
    cancel_url: input.cancelUrl,
  })

  const url = session.checkout_url
  if (!url) throw new Error('Dodo did not return a checkout_url')
  return url
}
