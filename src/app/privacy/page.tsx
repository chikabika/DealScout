import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for CarDealAlerts.',
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

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>

        <div className="mt-10 space-y-8 text-zinc-300">

          <section>
            <h2 className="text-lg font-semibold text-white">1. Overview</h2>
            <p className="mt-3 leading-7">
              CarDealAlerts ("we", "us", "our") respects your privacy. This Privacy Policy explains
              what information we collect, how we use it, and your rights regarding that information
              when you use CarDealAlerts.
            </p>
            <p className="mt-3 leading-7">
              CarDealAlerts is not affiliated with Facebook, Craigslist, Cars.com, OfferUp,
              AutoTrader, or any vehicle marketplace. We are an independent monitoring tool.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>

            <h3 className="mt-4 font-medium text-zinc-200">a. Account information</h3>
            <p className="mt-2 leading-7">
              When you register, we collect your name, email address, and a hashed password.
              If you sign in with a third-party provider (e.g. Google), we receive basic profile
              information from that provider.
            </p>

            <h3 className="mt-4 font-medium text-zinc-200">b. Saved searches and alert preferences</h3>
            <p className="mt-2 leading-7">
              We store the search filters you configure: vehicle make, model, year range, price
              range, mileage limit, keywords, blacklist terms, and marketplace selections.
              We may process approximate location information you provide, such as city, state,
              ZIP code, or search radius, only to deliver relevant vehicle alerts.
            </p>

            <h3 className="mt-4 font-medium text-zinc-200">c. Usage data</h3>
            <p className="mt-2 leading-7">
              We collect standard server logs including IP address, browser type, pages visited,
              and timestamps. This data is used for security, debugging, and improving the Service.
            </p>

            <h3 className="mt-4 font-medium text-zinc-200">d. Payment information</h3>
            <p className="mt-2 leading-7">
              Payments are processed by Lemon Squeezy. We do not store your full payment card
              details. We may receive billing metadata (e.g. subscription status, plan type,
              customer ID) from the payment processor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. How We Use Your Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              <li>To create and manage your account.</li>
              <li>To run saved searches and deliver vehicle deal alerts by email.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To send transactional emails (alerts, account notifications).</li>
              <li>To improve and debug the Service.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3 leading-7">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Location and Search Data</h2>
            <p className="mt-3 leading-7">
              CarDealAlerts uses location information (city, state, ZIP code, or search radius)
              that you provide when setting up saved searches. This data is stored and used
              exclusively to filter and deliver vehicle listings relevant to your specified area.
              We do not collect your precise device location via GPS or similar means.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Cookies and Tracking</h2>
            <p className="mt-3 leading-7">
              We use essential cookies to maintain your session and authentication state.
              We do not currently use advertising cookies or cross-site tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Third-Party Services</h2>
            <p className="mt-3 leading-7">
              We use the following third-party services to operate the platform:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              <li><strong className="text-zinc-200">Lemon Squeezy</strong> — payment processing and subscription management.</li>
              <li><strong className="text-zinc-200">Resend</strong> or similar — transactional email delivery.</li>
              <li><strong className="text-zinc-200">AWS Bedrock / Anthropic Claude</strong> — AI-based deal scoring (listing data only, no personal information).</li>
              <li><strong className="text-zinc-200">Neon / PostgreSQL</strong> — secure database hosting.</li>
              <li><strong className="text-zinc-200">Vercel</strong> — application hosting and edge network.</li>
            </ul>
            <p className="mt-3 leading-7">
              Each of these services has its own privacy policy. We only share data with them
              to the extent necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Data Retention</h2>
            <p className="mt-3 leading-7">
              We retain your account data as long as your account is active. If you delete your
              account, we will remove your personal data within a reasonable period, except where
              retention is required by law (e.g. billing records).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Your Rights</h2>
            <p className="mt-3 leading-7">
              Depending on your jurisdiction, you may have rights to access, correct, or delete
              your personal data; to opt out of certain processing; and to data portability.
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline">
                support@cardealalerts.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Children&apos;s Privacy</h2>
            <p className="mt-3 leading-7">
              The Service is not directed at children under 18 years of age. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Changes to This Policy</h2>
            <p className="mt-3 leading-7">
              We may update this Privacy Policy periodically. We will notify you of material
              changes by email or by posting a notice on the Service.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">11. Operator / Contact</h2>
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
