import 'server-only'
import { auth } from '@/lib/auth'
import { buildCheckoutUrl } from '@/lib/lemonsqueezy'
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
  const variantId =
    planId === 'pro'
      ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID
      : planId === 'dealer'
      ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_DEALER_VARIANT_ID
      : null

  if (!variantId) {
    return Response.json({ error: 'invalid plan' }, { status: 400 })
  }

  const db = getDb()
  const [user] = await db.select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  try {
    const url = await buildCheckoutUrl({
      variantId,
      userId: session.user.id,
      email: user?.email ?? session.user.email ?? '',
      planId,
      successPath: '/dashboard?upgraded=1',
    })
    return Response.json({ url })
  } catch (e) {
    console.error('[CHECKOUT]', e)
    return Response.json({ error: 'failed to create checkout' }, { status: 500 })
  }
}
