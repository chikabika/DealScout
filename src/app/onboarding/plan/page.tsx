import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { PlanSelector } from './PlanSelector'

export default async function OnboardingPlanPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const db = getDb()
  const [user] = await db
    .select({ plan: users.plan, name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (user?.plan && user.plan !== 'free') {
    redirect('/dashboard')
  }

  return (
    <PlanSelector
      userName={user?.name ?? null}
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
    />
  )
}
