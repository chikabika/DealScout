import 'dotenv/config'
import { runCraigslistScraper } from '@/lib/scrapers/craigslist'

async function main() {
  console.log('=== Craigslist Actor Test ===\n')
  const results = await runCraigslistScraper({
    city: 'Los Angeles',
    state: 'CA',
    minPrice: 500,
    maxPrice: 10000,
    minYear: 2005,
    maxYear: null,
    maxMileage: null,
    make: 'Honda',
    model: null,
    keywords: null,
  }, { maxItems: 5 })

  console.log(`Got ${results.length} listings\n`)
  for (const r of results) {
    console.log(`• ${r.title}`)
    console.log(`  $${r.price.toLocaleString()} · ${r.year ?? '?'} ${r.make ?? '?'} ${r.model ?? ''}`)
    console.log(`  📍 ${r.location ?? '?'} · 🛣 ${r.mileage ? r.mileage.toLocaleString() + ' mi' : 'no mileage'}`)
    console.log(`  🖼 ${r.image ? 'has image' : 'no image'} · ⏰ ${r.postedAtMs ? new Date(r.postedAtMs).toLocaleString() : 'no timestamp'}`)
    console.log(`  🔗 ${r.url}\n`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
