import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Refund and cancellation policy for CarDealAlerts.',
}

const EFFECTIVE_DATE = 'June 5, 2026'

function LegalFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-900/40 px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-wrap gap-4 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <Link href="/pricing" className="hover:text-zinc-300">Pricing</Link>
        <Link href="/terms" className="hover:text-zinc-300">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
        <Link href="/refund" className="hover:text-zinc-300">Refund Policy</Link>
        <Link href="/contact" className="hover:text-zinc-300">Contact</Link>
      </div>
      <p className="mx-auto mt-4 max-w-4xl text-xs text-zinc-600">
        © {new Date().getFullYear()} CarDealAlerts. Not affiliated with any marketplace.
      </p>
    </footer>
  )
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-white hover:text-emerald-300">
            CarDealAlerts
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200">Log in</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <h1 className="text-3xl font-bold text-white">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>

        <div className="mt-10 space-y-8 text-zinc-300">

          <section>
            <h2 className="text-lg font-semibold text-white">1. Overview</h2>
            <p className="mt-3 leading-7">
              This policy describes when and how you may request a refund or cancel your
              CarDealAlerts subscription. By subscribing to a paid plan, you agree to this
              Refund &amp; Cancellation Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Subscription Model</h2>
            <p className="mt-3 leading-7">
              CarDealAlerts is a digital subscription service billed on a monthly basis.
              Access to paid features begins immediately upon payment. Because the service
              is delivered digitally and access begins immediately, payments are generally
              non-refundable once a billing period has started.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Cancellation</h2>
            <p className="mt-3 leading-7">
              You may cancel your subscription at any time through your account&apos;s billing
              settings. Cancellation stops future charges. After cancellation:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              <li>
                Your paid plan features remain active until the end of the current billing period.
              </li>
              <li>
                Your account is then downgraded to the Free plan automatically — your saved
                searches are paused (not deleted) if they exceed the Free plan limit.
              </li>
              <li>
                No partial refund is issued for the unused portion of a billing period.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Refund Eligibility</h2>
            <p className="mt-3 leading-7">
              We offer refunds in the following situations:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              <li>
                <strong className="text-zinc-200">14-day money-back guarantee:</strong> If you
                subscribed to a paid plan for the first time and are unsatisfied, you may
                request a full refund within 14 calendar days of your initial payment. This
                applies to first-time subscriptions only, not renewals.
              </li>
              <li>
                <strong className="text-zinc-200">Service outage or billing error:</strong> If
                you were charged incorrectly or the Service experienced a significant, prolonged
                outage during your billing period, contact us and we will review your case.
              </li>
              <li>
                <strong className="text-zinc-200">Required by law:</strong> Where local consumer
                protection laws require a refund, we will comply with those requirements.
              </li>
            </ul>
            <p className="mt-3 leading-7">
              Refunds are not available for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              <li>Renewal charges after the 14-day initial period has passed.</li>
              <li>Partial months or unused days within a billing period.</li>
              <li>Accounts suspended or terminated for Terms of Service violations.</li>
              <li>Dissatisfaction with AI deal score estimates (which are informational only).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. How to Request a Refund</h2>
            <p className="mt-3 leading-7">
              To request a refund, email us at{' '}
              <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
                support@cardealalerts.com
              </a>{' '}
              with the subject line "Refund Request" and include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              <li>Your registered email address.</li>
              <li>The date of the charge you are requesting a refund for.</li>
              <li>A brief reason for the request.</li>
            </ul>
            <p className="mt-3 leading-7">
              We aim to respond within 3 business days. Approved refunds are processed through
              the original payment method and may take 5–10 business days to appear, depending
              on your payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Downgrades</h2>
            <p className="mt-3 leading-7">
              If you downgrade from a higher plan to a lower plan or to the Free tier, the
              downgrade takes effect at the end of your current billing period. No partial
              refund is issued for the price difference.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Changes to This Policy</h2>
            <p className="mt-3 leading-7">
              We may update this policy periodically. We will notify you of material changes
              by email or by posting a notice on the Service.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">8. Operator / Contact</h2>
            <p className="mt-3 leading-7">
              CarDealAlerts is operated by:
            </p>
            <div className="mt-3 space-y-1 text-sm text-zinc-400">
              <p><span className="text-zinc-300">Business owner / operator:</span> [Your legal name or company name]</p>
              <p><span className="text-zinc-300">Business address:</span> [Your business address, if available]</p>
              <p>
                <span className="text-zinc-300">Contact:</span>{' '}
                <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
                  support@cardealalerts.com
                </a>
              </p>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              CarDealAlerts is an independent tool and is not affiliated with any marketplace
              listed on this website.
            </p>
          </section>

        </div>
      </div>

      <LegalFooter />
    </div>
  )
}
