import 'dotenv/config'
import { runCarsDotComScraper } from '@/lib/scrapers/carsdotcom'

async function main() {
  console.log('=== Cars.com Firecrawl Test ===\n')

  const cases = [
    {
      label: 'Tight price band — should drop out-of-range',
      input: {
        city: 'Houston', state: 'TX', zipCode: null, radiusMiles: 50,
        minPrice: 500, maxPrice: 10000, minYear: null, maxYear: null, maxMileage: null,
        make: null, model: null, keywords: null,
      },
    },
    {
      label: 'Year + mileage band',
      input: {
        city: 'Los Angeles', state: 'CA', zipCode: '90001', radiusMiles: 50,
        minPrice: 5000, maxPrice: 30000, minYear: 2015, maxYear: null, maxMileage: 100000,
        make: 'Honda', model: null, keywords: null,
      },
    },
    {
      label: 'Acura + minYear (mirrors confirmed URL)',
      input: {
        city: 'Houston', state: 'TX', zipCode: '77001', radiusMiles: 50,
        minPrice: 10000, maxPrice: 40000, minYear: 2024, maxYear: null, maxMileage: null,
        make: 'Acura', model: null, keywords: null,
      },
    },
    {
      label: 'Max year clamp (Acura, 2024 only)',
      input: {
        city: 'Houston', state: 'TX', zipCode: '77001', radiusMiles: 50,
        minPrice: 10000, maxPrice: 40000, minYear: 2024, maxYear: 2024, maxMileage: null,
        make: 'Acura', model: null, keywords: null,
      },
    },
    {
      label: 'Make + model (Honda Civic) — settles model filter',
      input: {
        city: 'Dallas', state: 'TX', zipCode: null, radiusMiles: 50,
        minPrice: 5000, maxPrice: 35000, minYear: null, maxYear: null, maxMileage: null,
        make: 'Honda', model: 'Civic', keywords: null,
      },
    },
  ]

  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`)
    const results = await runCarsDotComScraper(c.input, { maxItems: 20 })
    console.log(`Got ${results.length} listings:\n`)
    let violations = 0
    for (const r of results) {
      const t = r.title.toLowerCase()
      const priceOk = r.price >= (c.input.minPrice ?? 0) && r.price <= c.input.maxPrice
      const yearOk = !c.input.minYear || r.year == null || r.year >= c.input.minYear
      const maxYearOk = !c.input.maxYear || r.year == null || r.year <= c.input.maxYear
      const mileOk = !c.input.maxMileage || r.mileage == null || r.mileage <= c.input.maxMileage
      const makeOk = !c.input.make || (r.make ?? '').toLowerCase().includes(c.input.make.toLowerCase()) || t.includes(c.input.make.toLowerCase())
      const modelOk = !c.input.model || t.includes(c.input.model.toLowerCase())
      const ok = priceOk && yearOk && maxYearOk && mileOk && makeOk && modelOk
      if (!ok) violations++
      const flags = [!priceOk && 'price', !yearOk && 'year', !maxYearOk && 'maxYear', !mileOk && 'mileage', !makeOk && 'make', !modelOk && 'model'].filter(Boolean).join(',')
      console.log(`${ok ? 'OK ' : 'BAD'} $${r.price.toLocaleString()} · ${r.year ?? '?'} ${r.make ?? ''} ${r.model ?? ''} · ${r.mileage?.toLocaleString() ?? '?'}mi · ${r.location ?? '?'}${flags ? ` [${flags}]` : ''}`)
    }
    console.log(violations === 0 ? '✅ no violations' : `❌ ${violations} violations`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
