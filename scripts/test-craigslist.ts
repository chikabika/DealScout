import 'dotenv/config'
import { runCraigslistScraper } from '@/lib/scrapers/craigslist'

async function main() {
  console.log('=== Craigslist Scraper Test ===\n')

  const cases = [
    {
      label: 'Price band (LA, $5k–$15k)',
      input: {
        city: 'Los Angeles', state: 'CA',
        minPrice: 5000, maxPrice: 15000, minYear: null, maxYear: null,
        maxMileage: null, make: null, model: null, keywords: null,
      },
    },
    {
      label: 'Price + minYear (LA, $5k–$20k, 2015+)',
      input: {
        city: 'Los Angeles', state: 'CA',
        minPrice: 5000, maxPrice: 20000, minYear: 2015, maxYear: null,
        maxMileage: null, make: null, model: null, keywords: null,
      },
    },
    {
      label: 'Unmapped city (Walla Walla) — should return [] fast',
      input: {
        city: 'Walla Walla', state: 'WA',
        minPrice: null, maxPrice: 10000, minYear: null, maxYear: null,
        maxMileage: null, make: null, model: null, keywords: null,
      },
      expectEmpty: true,
    },
  ]

  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`)
    const t0 = Date.now()
    const results = await runCraigslistScraper(c.input, { maxItems: 10 })
    const secs = ((Date.now() - t0) / 1000).toFixed(1)
    console.log(`Got ${results.length} listings in ${secs}s`)

    if (c.expectEmpty) {
      console.log(results.length === 0 ? '✅ correctly empty' : `❌ expected empty, got ${results.length}`)
      continue
    }

    let priceViolations = 0
    let yearViolations = 0
    let nullYear = 0
    for (const r of results) {
      const priceOk = r.price >= (c.input.minPrice ?? 0) && r.price <= c.input.maxPrice
      if (!priceOk) priceViolations++
      if (c.input.minYear) {
        if (r.year == null) nullYear++
        else if (r.year < c.input.minYear) yearViolations++
      }
      console.log(`${priceOk ? 'OK ' : 'BAD'} $${r.price.toLocaleString()} · ${r.year ?? 'no-year'} ${r.make ?? ''} · ${r.location ?? '?'}`)
    }
    console.log(`Price out-of-range: ${priceViolations} | Year out-of-range: ${yearViolations} | Null-year (unknown): ${nullYear}`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
