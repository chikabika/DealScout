import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Gauge,
  Mail,
  MapPin,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "DealScout | AI Car Deal Alerts for Facebook Marketplace and Craigslist",
  description:
    "DealScout monitors local vehicle listings, filters out junk, scores deals with AI, and sends fast alerts when underpriced cars appear.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    icon: Search,
    title: "Saved car searches",
    body: "Track city, price, year, mileage, make, model, keywords, and blacklist terms in one place.",
  },
  {
    icon: Radar,
    title: "Marketplace monitoring",
    body: "Scan Facebook Marketplace and Craigslist on a schedule so buyers do not have to keep refreshing tabs.",
  },
  {
    icon: Sparkles,
    title: "AI deal scoring",
    body: "Estimate market value, savings, condition, and red flags before spending time on a listing.",
  },
  {
    icon: Bell,
    title: "Email alerts",
    body: "Send instant alerts for paid plans and daily digests for free users when fresh matches appear.",
  },
];

const steps = [
  "Create a saved search for your target vehicle and location.",
  "DealScout scans supported marketplaces on your plan's schedule.",
  "New listings are filtered, enriched, scored, and saved to your dashboard.",
  "You get alerted before the best deals disappear.",
];

const liveProviders = [
  {
    name: "Facebook Marketplace",
    id: "facebook",
    logo: "📘",
    logoUrl: "/providers/facebook.svg",
    brandColor: "#1877F2",
    plans: "Free, Pro, Dealer",
    filters: "City, price, year, mileage, make, model, keywords",
  },
  {
    name: "Craigslist",
    id: "craigslist",
    logo: "🪧",
    logoUrl: "/providers/craigslist.svg",
    brandColor: "#5C218A",
    plans: "Pro, Dealer only",
    filters: "City, state, price, year, mileage, make, model, keywords",
  },
  {
    name: "Cars.com",
    id: "carsdotcom",
    logo: "🏷️",
    logoUrl: "/providers/carsdotcom.svg",
    brandColor: "#D7372C",
    plans: "Dealer only",
    filters: "State, price, year, make, model",
  },
];

const plannedProviders = [
  {
    name: "OfferUp",
    id: "offerup",
    logo: "🛒",
    logoUrl: "/providers/offerup.svg",
    brandColor: "#00B47C",
    filters: "City, state, price, keywords",
  },
  {
    name: "AutoTrader",
    id: "autotrader",
    logo: "🚗",
    logoUrl: "/providers/autotrader.svg",
    brandColor: "#FF6900",
    filters: "State, price, year, make, model",
  },
];

const providerPlanBreakdown = [
  ["Free", "Facebook Marketplace only"],
  ["Pro", "$49/mo", "Facebook Marketplace + Craigslist"],
  ["Dealer", "$149/mo", "Facebook Marketplace + Craigslist + Cars.com"],
];

const audience = [
  "Used car buyers watching a specific budget",
  "Dealers sourcing local inventory faster",
  "Flippers comparing asking price to market value",
  "Busy shoppers who want fewer tabs and better timing",
];

