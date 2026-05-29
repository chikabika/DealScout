/**
 * Standalone test for the Craigslist scraper.
 * Runs three search scenarios and prints results to stdout.
 * Does not touch the database or any other infra — purely HTTP + parse.
 *
 * Usage:
 *   npx tsx scripts/test-craigslist.ts
 */

import 'dotenv/config'

import { buildCraigslistSearchUrl, scrapeCraigslist } from '@/lib/scrapers/craigslist'
import { resolveCraigslistSubdomain } from '@/lib/providers/craigslist-cities'
import type { CraigslistSearchInput } from '@/lib/scrapers/craigslist'

// ─── Test scenarios ───────────────────────────────────────────────────────────

const TESTS: Array<{ label: string; input: CraigslistSearchInput }> = [
  {
    label: 'Los Angeles — Honda under $10k (2005+)',
    input: {
      city: 'Los Angeles',
      state: 'CA',
      minPrice: 500,
      maxPrice: 10_000,
      minYear: 2005,
      maxMileage: null,
      make: 'Honda',
      model: null,
      keywords: null,
    },
  },
  {
    label: 'Houston — trucks under $15k',
    input: {
      city: 'Houston',
      state: 'TX',
      minPrice: 2_000,
      maxPrice: 15_000,
      minYear: null,
      maxMileage: null,
      make: null,
      model: null,
      keywords: 'truck',
    },
  },
  {
    label: 'Unmapped city — should return [] without crashing',
    input: {
      city: 'Walla Walla',
      state: 'WA',
      minPrice: null,
      maxPrice: 5_000,
      minYear: null,
      maxMileage: null,
      make: null,
      model: null,
      keywords: null,
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function separator(char = '─', width = 60) {
  return char.repeat(width)
}

function formatAge(ms: number): string {
  const hours = (Date.now() - ms) / 1000 / 3600
  if (hours < 1) return `${Math.round(hours * 60)}m ago`
  if (hours < 24) return `${hours.toFixed(1)}h ago`
  return `${(hours / 24).toFixed(1)}d ago`
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + separator('='))
  console.log('  Craigslist Scraper — Isolation Test')
  console.log(separator('='))

  // Quick URL-builder smoke test before hitting the network
  console.log('\n[URL builder smoke test]')
  for (const city of ['Los Angeles', 'NYC', 'Chicago', 'Walla Walla']) {
    const sub = resolveCraigslistSubdomain(city)
    const url = buildCraigslistSearchUrl({
      city,
      state: '',
      minPrice: 500,
      maxPrice: 10_000,
      minYear: 2010,
      maxMileage: null,
      make: 'Toyota',
      model: null,
      keywords: null,
    })
    console.log(`  ${city.padEnd(16)} → subdomain: ${(sub ?? 'null').padEnd(16)} url: ${url ?? '(null — unmapped)'}`)
  }

  // Live network tests
  for (const test of TESTS) {
    console.log('\n' + separator())
    console.log(`TEST: ${test.label}`)
    console.log(separator())

    const start = Date.now()
    let results: Awaited<ReturnType<typeof scrapeCraigslist>>

    try {
      results = await scrapeCraigslist(test.input, { maxItems: 5 })
    } catch (e) {
      console.error('  ❌ Unexpected throw (should never happen):', e)
      continue
    }

    const elapsed = Date.now() - start
    console.log(`  Got ${results.length} results in ${elapsed}ms\n`)

    if (results.length === 0) {
      console.log('  (empty — expected for unmapped cities or no matching listings)')
      continue
    }

    for (const [idx, r] of results.slice(0, 3).entries()) {
      console.log(`  [${idx + 1}] ${r.title}`)
      console.log(`      Price   : $${r.price.toLocaleString('en-US')}`)
      console.log(`      Vehicle : ${r.year ?? '?'} ${r.make ?? '?'} ${r.model ?? ''}`.trimEnd())
      console.log(`      Mileage : ${r.mileage != null ? r.mileage.toLocaleString('en-US') + ' mi' : 'not listed'}`)
      console.log(`      Location: ${r.location ?? 'unknown'}`)
      console.log(`      Image   : ${r.image ? '✅ ' + r.image.slice(0, 60) + '…' : '❌ none'}`)
      console.log(`      URL     : ${r.url}`)
      if (r.postedAtMs) {
        console.log(`      Posted  : ${formatAge(r.postedAtMs)} (${new Date(r.postedAtMs).toISOString()})`)
      }
      console.log(`      ID      : ${r.externalId}`)
      console.log()
    }

    if (results.length > 3) {
      console.log(`  … and ${results.length - 3} more (capped at maxItems=5)`)
    }
  }

  // Summary
  console.log('\n' + separator('='))
  console.log('  Done. If you saw listings above, the scraper is working.')
  console.log('  If ALL tests returned 0 results, Craigslist may be blocking')
  console.log('  the request — check the raw response with curl:')
  console.log()
  console.log("  curl -s 'https://losangeles.craigslist.org/search/cta?format=json&hasPic=1&max_price=10000&query=honda' | head -c 500")
  console.log(separator('=') + '\n')

  process.exit(0)
}

main().catch((e) => {
  console.error('\n❌ Test runner threw unexpectedly:', e)
  process.exit(1)
})
