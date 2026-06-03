import 'server-only'
import crypto from 'crypto'
import { eq, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { mapStatusToPlan } from '@/lib/lemonsqueezy'

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

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[LS WEBHOOK] LEMONSQUEEZY_WEBHOOK_SECRET not set')
    return Response.json({ error: 'not configured' }, { status: 500 })
  }

  const signature = req.headers.get('x-signature') ?? ''
  const rawBody = await req.text()

  if (!verifySignature(rawBody, signature, secret)) {
    console.warn('[LS WEBHOOK] Invalid signature')
    return Response.json({ error: 'invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName: string = event.meta?.event_name ?? ''
  const data = event.data?.attributes ?? {}
  const customData = event.meta?.custom_data ?? {}

  console.log('[LS WEBHOOK] Event:', eventName)

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
    const userId = typeof customData.userId === 'string' ? customData.userId : null
    const customerId = String(data.customer_id ?? '')
    const subscriptionId = String(event.data?.id ?? '')
    const status: string = data.status ?? ''
    const variantId = String(data.variant_id ?? '')
    const plan = mapStatusToPlan(status, variantId)

    const db = getDb()
    const where = userId
      ? eq(users.id, userId)
      : or(
          eq(users.lsSubscriptionId, subscriptionId),
          eq(users.lsCustomerId, customerId),
        )

    await db.update(users).set({
      plan,
      lsCustomerId: customerId,
      lsSubscriptionId: subscriptionId,
      lsSubscriptionStatus: status,
      lsVariantId: variantId,
    }).where(where)

    console.log(`[LS WEBHOOK] Updated user — plan: ${plan}, status: ${status}`)
  }

  return Response.json({ ok: true })
}
