import 'server-only'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { setupLemonSqueezy, getSubscription } from '@/lib/lemonsqueezy'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const [user] = await db.select({
    lsSubscriptionId: users.lsSubscriptionId,
  }).from(users).where(eq(users.id, session.user.id)).limit(1)

  if (!user?.lsSubscriptionId) {
    return Response.json({ error: 'no subscription found' }, { status: 404 })
  }

  setupLemonSqueezy()
  const { data, error } = await getSubscription(user.lsSubscriptionId)

  if (error || !data) {
    console.error('[LS PORTAL]', error)
    return Response.json({ error: 'failed to fetch subscription' }, { status: 500 })
  }

  const portalUrl = data.data?.attributes?.urls?.customer_portal

  if (!portalUrl) {
    return Response.json({ error: 'portal URL not found' }, { status: 500 })
  }

  return Response.json({ url: portalUrl })
}
