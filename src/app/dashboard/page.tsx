import { auth } from '@/lib/auth'

const stats = [
  { label: 'Saved searches', value: '0' },
  { label: 'Listings seen', value: '0' },
  { label: 'Alerts sent', value: '0' },
]

export default async function DashboardPage() {
  const session = await auth()

  return (
    <section className="px-6 py-8 sm:px-10">
      <div className="max-w-5xl">
        <p className="text-sm font-medium text-emerald-400">
          Signed in as {session!.user!.email}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          Your saved searches and matched listings will appear here once the
          deal scanner is connected.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/10 bg-zinc-900/70 p-5"
            >
              <div className="text-sm text-zinc-400">{stat.label}</div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
