import Link from 'next/link'

export default function CarDealAlertsVsSwoopa() {
  return (
    <article className="space-y-10 text-zinc-300">
      <div className="space-y-4 text-base leading-7">
        <p>
          If you flip cars or source inventory from private sellers, you've probably run into both
          CarDealAlerts and Swoopa. Both scan online marketplaces, use AI to flag underpriced
          vehicles, and alert you the moment a deal appears. The pitch is nearly identical. The real
          difference is what you actually pay — and what you get for it.
        </p>
        <p>Here's an honest, side-by-side breakdown to help you pick.</p>
      </div>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500" />
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  CarDealAlerts
                </th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Swoopa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 text-zinc-400">Free plan</td>
                <td className="py-3 text-zinc-300">Yes — 1 search, Facebook, free forever</td>
                <td className="py-3 text-zinc-400">No (short trial only)</td>
              </tr>
              <tr>
                <td className="py-3 text-zinc-400">Starting price</td>
                <td className="py-3 text-zinc-300">$49/mo (Pro)</td>
                <td className="py-3 text-zinc-400">$47/mo</td>
              </tr>
              <tr>
                <td className="py-3 text-zinc-400">Top tier</td>
                <td className="py-3 text-zinc-300">$149/mo (Dealer)</td>
                <td className="py-3 text-zinc-400">$352/mo</td>
              </tr>
              <tr>
                <td className="py-3 text-zinc-400">Marketplaces</td>
                <td className="py-3 text-zinc-300">
                  Facebook, Craigslist, Cars.com, CarGurus, OfferUp
                </td>
                <td className="py-3 text-zinc-400">
                  Facebook, Craigslist, OfferUp, Nextdoor, Kijiji
                </td>
              </tr>
              <tr>
                <td className="py-3 text-zinc-400">AI deal scoring</td>
                <td className="py-3 text-zinc-300">Yes (Pro &amp; Dealer plans)</td>
                <td className="py-3 text-zinc-400">Yes</td>
              </tr>
              <tr>
                <td className="py-3 text-zinc-400">Platform</td>
                <td className="py-3 text-zinc-300">Web (+ email alerts)</td>
                <td className="py-3 text-zinc-400">Mobile app (iOS/Android)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">Pricing: the biggest difference</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            Swoopa runs three tiers — roughly $47/month for Facebook-only, $144/month for
            multi-marketplace, and $352/month for its top "instant" plan (cheaper if you commit to
            6–12 months). There's no permanent free plan; you get a short trial, then you have to
            pick a paid tier to keep your alerts running.
          </p>
          <p>
            CarDealAlerts is built differently. The{' '}
            <strong className="text-zinc-300">Free plan</strong> gives you 1 saved search on
            Facebook Marketplace — free forever, no trial expiry. The{' '}
            <strong className="text-zinc-300">Pro plan</strong> is $49/month for 5 searches across
            all 5 marketplaces (Facebook, Craigslist, Cars.com, CarGurus, and OfferUp) with instant
            alerts and AI deal scoring. The{' '}
            <strong className="text-zinc-300">Dealer plan</strong> is $149/month for 15 searches,
            every 2-hour polling, and 180 runs per day. The headline: there's a real free plan you
            can run indefinitely, and the top tier costs less than Swoopa's{' '}
            <em>middle</em> one. For a part-time flipper testing whether deal alerts even work in
            their market, that free entry point is the difference between trying it today and not
            trying it at all.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">Marketplace coverage</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>Be honest about where the cars are in your market.</p>
          <p>
            Swoopa leans into private-party classifieds — Facebook Marketplace, Craigslist, OfferUp,
            Nextdoor, and Kijiji. If you source heavily from Nextdoor, or you're in Canada (Kijiji),
            that breadth matters.
          </p>
          <p>
            CarDealAlerts focuses on the platforms with the most car-flipping volume in the US. The
            Free plan covers Facebook Marketplace. Pro and Dealer unlock all five: Facebook,
            Craigslist, Cars.com, CarGurus, and OfferUp. The Cars.com and CarGurus coverage is
            something Swoopa doesn't emphasize, and it pulls listings from dealer and aggregator
            inventory, not just private sellers.
          </p>
          <p>
            Neither tool covers everything. Pick the one that watches the marketplaces you actually
            buy from.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">AI deal scoring</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            Both tools score listings with AI — estimating market value and flagging the gap between
            asking price and likely resale.
          </p>
          <p>
            This is where execution matters more than the feature checkbox. Swoopa users have
            publicly complained that its score sometimes labels obvious problem cars — blown motors,
            project cars priced at market — as good deals, which defeats the purpose. An AI score is
            only useful if you can trust it to filter out the junk.
          </p>
          <p>
            CarDealAlerts scores every listing it pulls and surfaces estimated savings and red flags
            on Pro and Dealer plans, so you spend your time only on the listings worth chasing. The
            Free plan still uses AI filtering to remove noise — AI scoring (with the numerical deal
            score and savings estimate) unlocks at Pro.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">Alert speed</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            Speed is the whole game in flipping — the first person to message a genuinely underpriced
            car usually wins it.
          </p>
          <p>
            Swoopa markets "instant" alerts on its top plan, but its own App Store and Play Store
            reviews repeatedly report delays of 10–15 minutes even at the highest tier. In a market
            where good deals sell in under an hour, that gap is the difference between getting the
            car and getting an "already sold."
          </p>
          <p>
            The honest takeaway: don't take any tool's "instant" marketing at face value — including
            ours. Test alert speed in your own market on the free plan or trial before you commit
            real money.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">Web vs mobile app</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            Swoopa is mobile-app-first (iOS and Android). CarDealAlerts runs in the browser, so your
            searches, dashboard, and deal scores live on the web with email alerts — no app install,
            and it works the same on a laptop or a phone.
          </p>
          <p>
            Which you prefer is personal. Some flippers want push notifications on their phone;
            others want a dashboard they can work from on a desktop.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">Who each tool is best for</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            <strong className="text-zinc-300">Swoopa</strong> makes sense if you're a high-volume
            flipper or dealer sourcing across many private-party classifieds (including Nextdoor or
            Kijiji), you want a polished mobile app, and the subscription cost disappears against
            your monthly margins.
          </p>
          <p>
            <strong className="text-zinc-300">CarDealAlerts</strong> makes sense if you're
            car-focused, you want a free way to prove the concept before paying, you care about
            Cars.com and CarGurus coverage, and you'd rather not pay $144–$352 a month to find out
            whether deal alerts work for you.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/8 pt-8">
        <h2 className="text-xl font-semibold text-white">The verdict</h2>
        <div className="space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            If budget is no object and you flip everything that moves across every classified, Swoopa
            is a capable, established tool. But for most car flippers and buyers — especially anyone
            starting out or testing a new market — paying $47 to $352 a month before you've found a
            single deal is a hard sell when there's a tool that does the core job, scores deals with
            AI, and lets you start free.
          </p>
          <p>
            <Link
              href="/register"
              className="text-emerald-400 hover:underline font-medium"
            >
              Try CarDealAlerts free
            </Link>{' '}
            — set up your first search, see the deals in your market, and only upgrade once it's
            already paying for itself.
          </p>
        </div>
      </section>

      <div className="border-t border-white/8 pt-8 space-y-3 text-sm leading-7 text-zinc-500 italic">
        <p>
          New to this? Start with our honest breakdown of{' '}
          <Link
            href="/blog/is-car-flipping-profitable-2026"
            className="text-emerald-400 hover:underline not-italic"
          >
            whether car flipping is profitable in 2026
          </Link>
          .
        </p>
        <p>
          Pricing and features for both tools are accurate as of June 2026 and may change — check
          each provider's current pricing page before subscribing. CarDealAlerts is not affiliated
          with Swoopa.
        </p>
      </div>
    </article>
  )
}
