import 'dotenv/config'
import { PROVIDERS } from '@/lib/providers'

type ApifyItem = {
  id?: string
  url?: string
  marketplaceListingTitle?: string
  title?: string
  priceNumeric?: number
  listingPrice?: { amount?: number }
  year?: number | null
  make?: string | null
  mileage?: number | null
  locationText?: string
}

async function runFbUrl(url: string, maxItems: number): Promise<ApifyItem[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('APIFY_TOKEN not set')

  const startRes = await fetch(
    `https://api.apify.com/v2/acts/happitap~facebook-marketplace-listings-scraper/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: [{ url }], maxItems }),
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

const fb = PROVIDERS.find((p) => p.id === 'facebook')!

async function main() {
  console.log('=== Facebook Marketplace Filter Test ===')

  const cases = [
    {
      label: 'Price band (LA, $5k–$15k)',
      filters: { city: 'Los Angeles', state: 'CA', minPrice: 5000, maxPrice: 15000 },
    },
    {
      label: 'Price + minYear (LA, $5k–$25k, 2015+)',
      filters: { city: 'Los Angeles', state: 'CA', minPrice: 5000, maxPrice: 25000, minYear: 2015 },
    },
    {
      label: 'Make query (LA, Honda, $5k–$25k)',
      filters: { city: 'Los Angeles', state: 'CA', minPrice: 5000, maxPrice: 25000, make: 'Honda' },
    },
  ]

  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`)
    const url = fb.urlBuilder(c.filters as never)
    console.log('URL:', url)
    const items = await runFbUrl(url, 15)
    console.log(`Got ${items.length} items\n`)

    let priceViol = 0, yearViol = 0, nullPrice = 0, nullYear = 0
    for (const it of items) {
      const price = it.priceNumeric ?? it.listingPrice?.amount ?? null
      const title = it.marketplaceListingTitle ?? it.title ?? '(no title)'
      const min = (c.filters as { minPrice?: number }).minPrice ?? 0
      const max = (c.filters as { maxPrice: number }).maxPrice
      const minYear = (c.filters as { minYear?: number }).minYear

      if (price == null) nullPrice++
      else if (price < min || price > max) priceViol++

      if (minYear) {
        if (it.year == null) nullYear++
        else if (it.year < minYear) yearViol++
      }
      console.log(`${price == null ? '?  ' : (price >= min && price <= max ? 'OK ' : 'BAD')} $${price?.toLocaleString() ?? '?'} · ${it.year ?? 'no-year'} ${it.make ?? ''} · ${title.slice(0, 40)}`)
    }
    console.log(`\nPrice out-of-range: ${priceViol} | null-price: ${nullPrice} | Year out-of-range: ${yearViol} | null-year: ${nullYear}`)
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
