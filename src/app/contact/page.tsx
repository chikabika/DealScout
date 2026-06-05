import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact CarDealAlerts support.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-white hover:text-emerald-300">
            CarDealAlerts
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200">Log in</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10">
            <Mail className="text-emerald-300" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Contact Us</h1>
            <p className="text-sm text-zinc-400">We typically respond within 1–2 business days.</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 space-y-5 text-zinc-300">
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            <a href="mailto:support@cardealalerts.com" className="mt-1 text-emerald-400 hover:underline">
              support@cardealalerts.com
            </a>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Operator</p>
            <p className="mt-1 font-medium text-white">CarDealAlerts</p>
            <a href="https://www.cardealalerts.com" className="mt-0.5 block text-sm text-emerald-400 hover:underline">
              https://www.cardealalerts.com
            </a>
          </div>
          <div className="border-t border-white/10 pt-4 text-xs text-zinc-600">
            CarDealAlerts is an independent tool and is not affiliated with Facebook, Craigslist,
            Cars.com, OfferUp, AutoTrader, or any vehicle marketplace.
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-500">
          <Link href="/terms" className="hover:text-zinc-300">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
          <Link href="/refund" className="hover:text-zinc-300">Refund Policy</Link>
        </div>
      </div>
    </div>
  )
}
