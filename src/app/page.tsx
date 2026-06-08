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
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CarDealAlerts | AI Car Deal Alerts for Facebook Marketplace and Craigslist",
  description:
    "CarDealAlerts monitors local vehicle listings, filters out junk, scores deals with AI, and sends fast alerts when underpriced cars appear.",
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
    body: "Scan Facebook Marketplace, Craigslist, Cars.com, CarGurus, and OfferUp on a schedule so you never have to manually refresh tabs.",
  },
  {
    icon: Sparkles,
    title: "AI deal scoring",
    body: "Estimate market value, savings, condition, and red flags before spending time on any listing.",
  },
  {
    icon: Bell,
    title: "Email alerts",
    body: "Instant alerts for paid plans and daily digests for free users when fresh matches appear.",
  },
];

const steps = [
  "Create a saved search for your target vehicle and location.",
  "CarDealAlerts scans supported marketplaces on your plan's schedule.",
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
    brandColor: "#6B2D8B",
    plans: "Pro, Dealer",
    filters: "State, price, year, make, model",
  },
  {
    name: "CarGurus",
    id: "cargurus",
    logo: "🔍",
    logoUrl: undefined,
    brandColor: "#E8143C",
    plans: "Pro, Dealer",
    filters: "Price, year, mileage, make, model",
  },
  {
    name: "OfferUp",
    id: "offerup",
    logo: "🛒",
    logoUrl: "/providers/offerup.svg",
    brandColor: "#00B47C",
    plans: "Pro, Dealer",
    filters: "Make, model, price",
  },
];

const plannedProviders = [
  {
    name: "AutoTrader",
    id: "autotrader",
    logo: "🚗",
    logoUrl: "/providers/autotrader.svg",
    brandColor: "#FF6900",
    filters: "State, price, year, make, model",
  },
];

const trustPoints = [
  "No manual refreshing — CarDealAlerts watches for you 24/7.",
  "No dealership spam — only private seller and local listings.",
  "Easy saved searches — set your filters once and forget.",
  "Cancel anytime — no contracts, no commitment.",
  "AI estimates for faster decision-making on every listing.",
];

const faqs = [
  {
    q: "What marketplaces does CarDealAlerts support?",
    a: "Facebook Marketplace is available on all plans. Craigslist, Cars.com, CarGurus, and OfferUp dealer and marketplace inventory are available on Pro and Dealer plans.",
  },
  {
    q: "How does AI deal scoring work?",
    a: "CarDealAlerts estimates fair market value, possible savings, condition, and red flags by analyzing listing details, price, mileage, year, make/model, and local market context. It is informational only and not a vehicle inspection.",
  },
  {
    q: "Can I start for free?",
    a: "Yes. The free plan includes 1 saved search, Facebook Marketplace monitoring, and a daily email digest with twice-daily scans.",
  },
  {
    q: "Who is the Dealer plan for?",
    a: "The Dealer plan is built for high-volume buyers who need more searches, faster polling every 2 hours, and broader marketplace coverage including Cars.com.",
  },
  {
    q: "Is CarDealAlerts affiliated with Facebook or Craigslist?",
    a: "No. CarDealAlerts is an independent tool and is not affiliated with, endorsed by, or officially partnered with Facebook, Craigslist, Cars.com, CarGurus, OfferUp, AutoTrader, or any marketplace.",
  },
  {
    q: "Are AI price estimates guaranteed?",
    a: "No. AI estimates are informational only. Always verify vehicle history, title status, condition, and seller legitimacy before buying.",
  },
];

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CarDealAlerts",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered vehicle deal tracking for Facebook Marketplace, Craigslist, and more.",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Pro", price: "49", priceCurrency: "USD" },
      { "@type": "Offer", name: "Dealer", price: "149", priceCurrency: "USD" },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}

