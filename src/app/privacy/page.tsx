import type { Metadata } from 'next'
import { LegalNav, LegalFooter, Section, Subsection, ContactCard } from '@/app/_legal/components'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for CarDealAlerts.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <LegalNav />

      <main className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="mt-3 text-sm text-zinc-500">Last updated: June 4, 2026</p>
        </div>

        <div className="space-y-10 text-zinc-300">
          <div className="space-y-4 text-base leading-7">
            <p>
              CarDealAlerts ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect information when you use our website, software, alerts, subscriptions, and related services ("Service").
            </p>
            <p>By using CarDealAlerts, you agree to this Privacy Policy.</p>
          </div>

          <Section title="1. Information We Collect">
            <p>We may collect the following information:</p>

            <Subsection title="Account information">
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Password or authentication details</li>
                <li>Account preferences</li>
              </ul>
            </Subsection>

            <Subsection title="Subscription and billing information">
              <ul>
                <li>Plan type</li>
                <li>Subscription status</li>
                <li>Billing email</li>
                <li>Order ID</li>
                <li>Payment status</li>
                <li>Billing portal links</li>
              </ul>
              <p>
                Payments are processed by Dodo Payments. We do not store full credit card numbers or complete payment card details on our servers.
              </p>
            </Subsection>

            <Subsection title="Search and alert information">
              <ul>
                <li>Saved vehicle searches</li>
                <li>Preferred make, model, year, price range, mileage, location, and other filters</li>
                <li>Alert preferences</li>
                <li>Deal alerts sent to you</li>
                <li>User interactions with alerts</li>
              </ul>
              <p>
                We may process approximate location information you provide, such as city, state,
                ZIP code, or search radius, only to deliver relevant vehicle alerts.
              </p>
            </Subsection>

            <Subsection title="Technical information">
              <ul>
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device type</li>
                <li>Operating system</li>
                <li>Pages visited</li>
                <li>Referring URLs</li>
                <li>Cookies and similar technologies</li>
                <li>Log data and error reports</li>
              </ul>
            </Subsection>

            <Subsection title="Communication information">
              <ul>
                <li>Support requests</li>
                <li>Feedback</li>
                <li>Emails or messages you send to us</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul>
              <li>Provide and operate CarDealAlerts.</li>
              <li>Create and manage your account.</li>
              <li>Save your vehicle searches.</li>
              <li>Send deal alerts and product notifications.</li>
              <li>Process subscriptions and manage billing.</li>
              <li>Provide customer support.</li>
              <li>Improve search quality, alert accuracy, and AI-assisted deal scoring.</li>
              <li>Detect fraud, abuse, technical issues, and security risks.</li>
              <li>Analyze website and product performance.</li>
              <li>Comply with legal, tax, payment, and security obligations.</li>
            </ul>
          </Section>

          <Section title="3. Payment Processing">
            <p>
              Payments are handled by Dodo Payments, which acts as a payment provider and Merchant of Record for digital products and SaaS subscriptions. Dodo Payments may process personal and payment information to complete purchases, manage subscriptions, calculate and collect taxes, issue invoices, prevent fraud, handle refunds, and manage payment disputes.
            </p>
            <p>
              Your use of Dodo Payments checkout may also be governed by Dodo Payments' own buyer terms, payment terms, and privacy policy.
            </p>
          </Section>

          <Section title="4. Cookies and Tracking">
            <p>We may use cookies and similar technologies to:</p>
            <ul>
              <li>Keep you logged in.</li>
              <li>Remember preferences.</li>
              <li>Measure website traffic.</li>
              <li>Understand product usage.</li>
              <li>Improve performance.</li>
              <li>Support security and fraud prevention.</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Some parts of the Service may not work correctly if cookies are disabled.
            </p>
          </Section>

          <Section title="5. AI and Automated Processing">
            <p>
              CarDealAlerts may use AI-assisted systems to analyze vehicle listings, compare pricing signals, summarize listings, and generate deal scores.
            </p>
            <p>
              AI-generated outputs are estimates only and may be inaccurate or incomplete. We do not use AI outputs as a substitute for professional vehicle inspections, legal checks, financial advice, or seller verification.
            </p>
          </Section>

          <Section title="6. How We Share Information">
            <p>
              We may share limited information with trusted service providers that help us operate the Service, including:
            </p>
            <ul>
              <li>Payment processors</li>
              <li>Hosting providers</li>
              <li>Email delivery providers</li>
              <li>Analytics providers</li>
              <li>Customer support tools</li>
              <li>Security and fraud prevention tools</li>
              <li>AI infrastructure providers</li>
            </ul>
            <p>We do not sell your personal information.</p>
            <p>
              We may also disclose information if required by law, legal process, fraud prevention, payment disputes, enforcement of our Terms, or protection of our rights, users, and Service.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We keep personal information only as long as reasonably necessary to provide the Service, manage accounts, comply with legal obligations, resolve disputes, enforce agreements, prevent fraud, and maintain business records.
            </p>
            <p>
              If you delete your account, we may still retain limited records where required for billing, legal, fraud prevention, or compliance purposes.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We use reasonable technical and organizational measures to protect your information. However, no online service is completely secure, and we cannot guarantee absolute security.
            </p>
            <p>You are responsible for keeping your account password safe.</p>
          </Section>

          <Section title="9. Your Rights">
            <p>Depending on your location, you may have rights to:</p>
            <ul>
              <li>Access the personal information we hold about you.</li>
              <li>Correct inaccurate information.</li>
              <li>Request deletion of your information.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Request a copy of your data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p>
              To make a privacy request, contact us at{' '}
              <a href="mailto:support@cardealalerts.com">support@cardealalerts.com</a>.
            </p>
          </Section>

          <Section title="10. Email Communications">
            <p>
              We may send you service emails, billing emails, security emails, and deal alerts based on your saved searches.
            </p>
            <p>
              You can unsubscribe from marketing emails at any time. Some transactional emails, such as billing, security, and account-related messages, may still be sent.
            </p>
          </Section>

          <Section title="11. Children's Privacy">
            <p>
              CarDealAlerts is not intended for children under 18. We do not knowingly collect personal information from children under 18.
            </p>
          </Section>

          <Section title="12. International Users">
            <p>
              Your information may be processed in countries different from where you live. By using the Service, you understand that your information may be transferred and processed internationally where our service providers operate.
            </p>
          </Section>

          <Section title="13. Third-Party Links and Marketplaces">
            <p>
              CarDealAlerts may link to third-party vehicle listings, seller pages, marketplaces, or websites. We are not responsible for the privacy practices, content, accuracy, or actions of those third parties.
            </p>
          </Section>

          <Section title="14. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we may notify users through the website, email, or account dashboard.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>For privacy questions or requests, contact:</p>
            <ContactCard />
          </Section>
        </div>
      </main>

      <LegalFooter />
    </div>
  )
}
