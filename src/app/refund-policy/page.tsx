import type { Metadata } from 'next'
import { LegalNav, LegalFooter, Section, ContactCard } from '@/app/_legal/components'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and cancellation policy for CarDealAlerts paid subscriptions.',
  alternates: { canonical: '/refund-policy' },
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <LegalNav />

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

          <Section title="4. Dodo Payments">
            <p>
              Payments are processed by Dodo Payments. Dodo Payments acts as Merchant of Record and may handle payment processing, taxes, invoices, refunds, disputes, fraud prevention, and billing-related support. Refunds may also be reviewed or processed according to Dodo Payments' own payment, risk, dispute, and chargeback policies.
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
            <ContactCard />
          </Section>
        </div>
      </main>

      <LegalFooter />
    </div>
  )
}
