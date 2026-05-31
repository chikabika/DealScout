import 'dotenv/config'
import { runCarsDotComScraper } from '@/lib/scrapers/carsdotcom'

async function main() {
  console.log('=== Cars.com Firecrawl Test ===\n')
  const results = await runCarsDotComScraper({
    city: 'Los Angeles',
    state: 'CA',
    minPrice: 5000,
    maxPrice: 30000,
    minYear: 2015,
    maxMileage: 100000,
    make: 'Honda',
    model: null,
    keywords: null,
  }, { maxItems: 5 })

  console.log(`Got ${results.length} listings\n`)
  for (const r of results) {
    console.log(`• ${r.title}`)
    console.log(`  $${r.price.toLocaleString()} · ${r.year} ${r.make} ${r.model}`)
    console.log(`  📍 ${r.location} · 🛣 ${r.mileage?.toLocaleString() ?? 'no mileage'} mi`)
    console.log(`  🔗 ${r.url}`)
    console.log(`  🖼 ${r.image ? 'has image' : 'no image'}\n`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
