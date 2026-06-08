import { redirect } from 'next/navigation'
import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { searches, users } from '@/lib/schema'
import { getPlan } from '@/lib/plans'
import { EditSearchForm } from './EditSearchForm'

export default async function EditSearchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/dashboard/searches`)
  }

  const { id } = await params
  const db = getDb()

  const [search] = await db
    .select()
    .from(searches)
    .where(and(eq(searches.id, id), eq(searches.userId, session.user.id)))
    .limit(1)

  if (!search) {
    redirect('/dashboard/searches')
  }

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const plan = getPlan(user?.plan ?? 'free')

  return (
    <div className="px-6 py-8 sm:px-10">
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard/searches" className="hover:text-zinc-300 transition-colors">
          Searches
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{search.name}</span>
        <span>/</span>
        <span className="text-zinc-300">Edit</span>
      </nav>

      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Edit search</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Update your search criteria. The marketplace can&apos;t be changed after creation.
        </p>
      </div>

      <div className="mt-8">
        <EditSearchForm
          search={{
            id: search.id,
            name: search.name,
            providers: search.providers,
            city: search.city,
            state: search.state,
            minPrice: search.minPrice,
            maxPrice: search.maxPrice,
            minYear: search.minYear,
            maxMileage: search.maxMileage,
            make: search.make,
            model: search.model,
            keywords: search.keywords,
            blacklist: search.blacklist,
            zipCode: search.zipCode,
            radiusMiles: search.radiusMiles,
            frequencyMinutes: search.frequencyMinutes,
          }}
          allowedProviders={plan.allowedProviders}
          userPlan={plan}
        />
      </div>
    </div>
  )
}