function Logo() {
  return (
    <Link href="/" aria-label="CarDealAlerts home">
      <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-10 w-auto" />
    </Link>
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

function ExampleAlertCard() {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-zinc-900 shadow-xl shadow-emerald-950/30">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-white/10 bg-zinc-900/80 px-5 py-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-emerald-300" />
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Deal Alert
          </span>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
          Score 91/100
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-[64px_1fr] gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-emerald-900" />
          <div>
            <p className="text-base font-bold text-white">2018 Toyota Tacoma SR5</p>
            <p className="mt-0.5 text-xs text-zinc-500">Facebook Marketplace · Tampa, FL</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">87,200 mi</span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">2018</span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">Manual</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-zinc-800/70 px-3 py-2 text-center">
            <p className="text-xs text-zinc-500">Listed price</p>
            <p className="mt-0.5 text-sm font-bold text-white">$18,900</p>
          </div>
          <div className="rounded-lg bg-zinc-800/70 px-3 py-2 text-center">
            <p className="text-xs text-zinc-500">Est. market</p>
            <p className="mt-0.5 text-sm font-bold text-white">$23,100</p>
          </div>
          <div className="rounded-lg bg-emerald-400/10 px-3 py-2 text-center">
            <p className="text-xs text-zinc-500">Savings</p>
            <p className="mt-0.5 text-sm font-bold text-emerald-300">$4,200</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-400/8 px-3 py-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300/80">
            Possible red flags: Low-detail description — verify title status before buying.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#marketplaces" className="hover:text-white">Marketplaces</a>
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-zinc-300 hover:text-white sm:inline">
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

      {/* ── Hero ── */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
            <Clock size={15} />
            Find local car deals before they vanish
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Never miss an underpriced used car again.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Get fast alerts when underpriced used cars appear on Facebook Marketplace, Craigslist, Cars.com, CarGurus, and OfferUp.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              Start free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#example-alert"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See Example Alert
            </a>
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
        <ExampleAlertCard />
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-white/10 bg-zinc-900/45">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-6">
          {[
            ["Every 2h", "fastest Dealer plan polling"],
            ["15", "saved searches on Dealer plan"],
            ["AI", "market value and red flag analysis"],
          ].map(([stat, label]) => (
            <div key={label} className="py-2">
              <p className="text-3xl font-semibold text-white">{stat}</p>
              <p className="mt-1 text-sm text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A cleaner way to hunt used car deals.
          </h2>
          <p className="mt-4 text-zinc-400">
            Designed around timing, filtering, and confidence — so you can act quickly
            without chasing every low-quality post.
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

      {/* ── Marketplaces ── */}
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
                CarDealAlerts monitors Facebook Marketplace for every user. Pro and Dealer
                plans add Craigslist, Cars.com, CarGurus, and OfferUp for broader coverage.
              </p>
              <p className="mt-4 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-xs leading-5 text-zinc-500">
                CarDealAlerts is not affiliated with Facebook, Craigslist, Cars.com, CarGurus, OfferUp,
                AutoTrader, or any listed marketplace. Logos are used as source identifiers only.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  ["Free", null, "Facebook Marketplace · Twice daily"],
                  ["Pro", "$49/mo", "Facebook + Craigslist + Cars.com + CarGurus + OfferUp · Every 4 hours"],
                  ["Dealer", "$149/mo", "All 5 marketplaces · Every 2 hours"],
                ].map(([plan, price, access]) => (
                  <div
                    key={plan}
                    className="flex flex-col gap-1 rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-emerald-400/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">
                        {plan}
                      </span>
                      {price && <span className="text-sm text-zinc-500">{price}</span>}
                    </div>
                    <p className="text-sm text-zinc-300">{access}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-xl border border-emerald-400/20 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">Live providers</h3>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Enabled</span>
                </div>
                <div className="grid gap-3">
                  {liveProviders.map((provider) => (
                    <div key={provider.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <ProviderLogo name={provider.name} logo={provider.logo} logoUrl={provider.logoUrl} brandColor={provider.brandColor} />
                          <div>
                            <p className="font-semibold text-white">{provider.name}</p>
                            <p className="mt-1 text-xs text-zinc-500">{provider.id}</p>
                          </div>
                        </div>
                        <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                          {provider.plans}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        <span className="font-medium text-zinc-300">Filters:</span> {provider.filters}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">Coming soon</h3>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-400">Planned</span>
                </div>
                <div className="grid gap-3">
                  {plannedProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-4 opacity-60">
                      <ProviderLogo name={provider.name} logo={provider.logo} logoUrl={provider.logoUrl} brandColor={provider.brandColor} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-200">{provider.name}</p>
                          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Coming soon</span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">{provider.filters}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-20 text-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              From saved search to actionable alert.
            </h2>
            <p className="mt-4 leading-7 text-zinc-600">
              CarDealAlerts turns scattered marketplace browsing into a repeatable
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

      {/* ── Example Alert ── */}
      <section id="example-alert" className="border-t border-white/10 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Example Deal Alert</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Know if a deal is worth your time — instantly.
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                Every alert includes a DealScore, estimated market value, potential savings,
                and AI-detected red flags so you can act with confidence.
              </p>
              <div className="mt-6 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-xs leading-5 text-zinc-500">
                <strong className="text-zinc-400">Built to help you move faster — not replace your judgment.</strong>{" "}
                CarDealAlerts helps you spot possible deals faster, but you should always verify title status, vehicle history, seller legitimacy, availability, and condition before buying.
              </div>
            </div>
            <div>
              <ExampleAlertCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-white/10 bg-zinc-900/40 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-zinc-400">Start free. Upgrade when you need more speed and sources.</p>
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
              <Link href="/register" className="mt-8 block w-full rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200">
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-zinc-900 p-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">Most popular</span>
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
              <Link href="/register?plan=pro" className="mt-8 block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-500">
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
              <Link href="/register?plan=dealer" className="mt-8 block w-full rounded-xl border border-white/20 py-3 text-center text-sm font-semibold text-zinc-200 transition hover:border-white/40 hover:text-white">
                Upgrade to Dealer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="border-t border-white/10 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Why CarDealAlerts</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Built for serious used-car buyers.
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                Whether you&apos;re buying one car or sourcing inventory every week,
                CarDealAlerts keeps you ahead of the market.
              </p>
            </div>
            <div className="grid gap-3">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Secondary features ── */}
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

      {/* ── Who it's for ── */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <MapPin className="text-emerald-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Built for buyers who move quickly.</h2>
          <div className="mt-6 grid gap-3">
            {[
              "Used car buyers watching a specific budget",
              "Dealers sourcing local inventory faster",
              "Flippers comparing asking price to market value",
              "Busy shoppers who want fewer tabs and better timing",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-zinc-300">
                <Check size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-6">
          <TrendingUp className="text-emerald-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Upgrade when speed matters.</h2>
          <p className="mt-4 leading-7 text-zinc-400">
            Start free with basic monitoring. Pro adds Craigslist, Cars.com,
            CarGurus, and OfferUp with every-4-hour polling, instant alerts,
            and AI scoring. Dealer gets all 5 marketplaces with every-2-hour
            polling.
          </p>
          <Link
            href="#pricing"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Compare pricing
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
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

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">
        <div className="rounded-xl bg-emerald-400 p-8 text-zinc-950 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Stop missing local car deals.</h2>
              <p className="mt-3 max-w-2xl text-zinc-800">
                Create your first saved search and let CarDealAlerts watch the
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

      {/* ── Legal disclaimer ── */}
      <div className="border-t border-white/8 bg-zinc-900/30 px-5 py-6 text-center sm:px-6">
        <p className="mx-auto max-w-3xl text-xs leading-5 text-zinc-600">
          AI estimates are informational only. Always verify vehicle history, title status, condition,
          and seller legitimacy before buying. CarDealAlerts does not guarantee price accuracy,
          availability, or vehicle condition.
        </p>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-zinc-950 px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-[1fr_auto]">
            {/* Brand + disclaimer */}
            <div className="max-w-md space-y-3">
              <Link href="/" aria-label="CarDealAlerts home">
                <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-8 w-auto" />
              </Link>
              <p className="text-xs leading-5 text-zinc-500">
                CarDealAlerts is not affiliated with Facebook, Craigslist, Cars.com, CarGurus, OfferUp,
                AutoTrader, or any vehicle marketplace. All trademarks belong to their respective owners.
              </p>
              <p className="text-xs text-zinc-500">
                Support:{' '}
                <a href="mailto:support@cardealalerts.com" className="text-emerald-400 hover:underline transition-colors">
                  support@cardealalerts.com
                </a>
              </p>
            </div>
            {/* Nav links */}
            <div className="flex flex-col gap-6 text-sm text-zinc-500 sm:flex-row sm:gap-10">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Product</p>
                <div className="flex flex-col gap-2">
                  <Link href="/pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link>
                  <Link href="/login" className="hover:text-zinc-300 transition-colors">Log in</Link>
                  <Link href="/register" className="hover:text-zinc-300 transition-colors">Sign up</Link>
                  <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Legal</p>
                <div className="flex flex-col gap-2">
                  <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
                  <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">Refund Policy</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/8 pt-6 text-xs text-zinc-600">
            © {new Date().getFullYear()} CarDealAlerts. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
