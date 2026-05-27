import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq, sql } from 'drizzle-orm'
import { Lock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'
import { SearchForm } from './SearchForm'

export default async function NewSearchPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/searches/new')
  }

  const db = getDb()

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const plan = getPlan(user?.plan ?? 'free')

  const [{ count: currentCount }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(searches)
    .where(eq(searches.userId, session.user.id))

  if (currentCount >= plan.maxSearches) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Lock size={28} className="text-emerald-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">You've used all your searches</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
          You're on the <span className="font-medium text-zinc-200">{plan.name}</span> plan with{' '}
          {plan.maxSearches} searches. Upgrade to create more.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500"
          >
            Upgrade to Pro
          </Link>
          <Link
            href="/dashboard/searches"
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
          >
            Back to searches
          </Link>
        </div>
      </div>
    )
  }

  return <SearchForm allowedProviders={plan.allowedProviders} userPlan={plan} />
}
