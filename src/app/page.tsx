import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen bg-zinc-950 text-zinc-100 lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-white/10 bg-black px-6 py-8 lg:border-b-0 lg:border-r">
        <div className="text-xl font-semibold tracking-tight">DealScout</div>
        <nav className="mt-10 grid gap-2 text-sm text-zinc-400">
          <span className="rounded-md bg-white/10 px-3 py-2 text-zinc-100">
            Overview
          </span>
          <span className="px-3 py-2">Searches</span>
          <span className="px-3 py-2">Listings</span>
          <span className="px-3 py-2">Alerts</span>
        </nav>
      </aside>
      <section className="flex items-center px-6 py-12 sm:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            Deal tracking foundation
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Track vehicle searches, listings, and alerts from one calm cockpit.
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Authentication, Neon Postgres, Drizzle schema, and protected
            dashboard routing are ready for the next layer of DealScout.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 px-5 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
