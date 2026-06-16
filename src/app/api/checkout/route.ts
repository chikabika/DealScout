import 'server-only'
import { auth } from '@/lib/auth'
import { buildCheckoutUrl } from '@/lib/dodo'
import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { planId } = await req.json() as { planId: string }
  const productId =
    planId === 'pro'
      ? process.env.DODO_PRO_PRODUCT_ID
      : planId === 'dealer'
      ? process.env.DODO_DEALER_PRODUCT_ID
      : null

  if (!productId) {
    return Response.json({ error: 'invalid plan' }, { status: 400 })
  }

  const db = getDb()
  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const base = process.env.NEXTAUTH_URL ?? ''

  try {
    const url = await buildCheckoutUrl({
      productId,
      userId: session.user.id,
      email: user?.email ?? session.user.email ?? '',
      name: user?.name ?? null,
      planId,
      successUrl: `${base}/dashboard?upgraded=1`,
      cancelUrl: `${base}/dashboard/billing`,
    })
    return Response.json({ url })
  } catch (e) {
    console.error('[CHECKOUT]', e)
    return Response.json({ error: 'failed to create checkout' }, { status: 500 })
  }
}
