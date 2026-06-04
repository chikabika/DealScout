import Link from 'next/link'

export function LegalNav() {
  return (
    <header className="border-b border-white/10 px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/">
          <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-9 w-auto" />
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Start free
        </Link>
      </div>
    </header>
  )
}

export function LegalFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Logo + disclaimer */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-3">
            <Link href="/">
              <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-8 w-auto" />
            </Link>
            <p className="text-xs leading-5 text-zinc-500">
              CarDealAlerts is not affiliated with Facebook, Craigslist, Cars.com, OfferUp,
              AutoTrader, or any vehicle marketplace. All trademarks belong to their respective owners.
            </p>
            <p className="text-xs text-zinc-500">
              Questions?{' '}
              <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
                support@cardealalerts.com
              </a>
            </p>
          </div>
          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </nav>
        </div>
        {/* Copyright */}
        <div className="border-t border-white/8 pt-5 text-xs text-zinc-600">
          © {new Date().getFullYear()} CarDealAlerts. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-white/8 pt-8">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-4 text-sm leading-7 text-zinc-400 [&_a]:text-emerald-400 [&_a:hover]:underline [&_p]:leading-7 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  )
}

export function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export function ContactCard() {
  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-zinc-900 px-5 py-4 text-sm">
      <p className="font-semibold text-white">CarDealAlerts</p>
      <p className="mt-1 text-zinc-400">
        Email:{' '}
        <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
          support@cardealalerts.com
        </a>
      </p>
      <p className="mt-1 text-zinc-400">
        Website:{' '}
        <a href="https://www.cardealalerts.com" className="text-emerald-400 hover:underline">
          https://www.cardealalerts.com
        </a>
      </p>
    </div>
  )
}
