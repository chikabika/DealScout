import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for CarDealAlerts.',
}

const EFFECTIVE_DATE = 'June 5, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-white hover:text-emerald-300">
            CarDealAlerts
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200">
            Log in
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose-legal mt-10 space-y-8 text-zinc-300">

          <section>
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-3 leading-7">
              By accessing or using CarDealAlerts ("the Service", "we", "us", "our"), you agree to
              be bound by these Terms of Service and all applicable laws. If you do not agree,
              do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
            <p className="mt-3 leading-7">
              CarDealAlerts is an independent, automated monitoring tool that scans publicly
              accessible vehicle listings on third-party marketplaces (such as Facebook Marketplace,
              Craigslist, and Cars.com), applies AI-based deal scoring, and sends email alerts to
              subscribers based on their saved search preferences.
            </p>
            <p className="mt-3 leading-7">
              <strong className="text-zinc-200">CarDealAlerts is not affiliated with, endorsed by,
              or officially partnered with Facebook, Craigslist, Cars.com, OfferUp, AutoTrader,
              or any vehicle marketplace.</strong> Marketplace names and logos are referenced solely
              as source identifiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Accounts and Eligibility</h2>
            <p className="mt-3 leading-7">
              You must be at least 18 years old to use the Service. You are responsible for
              maintaining the confidentiality of your account credentials and for all activity
              that occurs under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Subscription Plans and Billing</h2>
            <p className="mt-3 leading-7">
              CarDealAlerts offers a free tier and paid subscription plans (Pro and Dealer).
              Paid plans are billed on a monthly basis. By subscribing to a paid plan, you
              authorize us to charge your payment method on a recurring basis until you cancel.
            </p>
            <p className="mt-3 leading-7">
              Plan features, including the number of saved searches, polling frequency, and
              supported marketplaces, are described on the{' '}
              <Link href="/pricing" className="text-emerald-400 hover:underline">Pricing page</Link>.
              We reserve the right to change plan pricing or features with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Refunds and Cancellations</h2>
            <p className="mt-3 leading-7">
              Refunds and cancellations are governed by our{' '}
              <Link href="/refund" className="text-emerald-400 hover:underline">Refund &amp; Cancellation Policy</Link>.
              Because CarDealAlerts is a digital subscription service, payments are generally
              non-refundable once a billing period has started, except where required by law
              or approved under our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. AI Estimates and Accuracy Disclaimer</h2>
            <p className="mt-3 leading-7">
              AI deal scores and estimated market values provided by the Service are
              <strong className="text-zinc-200"> informational only</strong>. They are not
              appraisals, vehicle inspections, or guarantees of any kind. CarDealAlerts does
              not guarantee the accuracy, completeness, or availability of any listing data,
              price estimate, or deal score.
            </p>
            <p className="mt-3 leading-7">
              Always verify vehicle history, title status, mechanical condition, and seller
              legitimacy before making any purchase decision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Acceptable Use</h2>
            <p className="mt-3 leading-7">
              You agree not to use the Service to scrape, resell, or redistribute listing data;
              to violate any applicable laws; to interfere with the Service's infrastructure;
              or to circumvent any access controls or subscription limits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Intellectual Property</h2>
            <p className="mt-3 leading-7">
              The Service, including its design, software, and content, is owned by or licensed
              to CarDealAlerts. You may not copy, reproduce, or distribute any part of the
              Service without our written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Limitation of Liability</h2>
            <p className="mt-3 leading-7">
              To the fullest extent permitted by law, CarDealAlerts and its operators shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of the Service or any listing data accessed through it.
              Our total liability for any claim related to the Service shall not exceed the
              amount you paid us in the three months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Termination</h2>
            <p className="mt-3 leading-7">
              We may suspend or terminate your access to the Service at any time for violation
              of these Terms or for any other reason with reasonable notice. You may cancel your
              subscription at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Changes to Terms</h2>
            <p className="mt-3 leading-7">
              We may update these Terms from time to time. We will notify you of material
              changes by email or by posting a notice on the Service. Continued use of the
              Service after changes take effect constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Governing Law</h2>
            <p className="mt-3 leading-7">
              These Terms are governed by applicable law. Any disputes shall be resolved in the
              jurisdiction where the operator is located.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">13. Operator / Contact</h2>
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

      {/* Footer */}
      <LegalFooter />
    </div>
  )
}

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
