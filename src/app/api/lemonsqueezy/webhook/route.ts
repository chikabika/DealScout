import 'server-only'
import crypto from 'crypto'
import { eq, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { mapStatusToPlan, mapVariantToPlan } from '@/lib/lemonsqueezy'

export const runtime = 'nodejs'

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(rawBody)
  const digest = hmac.digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch {
    return false
  }
}

async function upsertUserPlan({
  userId,
  userEmail,
  customerId,
  subscriptionId,
  status,
  variantId,
}: {
  userId: string | null
  userEmail: string
  customerId: string
  subscriptionId: string
  status: string
  variantId: string
}) {
  const plan = mapStatusToPlan(status, variantId)
  const db = getDb()

  // Priority: userId from custom_data → email (always present) → ls IDs
  const where = userId
    ? eq(users.id, userId)
    : userEmail
    ? eq(users.email, userEmail)
    : or(
        eq(users.lsSubscriptionId, subscriptionId),
        eq(users.lsCustomerId, customerId),
      )

  const result = await db.update(users).set({
    plan,
    lsCustomerId: customerId,
    lsSubscriptionId: subscriptionId,
    lsSubscriptionStatus: status,
    lsVariantId: variantId,
  }).where(where)

  console.log(`[LS WEBHOOK] upsertUserPlan — userId:${userId} email:${userEmail} variantId:${variantId} status:${status} → plan:${plan} rowCount:${result.rowCount}`)
  return plan
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[LS WEBHOOK] LEMONSQUEEZY_WEBHOOK_SECRET not set')
    return Response.json({ error: 'not configured' }, { status: 500 })
  }

  const signature = req.headers.get('x-signature') ?? ''
  const rawBody = await req.text()

  if (!verifySignature(rawBody, signature, secret)) {
    console.warn('[LS WEBHOOK] Invalid signature — check LEMONSQUEEZY_WEBHOOK_SECRET matches the secret in LS dashboard')
    return Response.json({ error: 'invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName: string = event.meta?.event_name ?? ''
  const data = event.data?.attributes ?? {}
  const customData = event.meta?.custom_data ?? {}

  const userId = typeof customData.user_id === 'string'
    ? customData.user_id
    : typeof customData.userId === 'string'
    ? customData.userId
    : null
  const userEmail: string = data.user_email ?? ''
  const customerId = String(data.customer_id ?? '')
  const variantId = String(data.variant_id ?? data.first_order_item?.variant_id ?? '')

  console.log(`[LS WEBHOOK] event:${eventName} userId:${userId} email:${userEmail} variantId:${variantId}`)
  console.log(`[LS WEBHOOK] PRO_VARIANT=${process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID} DEALER_VARIANT=${process.env.NEXT_PUBLIC_LEMONSQUEEZY_DEALER_VARIANT_ID}`)

  const subscriptionEvents = [
    'subscription_created',
    'subscription_updated',
    'subscription_resumed',
    'subscription_cancelled',
    'subscription_expired',
    'subscription_paused',
    'subscription_unpaused',
  ]

  if (subscriptionEvents.includes(eventName)) {
    const subscriptionId = String(event.data?.id ?? '')
    const status: string = data.status ?? ''

    await upsertUserPlan({ userId, userEmail, customerId, subscriptionId, status, variantId })
  }

  // order_created fires immediately on payment — use as fast-path to set plan
  // before the subscription webhook arrives
  if (eventName === 'order_created') {
    const status = data.status === 'paid' ? 'active' : ''
    const subscriptionId = String(data.subscription_id ?? event.data?.id ?? '')
    const orderVariantId = String(
      data.first_order_item?.variant_id ?? data.variant_id ?? variantId
    )
    const orderEmail: string = data.user_email ?? userEmail
    const plan = mapVariantToPlan(orderVariantId)

    if (plan !== 'free') {
      console.log(`[LS WEBHOOK] order_created fast-path — plan:${plan} email:${orderEmail}`)
      await upsertUserPlan({
        userId,
        userEmail: orderEmail,
        customerId,
        subscriptionId,
        status,
        variantId: orderVariantId,
      })
    }
  }

  return Response.json({ ok: true })
}
