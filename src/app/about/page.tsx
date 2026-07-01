import type { Metadata } from 'next'
import { BlogNav, BlogFooter } from '@/app/_blog/components'

export const metadata: Metadata = {
  title: 'About | CarDealAlerts',
  description:
    'Meet the team behind CarDealAlerts — an independent tool built by Salah to help car flippers and used-car buyers find underpriced vehicles faster.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BlogNav />

      <main className="mx-auto max-w-3xl px-6 py-16 pb-24">
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          About CarDealAlerts
        </h1>

        <p className="mt-6 leading-7 text-zinc-400">
          CarDealAlerts is an independent tool built to help car flippers and used-car
          buyers monitor multiple marketplaces at once and get AI-scored alerts on
          underpriced vehicles — so you spend less time refreshing tabs and more time
          on deals worth pursuing.
        </p>

        <div className="mt-10 border-t border-white/10 pt-8">
          <h2 className="text-lg font-semibold text-white">Author</h2>
          <p className="mt-3 leading-7 text-zinc-400">
            Written by Salah, founder of CarDealAlerts. Used car sourcing tool builder,
            focused on helping flippers and independent dealers find inventory faster.
          </p>
        </div>
      </main>

      <BlogFooter />
    </div>
  )
}
