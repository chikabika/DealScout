import 'server-only'

import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { getPaddle } from '@/lib/paddle'
import { users } from '@/lib/schema'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [user] = await getDb()
    .select({
      paddleCustomerId: users.paddleCustomerId,
      paddleSubscriptionId: users.paddleSubscriptionId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.paddleCustomerId || !user.paddleSubscriptionId) {
    return Response.json({ error: 'No Paddle subscription found' }, { status: 404 })
  }

  const portalSession = await getPaddle().customerPortalSessions.create(
    user.paddleCustomerId,
    [user.paddleSubscriptionId],
  )

  return Response.json({ url: portalSession.urls.general.overview })
}
