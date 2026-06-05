import type { Metadata } from 'next'
import { LegalNav, LegalFooter, Section, ContactCard } from '@/app/_legal/components'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for CarDealAlerts.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <LegalNav />

      <main className="mx-auto max-w-4xl px-6 py-16 pb-24">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
          <p className="mt-3 text-sm text-zinc-500">Last updated: June 4, 2026</p>
        </div>

        <div className="space-y-10 text-zinc-300">
          <div className="space-y-4 text-base leading-7">
            <p>
              Welcome to CarDealAlerts. These Terms of Service ("Terms") govern your access to and use of the CarDealAlerts website, software, alerts, subscriptions, and related services ("Service").
            </p>
            <p>
              By using CarDealAlerts, you agree to these Terms. If you do not agree, please do not use the Service.
            </p>
          </div>

          <Section title="1. About CarDealAlerts">
            <p>
              CarDealAlerts is a software service that helps users discover potential used vehicle deals by monitoring public vehicle listings and sending alerts based on user-defined search criteria, market signals, and AI-assisted deal scoring.
            </p>
            <p>
              CarDealAlerts does not sell vehicles, own vehicle inventory, broker vehicle sales, inspect vehicles, guarantee vehicle availability, or represent any seller, dealer, marketplace, or vehicle manufacturer.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 18 years old, or the age of legal majority in your country, to create an account or purchase a paid subscription.
            </p>
            <p>
              By using the Service, you confirm that the information you provide is accurate and that you have the legal authority to use the Service and purchase subscriptions.
            </p>
          </Section>

          <Section title="3. No Affiliation With Marketplaces">
            <p>
              CarDealAlerts is an independent software product.
            </p>
            <p>
              CarDealAlerts is not affiliated with, endorsed by, sponsored by, or officially connected to Facebook, Facebook Marketplace, Meta, Craigslist, Cars.com, OfferUp, AutoTrader, any vehicle marketplace, dealer, manufacturer, or seller.
            </p>
            <p>
              All marketplace names, logos, and trademarks belong to their respective owners and are used only for descriptive purposes.
            </p>
          </Section>

          <Section title="4. Vehicle Listings and Deal Alerts">
            <p>
              CarDealAlerts may provide alerts, estimated deal scores, price comparisons, listing summaries, and other information based on available data.
            </p>
            <p>You understand and agree that:</p>
            <ul>
              <li>Vehicle listings may be inaccurate, outdated, incomplete, duplicated, removed, or changed by the original seller or marketplace.</li>
              <li>Prices, mileage, condition, availability, title status, accident history, and seller information may not always be accurate.</li>
              <li>Deal scores and AI-generated insights are estimates only.</li>
              <li>A "good deal" or "underpriced" alert does not guarantee that the vehicle is safe, legitimate, available, or worth purchasing.</li>
              <li>You are responsible for verifying all vehicle information before contacting a seller or making a purchase.</li>
            </ul>
          </Section>

          <Section title="5. No Financial, Legal, Mechanical, or Purchasing Advice">
            <p>
              CarDealAlerts provides software-based information only. We do not provide financial advice, legal advice, insurance advice, mechanical inspections, title verification, fraud checks, or professional vehicle purchasing advice.
            </p>
            <p>
              Before buying a vehicle, you should independently verify the listing, inspect the vehicle, check title and history reports, confirm ownership, review documents, and consult qualified professionals when needed.
            </p>
          </Section>

          <Section title="6. User Accounts">
            <p>
              You may need to create an account to use certain features. You are responsible for keeping your login credentials secure and for all activity under your account.
            </p>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for illegal, fraudulent, abusive, or harmful purposes.</li>
              <li>Attempt to copy, resell, reverse engineer, overload, scrape, or interfere with the Service.</li>
              <li>Use the Service to spam sellers or marketplaces.</li>
              <li>Misrepresent your identity or payment information.</li>
              <li>Violate any applicable marketplace terms, laws, or regulations.</li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate these Terms or create risk for CarDealAlerts, users, marketplaces, or payment providers.
            </p>
          </Section>

          <Section title="7. Subscriptions and Billing">
            <p>
              CarDealAlerts may offer free and paid subscription plans. Paid subscriptions provide access to additional features such as more saved searches, faster alerts, AI deal scoring, or dealer-focused tools.
            </p>
            <p>
              Payments are processed securely by Lemon Squeezy, our payment provider and Merchant of Record. Lemon Squeezy may handle payment processing, tax calculation, invoices, fraud prevention, and related payment services. Lemon Squeezy describes itself as a Merchant of Record that handles payments, fraud, and sales tax for digital sales.
            </p>
            <p>
              By purchasing a subscription, you also agree to Lemon Squeezy's applicable buyer terms and checkout policies.
            </p>
          </Section>

          <Section title="8. Renewals and Cancellation">
            <p>
              Paid subscriptions renew automatically unless cancelled before the next billing date.
            </p>
            <p>
              You may cancel your subscription at any time through your account, billing portal, or by contacting us at{' '}
              <a href="mailto:support@cardealalerts.com">support@cardealalerts.com</a>.
            </p>
            <p>
              After cancellation, you will continue to have access to paid features until the end of your current billing period, unless otherwise stated.
            </p>
          </Section>

          <Section title="9. Refund Policy">
            <p>
              Refunds and cancellations are governed by our{' '}
              <a href="/refund">Refund &amp; Cancellation Policy</a>.
              Because CarDealAlerts is a digital subscription service, payments are generally
              non-refundable once a billing period has started, except where required by law
              or approved under our Refund Policy.
            </p>
          </Section>

          <Section title="10. Free Plans and Trials">
            <p>
              We may offer free plans, limited searches, trial access, or promotional credits. Free features may be limited, changed, suspended, or discontinued at any time.
            </p>
            <p>
              Abuse of free plans, fake accounts, or attempts to bypass usage limits may result in account suspension.
            </p>
          </Section>

          <Section title="11. Service Availability">
            <p>
              We try to keep CarDealAlerts reliable, but we do not guarantee uninterrupted access. The Service may be delayed, unavailable, or inaccurate due to maintenance, technical problems, marketplace changes, third-party issues, API limitations, data availability, or other causes.
            </p>
          </Section>

          <Section title="12. Third-Party Services">
            <p>
              CarDealAlerts may rely on third-party services for hosting, analytics, email delivery, payments, marketplace data, AI processing, and other infrastructure.
            </p>
            <p>We are not responsible for third-party websites, sellers, marketplaces, tools, or services.</p>
          </Section>

          <Section title="13. Intellectual Property">
            <p>
              CarDealAlerts, including its website, software, design, branding, content, workflows, and technology, is owned by us or our licensors.
            </p>
            <p>
              You may not copy, reproduce, sell, distribute, modify, or create derivative works from our Service without permission.
            </p>
          </Section>

          <Section title="14. Disclaimer of Warranties">
            <p>The Service is provided "as is" and "as available."</p>
            <p>We do not guarantee that:</p>
            <ul>
              <li>Alerts will be complete, instant, or accurate.</li>
              <li>Any vehicle is a good deal.</li>
              <li>Any listing is legitimate or available.</li>
              <li>Any user will save money or make a successful purchase.</li>
              <li>The Service will meet your expectations or be error-free.</li>
            </ul>
          </Section>

          <Section title="15. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, CarDealAlerts will not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits, lost opportunities, vehicle purchase losses, fraud losses, seller disputes, or marketplace issues.
            </p>
            <p>
              Our total liability for any claim related to the Service will not exceed the amount you paid to CarDealAlerts during the three months before the claim.
            </p>
          </Section>

          <Section title="16. Changes to the Service or Terms">
            <p>
              We may update the Service or these Terms from time to time. If we make material changes, we may notify users through the website, email, or account dashboard.
            </p>
            <p>
              Your continued use of the Service after changes means you accept the updated Terms.
            </p>
          </Section>

          <Section title="17. Contact">
            <p>For questions about these Terms, subscriptions, cancellations, or refunds, contact:</p>
            <ContactCard />
          </Section>
        </div>
      </main>

      <LegalFooter />
    </div>
  )
}