const faqs = [
  {
    q: "What marketplaces does DealScout support?",
    a: "Facebook Marketplace is available on all plans. Craigslist is available on Pro and Dealer plans. Cars.com dealer inventory is available on the Dealer plan.",
  },
  {
    q: "How does AI deal scoring work?",
    a: "DealScout analyzes listing photos and details to estimate fair market value, possible savings, condition, and red flags.",
  },
  {
    q: "Can I start for free?",
    a: "Yes. The free plan includes 3 saved searches, Facebook Marketplace monitoring, and a daily email digest.",
  },
  {
    q: "Who is the Dealer plan for?",
    a: "The Dealer plan is built for high-volume buyers who need more searches, faster polling, and higher monthly limits.",
  },
];

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DealScout",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered vehicle deal tracking for Facebook Marketplace and Craigslist.",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "49",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Dealer",
        price: "149",
        priceCurrency: "USD",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="DealScout home">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
        <Gauge size={19} strokeWidth={2.5} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        DealScout
      </span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className="relative rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-emerald-950/30">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
            Live dashboard
          </p>
          <p className="mt-1 text-sm text-zinc-400">Top matches this week</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
          12 new
        </span>
      </div>

      <div className="grid gap-3">
        {[
          ["2018 Toyota Tacoma SR5", "$18,900", "Score 91", "$4,200 under"],
          ["2017 Honda Civic EX", "$9,750", "Score 86", "$2,100 under"],
          ["2020 Ford Transit Van", "$22,500", "Score 78", "$3,650 under"],
        ].map(([title, price, score, savings]) => (
          <div
            key={title}
            className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3"
          >
            <div className="h-12 rounded-md bg-gradient-to-br from-zinc-700 via-zinc-800 to-emerald-900" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{title}</p>
              <p className="mt-1 text-xs text-zinc-500">Facebook Marketplace</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{price}</p>
              <p className="mt-1 text-xs text-emerald-300">{score}</p>
            </div>
            <div className="col-span-3 flex items-center justify-between rounded-md bg-zinc-900 px-3 py-2 text-xs">
              <span className="text-zinc-400">AI estimate</span>
              <span className="font-medium text-emerald-300">{savings}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderLogo({
  name,
  logo,
  logoUrl,
  brandColor,
}: {
  name: string;
  logo?: string;
  logoUrl?: string;
  brandColor: string;
}) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
      style={{ backgroundColor: brandColor }}
      aria-hidden="true"
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={28}
          height={28}
          className="h-7 w-7 rounded-md object-contain"
          loading="lazy"
        />
      ) : (
        <span className="text-xl">{logo ?? name[0]}</span>
      )}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#marketplaces" className="hover:text-white">
              Marketplaces
            </a>
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-300 hover:text-white sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
            <Clock size={15} />
            Find local car deals before they vanish
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            AI car deal alerts for serious local buyers.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            DealScout watches Facebook Marketplace and Craigslist, filters noisy
            listings, scores real opportunities, and emails you when a promising
            vehicle appears.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              Create free account
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View plans
            </Link>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
            {["Free plan available", "Fast email alerts", "Built for used cars"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check size={16} className="text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className="border-y border-white/10 bg-zinc-900/45">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-6">
          {[
            ["15 min", "fastest Dealer polling"],
            ["50", "saved searches on Dealer"],
            ["AI", "market value and red flag analysis"],
          ].map(([stat, label]) => (
            <div key={label} className="py-2">
              <p className="text-3xl font-semibold text-white">{stat}</p>
              <p className="mt-1 text-sm text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A cleaner way to hunt used car deals.
          </h2>
          <p className="mt-4 text-zinc-400">
            The product is designed around timing, filtering, and confidence, so
            you can act quickly without chasing every low-quality post.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
              <Icon className="text-emerald-300" size={24} />
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="marketplaces" className="border-y border-white/10 bg-zinc-900/45 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Supported marketplaces
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Start with the marketplaces buyers actually refresh.
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                DealScout currently monitors Facebook Marketplace for every
                user, with Craigslist available on paid plans. More vehicle
                sources are planned as the product expands.
              </p>

              <div className="mt-8 grid gap-3">
                {providerPlanBreakdown.map(([plan, priceOrAccess, access]) => (
                  <div
                    key={plan}
                    className="flex flex-col gap-1 rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-emerald-400/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">
                        {plan}
                      </span>
                      {access ? (
                        <span className="text-sm text-zinc-500">{priceOrAccess}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-zinc-300">
                      {access ?? priceOrAccess}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-xl border border-emerald-400/20 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">Live providers</h3>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Enabled
                  </span>
                </div>
                <div className="grid gap-3">
                  {liveProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <ProviderLogo
                            name={provider.name}
                            logo={provider.logo}
                            logoUrl={provider.logoUrl}
                            brandColor={provider.brandColor}
                          />
                          <div>
                            <p className="font-semibold text-white">{provider.name}</p>
                            <p className="mt-1 font-mono text-xs text-zinc-500">
                              Provider ID: {provider.id}
                            </p>
                          </div>
                        </div>
                        <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                          {provider.plans}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        <span className="font-medium text-zinc-300">Filters:</span>{" "}
                        {provider.filters}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">Coming soon</h3>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-400">
                    Planned
                  </span>
                </div>
                <div className="grid gap-3">
                  {plannedProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="grid gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-4 opacity-60 sm:grid-cols-[1fr_1.4fr] sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <ProviderLogo
                          name={provider.name}
                          logo={provider.logo}
                          logoUrl={provider.logoUrl}
                          brandColor={provider.brandColor}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-zinc-200">{provider.name}</p>
                            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              Coming soon
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">{provider.filters}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 text-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              From saved search to actionable alert.
            </h2>
            <p className="mt-4 leading-7 text-zinc-600">
              DealScout turns scattered marketplace browsing into a repeatable
              pipeline for finding cars worth calling about.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-zinc-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-zinc-400">
              Start free. Upgrade when you need more speed and sources.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
              <h3 className="text-xl font-bold text-white">{PLANS.free.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">Free</span>
              </div>
              <div className="my-6 border-t border-zinc-800" />
              <ul className="flex-1 space-y-3">
                {(PLANS.free.features as readonly string[]).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
              >
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-zinc-900 p-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{PLANS.pro.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${PLANS.pro.price}</span>
                <span className="text-sm text-zinc-400">/mo</span>
              </div>
              <div className="my-6 border-t border-zinc-800" />
              <ul className="flex-1 space-y-3">
                {(PLANS.pro.features as readonly string[]).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=pro"
                className="mt-8 block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Dealer */}
            <div className="relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
              <h3 className="text-xl font-bold text-white">{PLANS.dealer.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${PLANS.dealer.price}</span>
                <span className="text-sm text-zinc-400">/mo</span>
              </div>
              <div className="my-6 border-t border-zinc-800" />
              <ul className="flex-1 space-y-3">
                {(PLANS.dealer.features as readonly string[]).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=dealer"
                className="mt-8 block w-full rounded-xl border border-white/20 py-3 text-center text-sm font-semibold text-zinc-200 transition hover:border-white/40 hover:text-white"
              >
                Upgrade to Dealer
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <MapPin className="text-emerald-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Built for buyers who move quickly.
          </h2>
          <div className="mt-6 grid gap-3">
            {audience.map((item) => (
              <div key={item} className="flex items-start gap-3 text-zinc-300">
                <Check size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <TrendingUp className="text-emerald-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Upgrade when speed matters.
          </h2>
          <p className="mt-4 leading-7 text-zinc-400">
            Start free with basic monitoring. Pro adds Craigslist, 30-minute
            polling, instant alerts, and AI scoring. Dealer expands the limits
            for high-volume sourcing.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Compare pricing
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="bg-zinc-900/60 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [ShieldCheck, "Cleaner inventory", "Remove obvious parts, boats, motorcycles, duplicate posts, and blacklist matches."],
              [Mail, "Alerts that fit the plan", "Daily digest for free users and instant alerts for Pro and Dealer users."],
              [Gauge, "Decision-ready scores", "Rank opportunities by estimated value, savings, condition, and risk signals."],
            ].map(([Icon, title, body]) => {
              const DisplayIcon = Icon as typeof ShieldCheck;
              return (
                <div key={title as string} className="rounded-xl border border-white/10 bg-zinc-950 p-6">
                  <DisplayIcon className="text-emerald-300" />
                  <h3 className="mt-5 text-lg font-semibold text-white">{title as string}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{body as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
          Questions buyers ask before starting.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {faqs.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
              <h3 className="font-semibold text-white">{q}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
        <div className="rounded-xl bg-emerald-400 p-8 text-zinc-950 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Stop missing local car deals.
              </h2>
              <p className="mt-3 max-w-2xl text-zinc-800">
                Create your first saved search and let DealScout watch the
                market while you focus on the listings worth pursuing.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Start free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
