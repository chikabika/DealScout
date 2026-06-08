import 'dotenv/config'
import { runCarGurusScraper } from '@/lib/scrapers/cargurus'

async function main() {
  console.log('=== CarGurus Firecrawl Test ===\n')
  const results = await runCarGurusScraper({
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    radiusMiles: 50,
    minPrice: 5000,
    maxPrice: 20000,
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
    console.log(`  🏪 ${r.dealerName ?? 'no dealer name'}`)
    console.log(`  🔗 ${r.url}`)
    console.log(`  🖼 ${r.image ? 'has image' : 'no image'}\n`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
