import 'dotenv/config'
import { runOfferUpScraper } from '@/lib/scrapers/offerup'

async function main() {
  console.log('=== OfferUp Firecrawl Test ===\n')
  const results = await runOfferUpScraper({
    city: 'Los Angeles',
    state: 'CA',
    minPrice: 3000,
    maxPrice: 15000,
    minYear: null,
    maxMileage: null,
    make: 'Honda',
    model: 'Civic',
    keywords: null,
  }, { maxItems: 5 })

  console.log(`Got ${results.length} listings\n`)
  for (const r of results) {
    console.log(`• ${r.title}`)
    console.log(`  $${r.price.toLocaleString()} · ${r.year ?? '?'} ${r.make ?? ''} ${r.model ?? ''}`)
    console.log(`  📍 ${r.location ?? 'no location'}`)
    console.log(`  🔗 ${r.url}`)
    console.log(`  🖼 ${r.image ? 'has image' : 'no image'}\n`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
