import 'dotenv/config'
import { runCarGurusScraper } from '@/lib/scrapers/cargurus'

async function main() {
  console.log('=== CarGurus Firecrawl + Clamp Test ===')

  const cases = [
    {
      label: 'Tight price band — should drop out-of-range',
      input: {
        city: 'Houston', state: 'TX', zipCode: null, radiusMiles: 50,
        minPrice: 500, maxPrice: 10000, minYear: null, maxMileage: null,
        make: null, model: null, keywords: null,
      },
    },
    {
      label: 'Year + mileage band',
      input: {
        city: 'Los Angeles', state: 'CA', zipCode: '90001', radiusMiles: 50,
        minPrice: 5000, maxPrice: 30000, minYear: 2015, maxMileage: 100000,
        make: 'Honda', model: null, keywords: null,
      },
    },
  ]

  for (let i = 0; i < cases.length; i++) {
    if (i > 0) {
      console.log('\n⏳ Waiting 10s between cases to avoid Firecrawl rate-limit...')
      await new Promise((r) => setTimeout(r, 10000))
    }
    const c = cases[i]
    console.log(`\n=== ${c.label} ===`)
    const results = await runCarGurusScraper(c.input, { maxItems: 20 })
    console.log(`Got ${results.length} listings (all should be within range):\n`)
    let violations = 0
    for (const r of results) {
      const priceOk = r.price >= (c.input.minPrice ?? 0) && r.price <= c.input.maxPrice
      const yearOk = !c.input.minYear || r.year == null || r.year >= c.input.minYear
      const mileOk = !c.input.maxMileage || r.mileage == null || r.mileage <= c.input.maxMileage
      const ok = priceOk && yearOk && mileOk
      if (!ok) violations++
      console.log(`${ok ? 'OK ' : 'BAD'} $${r.price.toLocaleString()} · ${r.year ?? '?'} ${r.make ?? ''} · ${r.mileage?.toLocaleString() ?? '?'}mi · ${r.dealerName ?? 'no dealer'}`)
    }
    console.log(violations === 0 ? '✅ no violations' : `❌ ${violations} out-of-range listings leaked`)
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
