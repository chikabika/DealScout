import 'dotenv/config'

/**
 * Live smoke test for the Facebook Marketplace Apify actor
 * (memo23/facebook-marketplace-scraper-ppe). Mirrors the structured input
 * built by src/lib/cron/collect-runner.ts and verifies that price band,
 * location, and keyword are respected. Costs ~$0.005/case (actor start).
 *
 * Run: npx tsx scripts/test-facebook.ts
 */

type ApifyItem = {
  id?: string
  listingUrl?: string
  marketplace_listing_title?: string
  custom_title?: string
  listing_price?: { amount?: string; formatted_amount?: string; amount_with_offset_in_currency?: string }
  location?: { reverse_geocode?: { city?: string; state?: string; city_page?: { display_name?: string } } }
  custom_sub_titles_with_rendering_flags?: { subtitle?: string }[]
  resolvedSearchContext?: { displayName?: string | null; radiusKm?: number | null; source?: string | null }
}

const FB_CITY_SLUG_OVERRIDES: Record<string, string> = {
  losangeles: 'la',
  newyork: 'nyc',
  newyorkcity: 'nyc',
}

function fbCitySlug(city: string): string {
  const compact = (city || '').toLowerCase().replace(/[^a-z]/g, '')
  return FB_CITY_SLUG_OVERRIDES[compact] ?? compact
}

function itemPrice(it: ApifyItem): number | null {
  const offset = it.listing_price?.amount_with_offset_in_currency
  if (offset) {
    const cents = Number.parseFloat(offset)
    if (Number.isFinite(cents) && cents > 0) return Math.round(cents / 100)
  }
  const amount = Number.parseFloat(it.listing_price?.amount ?? '')
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null
}

function itemYear(it: ApifyItem): number | null {
  const title = it.marketplace_listing_title ?? it.custom_title ?? ''
  const match = /\b(19[5-9]\d|20[0-4]\d)\b/.exec(title)
  return match ? Number(match[0]) : null
}

async function runFbInput(input: Record<string, unknown>): Promise<ApifyItem[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('APIFY_TOKEN not set')

  const actorId = process.env.APIFY_FB_ACTOR_ID ?? 'eaycjEuCMKHBDuL9z'
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  if (!startRes.ok) throw new Error(`Apify start failed: ${startRes.status} ${await startRes.text().catch(() => '')}`)
  const startJson = await startRes.json() as { data: { id: string; defaultDatasetId: string } }
  const runId = startJson.data.id
  const datasetId = startJson.data.defaultDatasetId

  let status = 'READY'
  let attempts = 0
  while (!['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status) && attempts < 60) {
    await new Promise((r) => setTimeout(r, 5000))
    const s = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`)
    status = ((await s.json().catch(() => null)) as { data?: { status?: string } } | null)?.data?.status ?? 'FAILED'
    attempts++
    console.log(`[FB] status (${attempts}/60): ${status}`)
  }
  if (status !== 'SUCCEEDED') { console.error(`[FB] run did not succeed: ${status}`); return [] }

  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&format=json`)
  return (await itemsRes.json()) as ApifyItem[]
}

const COMMON = {
  categories: ['vehicles'],
  daysSinceListed: '7',
  sortBy: 'creation_time_descend',
  maxItems: 5,
  proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
}

async function main() {
  console.log('=== Facebook Marketplace Filter Test (structured input) ===')

  const cases: { label: string; minPrice: number; maxPrice: number; minYear?: number; input: Record<string, unknown> }[] = [
    {
      label: 'Price band (LA, $5k–$15k)',
      minPrice: 5000, maxPrice: 15000,
      input: { ...COMMON, marketplaceLocation: fbCitySlug('Los Angeles'), radiusKm: 100, minPrice: 5000, maxPrice: 15000 },
    },
    {
      label: 'Price + minYear (LA, $5k–$25k, 2015+) — minYear is post-filtered, expect violations here',
      minPrice: 5000, maxPrice: 25000, minYear: 2015,
      input: { ...COMMON, marketplaceLocation: fbCitySlug('Los Angeles'), radiusKm: 100, minPrice: 5000, maxPrice: 25000 },
    },
    {
      label: 'Make query (LA, Honda, $5k–$25k)',
      minPrice: 5000, maxPrice: 25000,
      input: { ...COMMON, marketplaceLocation: fbCitySlug('Los Angeles'), radiusKm: 100, minPrice: 5000, maxPrice: 25000, searchQuery: 'Honda' },
    },
    {
      label: 'Keyword search (LA, "down payment", $500–$5k, no category)',
      minPrice: 500, maxPrice: 5000,
      input: { ...COMMON, categories: undefined, marketplaceLocation: fbCitySlug('Los Angeles'), radiusKm: 100, minPrice: 500, maxPrice: 5000, searchQuery: 'down payment' },
    },
  ]

  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`)
    console.log('Input:', JSON.stringify(c.input))
    const items = await runFbInput(c.input)
    console.log(`Got ${items.length} items\n`)

    let priceViol = 0, yearViol = 0, nullPrice = 0, nullYear = 0
    for (const it of items) {
      const price = itemPrice(it)
      const year = itemYear(it)
      const title = it.marketplace_listing_title ?? it.custom_title ?? '(no title)'
      const loc = it.location?.reverse_geocode?.city_page?.display_name ?? '(no location)'

      if (price == null) nullPrice++
      else if (price < c.minPrice || price > c.maxPrice) priceViol++

      if (c.minYear) {
        if (year == null) nullYear++
        else if (year < c.minYear) yearViol++
      }
      console.log(`${price == null ? '?  ' : (price >= c.minPrice && price <= c.maxPrice ? 'OK ' : 'BAD')} $${price?.toLocaleString() ?? '?'} · ${year ?? 'no-year'} · ${title.slice(0, 40)} · ${loc}`)
    }
    const ctx = items[0]?.resolvedSearchContext
    if (ctx) console.log(`Resolved location: ${ctx.displayName} (radius ${ctx.radiusKm}km, source ${ctx.source})`)
    console.log(`Price out-of-range: ${priceViol} | null-price: ${nullPrice} | Year out-of-range: ${yearViol} | null-year: ${nullYear}`)
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
