import 'server-only'

import { EventName } from '@paddle/paddle-node-sdk'
import { eq, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { getPaddle, mapSubscriptionStatusToPlan } from '@/lib/paddle'
import { users } from '@/lib/schema'

export const runtime = 'nodejs'

type PaddleCustomData = {
  userId?: unknown
  planId?: unknown
}

function getCustomUserId(customData: PaddleCustomData | null | undefined) {
  return typeof customData?.userId === 'string' ? customData.userId : null
}

function getFirstPriceId(data: { items?: Array<{ price: { id: string } | null }> }) {
  return data.items?.[0]?.price?.id ?? null
}

async function updateUserSubscription({
  userId,
  customerId,
  subscriptionId,
  status,
  priceId,
}: {
  userId: string | null
  customerId: string
  subscriptionId: string
  status: string
  priceId: string | null
}) {
  const plan = mapSubscriptionStatusToPlan(status, priceId)
  const where = userId
    ? eq(users.id, userId)
    : or(eq(users.paddleSubscriptionId, subscriptionId), eq(users.paddleCustomerId, customerId))

  if (!where) return

  await getDb()
    .update(users)
    .set({
      plan,
      paddleCustomerId: customerId,
      paddleSubscriptionId: subscriptionId,
      paddleSubscriptionStatus: status,
      paddlePriceId: priceId,
    })
    .where(where)
}

async function syncSubscription(data: {
  id: string
  status: string
  customerId: string
  customData: PaddleCustomData | null
  items?: Array<{ price: { id: string } | null }>
}) {
  const userId = getCustomUserId(data.customData)
  const priceId = getFirstPriceId(data)

  await updateUserSubscription({
    userId,
    customerId: data.customerId,
    subscriptionId: data.id,
    status: data.status,
    priceId,
  })
}

async function syncTransaction(data: {
  customerId: string | null
  subscriptionId: string | null
  customData: PaddleCustomData | null
  items?: Array<{ price: { id: string } | null }>
}) {
  const userId = getCustomUserId(data.customData)
  if (!data.customerId || !data.subscriptionId) return

  const priceId = getFirstPriceId(data)

  await updateUserSubscription({
    userId,
    customerId: data.customerId,
    subscriptionId: data.subscriptionId,
    status: 'active',
    priceId,
  })
}

export async function POST(req: Request) {
  const signature = req.headers.get('paddle-signature') ?? ''
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return Response.json({ error: 'PADDLE_WEBHOOK_SECRET is not set' }, { status: 500 })
  }

  const rawBody = await req.text()

  try {
    const event = await getPaddle().webhooks.unmarshal(rawBody, webhookSecret, signature)

    switch (event.eventType) {
      case EventName.TransactionCompleted:
      case EventName.TransactionPaid:
        await syncTransaction(event.data)
        break
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionTrialing:
      case EventName.SubscriptionResumed:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionCanceled:
        await syncSubscription(event.data)
        break
      default:
        break
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[PADDLE] Webhook failed:', e instanceof Error ? e.message : e)
    return Response.json({ error: 'invalid webhook' }, { status: 400 })
  }
}
