import 'dotenv/config'
import { runOfferUpScraper } from '@/lib/scrapers/offerup'

async function main() {
  console.log('=== OfferUp Firecrawl Test ===')

  const cases = [
    {
      label: 'Price band (LA, $3k–$15k, Honda)',
      input: {
        city: 'Los Angeles', state: 'CA',
        minPrice: 3000, maxPrice: 15000, minYear: null,
        maxMileage: null, make: 'Honda', model: null, keywords: null,
      },
    },
    {
      label: 'Tight price band (LA, $5k–$8k, car)',
      input: {
        city: 'Los Angeles', state: 'CA',
        minPrice: 5000, maxPrice: 8000, minYear: null,
        maxMileage: null, make: null, model: null, keywords: null,
      },
    },
  ]

  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`)
    const t0 = Date.now()
    let results
    try {
      results = await runOfferUpScraper(c.input, { maxItems: 15 })
    } catch (e) {
      console.error(`❌ threw after ${((Date.now() - t0) / 1000).toFixed(1)}s:`, e instanceof Error ? e.message : e)
      continue
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1)
    console.log(`Got ${results.length} listings in ${secs}s\n`)

    let priceViol = 0
    for (const r of results) {
      const ok = r.price >= (c.input.minPrice ?? 0) && r.price <= c.input.maxPrice
      if (!ok) priceViol++
      console.log(`${ok ? 'OK ' : 'BAD'} $${r.price.toLocaleString()} · ${r.year ?? 'no-year'} ${r.make ?? ''} · ${r.location ?? '?'}`)
    }
    console.log(`\nTime: ${secs}s | Price out-of-range: ${priceViol}/${results.length}`)
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
