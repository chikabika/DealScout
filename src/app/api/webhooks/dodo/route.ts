import 'server-only'
import { Webhook } from 'standardwebhooks'
import { eq, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { sendSubscriptionEmail } from '@/lib/email'
import { users, processedWebhookEvents } from '@/lib/schema'
import { mapProductToPlan } from '@/lib/dodo'
import type { WebhookPayload } from 'dodopayments/resources/webhook-events'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.DODO_WEBHOOK_SECRET
  if (!secret) {
    console.error('[DODO WEBHOOK] DODO_WEBHOOK_SECRET not set')
    return Response.json({ error: 'not configured' }, { status: 500 })
  }

  const webhookId = req.headers.get('webhook-id') ?? ''
  const webhookSig = req.headers.get('webhook-signature') ?? ''
  const webhookTs = req.headers.get('webhook-timestamp') ?? ''
  const rawBody = await req.text()

  // Verify using Standard Webhooks spec
  try {
    const wh = new Webhook(secret)
    wh.verify(rawBody, {
      'webhook-id': webhookId,
      'webhook-signature': webhookSig,
      'webhook-timestamp': webhookTs,
    })
  } catch {
    console.warn('[DODO WEBHOOK] Invalid signature')
    return Response.json({ error: 'invalid signature' }, { status: 401 })
  }

  const db = getDb()

  // Idempotency: skip duplicate deliveries
  if (webhookId) {
    const inserted = await db
      .insert(processedWebhookEvents)
      .values({ id: webhookId, provider: 'dodo' })
      .onConflictDoNothing()
    if (inserted.rowCount === 0) {
      console.log(`[DODO WEBHOOK] duplicate — skipping ${webhookId}`)
      return Response.json({ ok: true })
    }
  }

  const event = JSON.parse(rawBody) as WebhookPayload
  const type = event.type

  console.log(`[DODO WEBHOOK] event:${type} id:${webhookId}`)

  try {
    if (
      type === 'subscription.active' ||
      type === 'subscription.renewed' ||
      type === 'subscription.updated' ||
      type === 'subscription.plan_changed'
    ) {
      const sub = event.data as WebhookPayload.Subscription
      await handleSubscriptionActive(sub)
    } else if (
      type === 'subscription.cancelled' ||
      type === 'subscription.expired'
    ) {
      const sub = event.data as WebhookPayload.Subscription
      await handleSubscriptionCancelledOrExpired(sub, type)
    } else if (type === 'subscription.on_hold' || type === 'subscription.failed') {
      const sub = event.data as WebhookPayload.Subscription
      await handleSubscriptionOnHold(sub)
    } else if (type === 'payment.succeeded') {
      const payment = event.data as WebhookPayload.Payment
      await handlePaymentSucceeded(payment)
    } else if (type === 'payment.failed') {
      const payment = event.data as WebhookPayload.Payment
      await handlePaymentFailed(payment)
    }
  } catch (err) {
    console.error(`[DODO WEBHOOK] processing error for ${type}:`, err)
    return Response.json({ error: 'processing failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSubscriptionActive(sub: WebhookPayload.Subscription) {
  const userId = sub.metadata?.userId ?? null
  const productId = sub.product_id
  const plan = mapProductToPlan(productId)
  const customerId = sub.customer.customer_id
  const subscriptionId = sub.subscription_id
  const periodEnd = sub.next_billing_date ? new Date(sub.next_billing_date) : null

  const where = userId
    ? eq(users.id, userId)
    : or(
        eq(users.providerSubscriptionId, subscriptionId),
        eq(users.providerCustomerId, customerId),
      )

  const db = getDb()
  await db.update(users).set({
    plan,
    paymentProvider: 'dodo',
    providerCustomerId: customerId,
    providerSubscriptionId: subscriptionId,
    providerProductId: productId,
    subscriptionStatus: 'active',
    currentPeriodEnd: periodEnd,
  }).where(where!)

  console.log(`[DODO WEBHOOK] subscription active — userId:${userId} plan:${plan}`)

  if ((plan === 'pro' || plan === 'dealer') && userId) {
    const db2 = getDb()
    const [u] = await db2.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, userId)).limit(1)
    if (u) {
      await sendSubscriptionEmail({ to: u.email, name: u.name ?? null, plan }).catch(() => {})
    }
  }
}

async function handleSubscriptionCancelledOrExpired(
  sub: WebhookPayload.Subscription,
  type: string,
) {
  const userId = sub.metadata?.userId ?? null
  const subscriptionId = sub.subscription_id
  const customerId = sub.customer.customer_id
  // Keep plan as-is; effective plan check at request time uses currentPeriodEnd
  const periodEnd = sub.next_billing_date ? new Date(sub.next_billing_date) : null

  const where = userId
    ? eq(users.id, userId)
    : or(
        eq(users.providerSubscriptionId, subscriptionId),
        eq(users.providerCustomerId, customerId),
      )

  const db = getDb()
  await db.update(users).set({
    subscriptionStatus: type === 'subscription.expired' ? 'expired' : 'cancelled',
    currentPeriodEnd: periodEnd,
  }).where(where!)

  console.log(`[DODO WEBHOOK] ${type} — userId:${userId} periodEnd:${periodEnd?.toISOString()}`)
}

async function handleSubscriptionOnHold(sub: WebhookPayload.Subscription) {
  const userId = sub.metadata?.userId ?? null
  const subscriptionId = sub.subscription_id
  const customerId = sub.customer.customer_id

  const where = userId
    ? eq(users.id, userId)
    : or(
        eq(users.providerSubscriptionId, subscriptionId),
        eq(users.providerCustomerId, customerId),
      )

  const db = getDb()
  // on_hold / failed → drop to free immediately (no grace period)
  await db.update(users).set({
    plan: 'free',
    subscriptionStatus: 'on_hold',
  }).where(where!)

  console.log(`[DODO WEBHOOK] subscription on_hold/failed — userId:${userId}`)
}

async function handlePaymentSucceeded(payment: WebhookPayload.Payment) {
  const userId = payment.metadata?.userId ?? null
  if (!userId) return

  const db = getDb()
  await db.update(users).set({
    providerPaymentId: payment.payment_id,
  }).where(eq(users.id, userId))

  console.log(`[DODO WEBHOOK] payment.succeeded — userId:${userId} paymentId:${payment.payment_id}`)
}

async function handlePaymentFailed(payment: WebhookPayload.Payment) {
  const userId = payment.metadata?.userId ?? null
  if (!userId) return

  const db = getDb()
  // payment.failed on a subscription means billing failed → treat like on_hold
  await db.update(users).set({
    plan: 'free',
    subscriptionStatus: 'on_hold',
  }).where(eq(users.id, userId))

  console.log(`[DODO WEBHOOK] payment.failed — userId:${userId}`)
}
