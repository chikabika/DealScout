import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Refund and cancellation policy for CarDealAlerts paid subscriptions.',
  alternates: { canonical: '/refunds' },
}

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-9 w-auto" />
          </Link>
          <Link href="/register" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
            Start free
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Refund &amp; Cancellation Policy</h1>
          <p className="mt-3 text-sm text-zinc-500">Last updated: June 4, 2026</p>
        </div>

        <div className="space-y-10 text-zinc-300">

          <p className="text-base leading-7">
            This Refund &amp; Cancellation Policy applies to paid subscriptions for CarDealAlerts.
          </p>

          <Section title="1. Subscription Billing">
            <p>
              CarDealAlerts offers paid subscription plans that renew automatically based on the billing cycle selected at checkout.
            </p>
            <p>By purchasing a paid plan, you authorize recurring billing until you cancel.</p>
          </Section>

          <Section title="2. Cancellation">
            <p>
              You may cancel your subscription at any time through your account, billing portal, or by contacting{' '}
              <a href="mailto:support@cardealalerts.com">support@cardealalerts.com</a>.
            </p>
            <p>
              After cancellation, your paid features will remain active until the end of your current billing period. Your subscription will not renew after that period.
            </p>
          </Section>

          <Section title="3. Refunds">
            <p>
              Because CarDealAlerts is a digital subscription service, subscription payments are generally non-refundable once the billing period has started.
            </p>
            <p>We may approve refunds in limited cases, including:</p>
            <ul>
              <li>Duplicate charges</li>
              <li>Accidental billing after cancellation</li>
              <li>Technical billing errors</li>
              <li>Major service outage that prevents normal use</li>
              <li>Cases required by applicable law</li>
            </ul>
            <p>Refund requests must be submitted within 14 days of the charge.</p>
            <p>
              To request a refund, email{' '}
              <a href="mailto:support@cardealalerts.com">support@cardealalerts.com</a> with:
            </p>
            <ul>
              <li>Your account email</li>
              <li>Order number</li>
              <li>Charge date</li>
              <li>Reason for the refund request</li>
            </ul>
          </Section>

          <Section title="4. Lemon Squeezy">
            <p>
              Payments are processed by Lemon Squeezy. Lemon Squeezy may also review or issue refunds according to its own risk, chargeback, and payment policies.
            </p>
          </Section>

          <Section title="5. No Guaranteed Results">
            <p>
              CarDealAlerts helps users discover potential vehicle deals faster, but we do not guarantee savings, successful purchases, vehicle availability, seller legitimacy, or listing accuracy.
            </p>
            <p>
              Refunds are not provided only because a user did not purchase a vehicle, did not find a deal, or disagreed with an estimated deal score.
            </p>
          </Section>

          <Section title="6. Contact">
            <p>For cancellation or refund questions:</p>
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
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-zinc-950 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} CarDealAlerts. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-400">Terms</Link>
            <Link href="/refunds" className="hover:text-zinc-400">Refunds</Link>
            <Link href="/contact" className="hover:text-zinc-400">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-white/8 pt-8">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-4 text-sm leading-7 text-zinc-400 [&_a]:text-emerald-400 [&_a:hover]:underline [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  )
}
