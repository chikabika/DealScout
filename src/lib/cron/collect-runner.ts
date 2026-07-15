import 'server-only'

import { eq, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { fetchOgData, parseTitle } from '@/lib/enrichment/og-fetcher'
import { cacheImageSmart } from '@/lib/image-cache'
import { classifyListing, type Classification } from '@/lib/enrichment/classifier'
import { scoreDeal } from '@/lib/enrichment/scorer'
import { listings, searches, users, type LastRunStats } from '@/lib/schema'
import { PROVIDERS } from '@/lib/providers'
import { getPlan } from '@/lib/plans'
import { runCarsDotComScraper, type CarsDotComListing } from '@/lib/scrapers/carsdotcom'
import { runCarGurusScraper, type CarGurusListing } from '@/lib/scrapers/cargurus'
import { runOfferUpScraper, type OfferUpListing } from '@/lib/scrapers/offerup'
import { runCraigslistScraper, type CraigslistListing } from '@/lib/scrapers/craigslist'
import { sendDealAlert } from '@/lib/email'

type Search = typeof searches.$inferSelect
type User = typeof users.$inferSelect

type RunSearch = Search & {
  userEmail: string
  userPlan: string
  runsToday: number
  runsTodayResetAt: Date | null
  runsThisMonth: number
  runsThisMonthResetAt: Date | null
  userAiCallsThisMonth: number
  emailNotifyMode: string
}

export type CollectionResult = {
  inserted: number
  stats: LastRunStats | null
  providersRun: string[]
  skipReason?: string
}

interface ApifyItem {
  id: string
  url?: string
  title?: string
  priceFormatted?: string
  priceNumeric?: number
  locationText?: string
  thumbnailUrl?: string
  image?: string | null
  vehicleType?: string | null
  dealScore?: number | null
  estimatedValue?: number | null
  savings?: number | null
  conditionRating?: string | null
  conditionNotes?: string[] | null
  redFlags?: string[] | null
  aiSummary?: string | null
  aiScoredAt?: Date | null
  isSold?: boolean
  isLive?: boolean
  deepScrapeStatus?: string
  marketplaceListingTitle?: string
  description?: string | { text?: string } | null
  redactedDescription?: string
  listingPrice?: { amount?: number | string; currency?: string }
  location?: {
    reverseGeocode?: { cityPage?: { displayName?: string } }
    reverse_geocode?: { city?: string; state?: string; city_page?: { display_name?: string } }
  }
  primaryListingPhoto?: { image?: { uri?: string } }
  year?: number | null
  make?: string | null
  model?: string | null
  mileage?: number | null
  // memo23/facebook-marketplace-scraper-ppe emits Facebook's raw GraphQL
  // snake_case fields; keep both conventions so either actor output parses.
  listingUrl?: string
  facebookUrl?: string
  marketplace_listing_title?: string
  custom_title?: string
  listing_price?: { amount?: number | string; formatted_amount?: string; amount_with_offset_in_currency?: string }
  primary_listing_photo?: { image?: { uri?: string }; listing_image?: { uri?: string }; photo_image_url?: string }
  redacted_description?: { text?: string } | string
  is_sold?: boolean
  is_live?: boolean
  is_pending?: boolean
  custom_sub_titles_with_rendering_flags?: { subtitle?: string }[]
  resolvedSearchContext?: {
    displayName?: string | null
    city?: string | null
    radiusKm?: number | null
    locationId?: string | null
    source?: string | null
  }
}

function fbItemUrl(item: ApifyItem): string | null {
  if (item.url) return item.url
  if (item.listingUrl) return item.listingUrl
  if (item.facebookUrl) return item.facebookUrl
  if (item.id) return `https://www.facebook.com/marketplace/item/${item.id}/`
  return null
}

function fbItemPrice(item: ApifyItem): number {
  // amount_with_offset_in_currency is USD cents even when the listing's
  // display currency is foreign (observed: "MX$10,500" with offset 60005 =
  // $600.05), whereas `amount` is the raw local-currency value — prefer it.
  const offset = item.listing_price?.amount_with_offset_in_currency
  if (offset) {
    const cents = Number.parseFloat(offset)
    if (Number.isFinite(cents) && cents > 0) return Math.round(cents / 100)
  }
  const amount = item.priceNumeric ?? item.listingPrice?.amount ?? item.listing_price?.amount
  const numeric = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  if (numeric != null && Number.isFinite(numeric) && numeric > 0) return Math.round(numeric)
  const formatted = item.priceFormatted ?? item.listing_price?.formatted_amount
  if (formatted) {
    const parsed = Number.parseFloat(formatted.replace(/[^0-9.]/g, ''))
    if (Number.isFinite(parsed)) return Math.round(parsed)
  }
  return 0
}

// Facebook shows mileage as a subtitle like "109K miles" or "172K km"
function fbItemMileage(item: ApifyItem): number | null {
  if (item.mileage != null) return item.mileage
  for (const entry of item.custom_sub_titles_with_rendering_flags ?? []) {
    const match = /([\d.,]+)\s*(k)?\s*(km|miles|mi)\b/i.exec(entry.subtitle ?? '')
    if (!match) continue
    let value = Number.parseFloat(match[1].replace(/,/g, ''))
    if (!Number.isFinite(value) || value <= 0) continue
    if (match[2]) value *= 1000
    if (/km/i.test(match[3])) value *= 0.621371
    return Math.round(value)
  }
  return null
}

function fbItemYear(item: ApifyItem, title: string): number | null {
  if (item.year != null) return item.year
  const match = /\b(19[5-9]\d|20[0-4]\d)\b/.exec(title)
  return match ? Number(match[0]) : null
}

function fbItemLocation(item: ApifyItem): string | null {
  if (item.locationText) return item.locationText
  const geo = item.location
  if (geo?.reverseGeocode?.cityPage?.displayName) return geo.reverseGeocode.cityPage.displayName
  const snake = geo?.reverse_geocode
  if (snake?.city_page?.display_name) return snake.city_page.display_name
  if (snake?.city) return snake.state ? `${snake.city}, ${snake.state}` : snake.city
  return null
}

function fbItemDescription(item: ApifyItem): string | null {
  const desc = item.description ?? item.redacted_description ?? item.redactedDescription
  if (typeof desc === 'string') return desc || null
  return desc?.text ?? null
}

type RawProviderListing =
  | { provider: 'facebook'; listing: ApifyItem }
  | { provider: 'craigslist'; listing: CraigslistListing }
  | { provider: 'carsdotcom'; listing: CarsDotComListing }
  | { provider: 'cargurus'; listing: CarGurusListing }
  | { provider: 'offerup'; listing: OfferUpListing }

type PipelineListing = {
  provider: 'facebook' | 'craigslist' | 'carsdotcom' | 'cargurus' | 'offerup'
  externalId: string
  title: string
  price: number
  location: string | null
  url: string
  image: string | null
  description: string | null
  year: number | null
  make: string | null
  model: string | null
  mileage: number | null
  isSold?: boolean
  isLive?: boolean
  vehicleType?: string | null
  dealScore?: number | null
  estimatedValue?: number | null
  savings?: number | null
  conditionRating?: string | null
  conditionNotes?: string[] | null
  redFlags?: string[] | null
  aiSummary?: string | null
  aiScoredAt?: Date | null
}

type ClassifiedListing = PipelineListing & { _classification: Classification }

// Facebook resolves the marketplace location from its own city slugs; an
// unknown slug silently falls back to the scraping proxy's IP location
// (verified live: "losangeles" and "Los Angeles, California" both resolved
// to San Francisco, "la" correctly resolved to Los Angeles + radius).
const FB_CITY_SLUG_OVERRIDES: Record<string, string> = {
  losangeles: 'la',
  newyork: 'nyc',
  newyorkcity: 'nyc',
}

function fbCitySlug(city: string): string {
  const compact = (city || '').toLowerCase().replace(/[^a-z]/g, '')
  return FB_CITY_SLUG_OVERRIDES[compact] ?? compact
}

async function runFacebookScraper(search: Search, maxItems: number): Promise<ApifyItem[] | null> {
  const provider = PROVIDERS.find((p) => p.id === 'facebook')
  if (!provider?.enabled) return null

  const token = process.env.APIFY_TOKEN
  if (!token) {
    console.error('[FB-DEBUG] ABORT: APIFY_TOKEN not set in this deployment')
    return null
  }

  const safeMaxItems = Math.max(1, maxItems ?? 10)
  console.log('[FB-DEBUG] start — search:', search.id, 'city:', search.city, 'maxItems:', safeMaxItems)

  // memo23/facebook-marketplace-scraper-ppe — pay-per-event actor (charged
  // per actor start + per dataset item, no monthly rental). maxItems is the
  // hard cost cap: the actor stops scrolling once the limit is hit.
  //
  // The actor's structured fields are used instead of a startUrls search URL:
  // live tests showed Facebook ignores filter params and the city path on a
  // pasted URL (returned $1,234 items against minPrice=5000, from the proxy's
  // IP city), while the structured fields are applied server-side before any
  // billable item is scraped. minYear/maxYear/maxMileage have no structured
  // field — those are enforced by the pipeline's post-filter instead.
  const queryParts = [search.make, search.model, search.keywords].filter(Boolean).join(' ').trim()
  const input: Record<string, unknown> = {
    marketplaceLocation: fbCitySlug(search.city),
    radiusKm: Math.min(805, Math.round((search.radiusMiles ?? 60) * 1.60934)),
    categories: ['vehicles'],
    minPrice: search.minPrice && search.minPrice >= 500 ? search.minPrice : 500,
    maxPrice: search.maxPrice,
    daysSinceListed: '7',
    sortBy: 'creation_time_descend',
    maxItems: safeMaxItems,
    proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
  }
  if (queryParts) input.searchQuery = queryParts

  console.log('[FB-DEBUG] actor input:', JSON.stringify(input))

  const actorId = process.env.APIFY_FB_ACTOR_ID ?? 'eaycjEuCMKHBDuL9z'
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )

  if (!startRes.ok) {
    const text = await startRes.text().catch(() => '')
    console.error('[FB-DEBUG] FAILED to start Apify run — HTTP', startRes.status, text)
    return null
  }

  const startJson = await startRes.json() as { data: { id: string; defaultDatasetId: string } }
  const runId = startJson.data.id
  const datasetId = startJson.data.defaultDatasetId
  console.log('[FB-DEBUG] Apify run started:', { runId, datasetId })

  let status = 'READY'
  let attempts = 0
  const MAX_ATTEMPTS = 75 // 75 × 5s = 375s, matches the Craigslist scraper; outlasts a slow actor start under cron load
  while (!['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status) && attempts < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`)
    const statusJson = await statusRes.json().catch(() => null) as { data?: { status?: string } } | null
    status = statusJson?.data?.status ?? 'FAILED'
    attempts++
    console.log(`[CRON] FB run status (${attempts}/${MAX_ATTEMPTS}): ${status}`)
  }

  if (status !== 'SUCCEEDED') {
    console.error(`[FB-DEBUG] FAILED: Apify run did not succeed after ${attempts} polls — final status: ${status}. Run log: https://console.apify.com/actors/runs/${runId}`)
    return null
  }

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&format=json`,
  )
  const items = (await itemsRes.json()) as ApifyItem[]
  console.log('[FB-DEBUG] Apify returned items:', items.length)
  if (items.length > 0) {
    console.log('[FB-DEBUG] sample item:', JSON.stringify(items[0]))

    // Facebook falls back to the proxy's IP city when it can't resolve the
    // slug — surface that so bad slugs are caught instead of silently
    // returning wrong-city items (the strict location post-filter drops
    // them, which would look like "source empty" to the user).
    const ctx = items[0].resolvedSearchContext
    if (ctx?.displayName) {
      const resolved = ctx.displayName.toLowerCase()
      const wanted = (search.city || '').toLowerCase()
      const matches = resolved.includes(wanted) || wanted.includes(resolved)
        || fbCitySlug(search.city) === fbCitySlug(ctx.displayName)
      console.log(`[FB-DEBUG] resolved location: "${ctx.displayName}" (radius ${ctx.radiusKm}km) — ${matches ? 'matches search city' : `DOES NOT MATCH search city "${search.city}" — add it to FB_CITY_SLUG_OVERRIDES`}`)
    }
  }

  return items
}

function normalizeToPipeline(raw: RawProviderListing, search: Search): PipelineListing | null {
  if (raw.provider === 'facebook') {
    const item = raw.listing
    const url = fbItemUrl(item)
    if (!item.id || !url) return null

    const title = item.title ?? item.marketplaceListingTitle ?? item.marketplace_listing_title ?? item.custom_title ?? ''

    return {
      provider: 'facebook',
      externalId: String(item.id),
      title,
      price: fbItemPrice(item),
      location: fbItemLocation(item),
      url,
      image: item.image ?? item.thumbnailUrl
        ?? item.primaryListingPhoto?.image?.uri
        ?? item.primary_listing_photo?.photo_image_url
        ?? item.primary_listing_photo?.image?.uri
        ?? item.primary_listing_photo?.listing_image?.uri
        ?? null,
      description: fbItemDescription(item),
      year: fbItemYear(item, title),
      make: item.make ?? null,
      model: item.model ?? null,
      mileage: fbItemMileage(item),
      isSold: item.isSold ?? item.is_sold,
      isLive: item.isLive ?? item.is_live,
    }
  }

  if (raw.provider === 'craigslist') {
    const item = raw.listing
    return {
      provider: 'craigslist',
      externalId: item.externalId,
      title: item.title,
      price: item.price,
      location: item.location,
      url: item.url,
      image: item.image,
      description: item.description,
      year: item.year,
      make: item.make,
      model: item.model,
      mileage: item.mileage,
      isSold: false,
      isLive: true,
    }
  }

  if (raw.provider === 'carsdotcom') {
    const item = raw.listing
    return {
      provider: 'carsdotcom',
      externalId: item.externalId,
      title: item.title,
      price: item.price,
      location: item.location,
      url: item.url,
      image: item.image,
      description: item.description,
      year: item.year,
      make: item.make,
      model: item.model,
      mileage: item.mileage,
      isSold: false,
      isLive: true,
    }
  }

  if (raw.provider === 'cargurus') {
    const item = raw.listing
    return {
      provider: 'cargurus',
      externalId: item.externalId,
      title: item.title,
      price: item.price,
      location: item.location,
      url: item.url,
      image: item.image,
      description: item.description,
      year: item.year,
      make: item.make,
      model: item.model,
      mileage: item.mileage,
      isSold: false,
      isLive: true,
    }
  }

  if (raw.provider === 'offerup') {
    const item = raw.listing
    return {
      provider: 'offerup',
      externalId: item.externalId,
      title: item.title,
      price: item.price,
      location: item.location,
      url: item.url,
      image: item.image,
      description: item.description,
      year: item.year,
      make: item.make,
      model: item.model,
      mileage: item.mileage,
      isSold: false,
      isLive: true,
    }
  }

  console.log('[CRON] Unknown provider for search:', search.id)
  return null
}

function buildInsertTitle(item: PipelineListing) {
  if (item.title && !item.title.startsWith('$')) return item.title
  return `Car listing in ${item.location || 'your area'}`
}

export async function runCollectionForSearch(search: Search, user: User): Promise<CollectionResult> {
  const db = getDb()
  const row: RunSearch = {
    ...search,
    userEmail: user.email,
    userPlan: user.plan,
    runsToday: user.runsToday,
    runsTodayResetAt: user.runsTodayResetAt,
    runsThisMonth: user.runsThisMonth,
    runsThisMonthResetAt: user.runsThisMonthResetAt,
    userAiCallsThisMonth: user.aiCallsThisMonth,
    emailNotifyMode: user.emailNotifyMode,
  }

  let totalNewListings = 0
  let lastStats: LastRunStats | null = null
  const providersRun: string[] = []
  const providerCounts: Record<string, number> = {}
  const providerErrors: Record<string, string> = {}

  const plan = getPlan(row.userPlan ?? 'free')

  // ── Dual run limit enforcement ─────────────────────────────
  const now = new Date()

  // Reset daily counter if it's a new UTC day
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
  ))
  if (!row.runsTodayResetAt || new Date(row.runsTodayResetAt) < todayUTC) {
    await db.update(users)
      .set({ runsToday: 0, runsTodayResetAt: todayUTC })
      .where(eq(users.id, row.userId))
    row.runsToday = 0
  }

  // Only reset monthly counter for paid plans — Free uses lifetime runs
  if (plan.id !== 'free') {
    const firstOfMonth = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), 1
    ))
    if (!row.runsThisMonthResetAt || new Date(row.runsThisMonthResetAt) < firstOfMonth) {
      await db.update(users)
        .set({ runsThisMonth: 0, runsThisMonthResetAt: firstOfMonth })
        .where(eq(users.id, row.userId))
      row.runsThisMonth = 0
    }
  }

  // Check daily limit
  if ((row.runsToday ?? 0) >= plan.maxRunsPerDay) {
    console.log(`[FB-DEBUG] [QUOTA] Daily limit hit — run SKIPPED, no providers called — ${row.userEmail}: ${row.runsToday}/${plan.maxRunsPerDay} runs today`)
    return { inserted: 0, stats: null, providersRun: [], skipReason: 'daily_limit' }
  }

  // Check monthly limit
  if ((row.runsThisMonth ?? 0) >= plan.maxRunsPerMonth) {
    console.log(`[FB-DEBUG] [QUOTA] Monthly limit hit — run SKIPPED, no providers called — ${row.userEmail}: ${row.runsThisMonth}/${plan.maxRunsPerMonth} runs this month`)
    return { inserted: 0, stats: null, providersRun: [], skipReason: 'monthly_limit' }
  }

  console.log(`[QUOTA] OK — ${row.userEmail}: today ${row.runsToday ?? 0}/${plan.maxRunsPerDay}, month ${row.runsThisMonth ?? 0}/${plan.maxRunsPerMonth}`)
  // ─────────────────────────────────────────────────────────────

  const searchProviders = (row.providers as string[] | null) ?? ['facebook']
  const providersToRun = searchProviders.filter((providerId) => {
    if (!(plan.allowedProviders as readonly string[]).includes(providerId)) {
      console.log(`[CRON] Provider ${providerId} not in ${plan.name} plan — skipping`)
      return false
    }

    const provider = PROVIDERS.find((p) => p.id === providerId)
    return provider?.enabled === true
  })

  console.log('[CRON] Running providers:', providersToRun)

  const maxItems = plan.maxItemsPerRun
  const rawProviderListings: RawProviderListing[] = []
  let maxItemsRequested = 0

  for (const providerId of providersToRun) {
    try {
      if (providerId === 'facebook') {
        const items = await runFacebookScraper(row, maxItems)
        providerCounts['facebook'] = items?.length ?? 0
        if (!items) continue
        rawProviderListings.push(...items.map((listing) => ({ listing, provider: 'facebook' as const })))
        maxItemsRequested += maxItems
        if (!providersRun.includes(providerId)) providersRun.push(providerId)
      }

      if (providerId === 'craigslist') {
        const items = await runCraigslistScraper({
          city: row.city,
          state: row.state,
          minPrice: row.minPrice,
          maxPrice: row.maxPrice,
          minYear: row.minYear,
          maxYear: row.maxYear,
          maxMileage: row.maxMileage,
          make: row.make,
          model: row.model,
          keywords: row.keywords,
        }, { maxItems: 15 })
        providerCounts['craigslist'] = items.length
        rawProviderListings.push(...items.map((listing) => ({ listing, provider: 'craigslist' as const })))
        maxItemsRequested += 30
        if (!providersRun.includes(providerId)) providersRun.push(providerId)
      }

      if (providerId === 'carsdotcom') {
        const items = await runCarsDotComScraper({
          city: row.city,
          state: row.state,
          zipCode: row.zipCode ?? null,
          radiusMiles: row.radiusMiles ?? 50,
          minPrice: row.minPrice,
          maxPrice: row.maxPrice,
          minYear: row.minYear,
          maxYear: row.maxYear,
          maxMileage: row.maxMileage,
          make: row.make,
          model: row.model,
          keywords: row.keywords,
        }, { maxItems: 30 })
        providerCounts['carsdotcom'] = items.length
        if (items.length === 0) {
          console.warn('[CARSDOTCOM] Zero listings returned — URL may have failed or Firecrawl returned empty')
        }
        rawProviderListings.push(...items.map((listing) => ({ listing, provider: 'carsdotcom' as const })))
        maxItemsRequested += 30
        if (!providersRun.includes(providerId)) providersRun.push(providerId)
        console.log('[CARSDOTCOM] Added', items.length, 'listings to pipeline')
      }

      if (providerId === 'cargurus') {
        const items = await runCarGurusScraper({
          city: row.city,
          state: row.state,
          zipCode: row.zipCode ?? null,
          radiusMiles: row.radiusMiles ?? 50,
          minPrice: row.minPrice,
          maxPrice: row.maxPrice,
          minYear: row.minYear,
          maxYear: row.maxYear,
          maxMileage: row.maxMileage,
          make: row.make,
          model: row.model,
          keywords: row.keywords,
        }, { maxItems: maxItems ?? 20 })
        providerCounts['cargurus'] = items.length
        if (items.length === 0) {
          console.warn('[CARGURUS] Zero listings returned — URL may have failed or Firecrawl returned empty')
        }
        rawProviderListings.push(...items.map((listing) => ({ listing, provider: 'cargurus' as const })))
        maxItemsRequested += 30
        if (!providersRun.includes(providerId)) providersRun.push(providerId)
        console.log('[CARGURUS] Added', items.length, 'listings to pipeline')
      }

      if (providerId === 'offerup') {
        const items = await runOfferUpScraper({
          city: row.city,
          state: row.state,
          minPrice: row.minPrice,
          maxPrice: row.maxPrice,
          minYear: row.minYear,
          maxMileage: row.maxMileage,
          make: row.make,
          model: row.model,
          keywords: row.keywords,
        }, { maxItems: maxItems ?? 20 })
        providerCounts['offerup'] = items.length
        if (items.length === 0) {
          console.warn('[OFFERUP] Zero listings returned — URL may have failed or Firecrawl returned empty')
        }
        rawProviderListings.push(...items.map((listing) => ({ listing, provider: 'offerup' as const })))
        if (!providersRun.includes(providerId)) providersRun.push(providerId)
        console.log('[OFFERUP] Added', items.length, 'listings to pipeline')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[CRON] Error — provider: ${providerId}, search: ${row.id}`, msg)
      providerErrors[providerId] = msg
    }
  }

  const allRawListings = rawProviderListings
    .map((raw) => normalizeToPipeline(raw, row))
    .filter((item): item is PipelineListing => item !== null)

  console.log('[CRON] Total raw listings across all providers:', allRawListings.length)

  const raw = allRawListings.filter((item) => !item.isSold && item.isLive !== false)
  console.log('[FILTER] After sold/live filter:', raw.length)

  const pricesReturned = raw
    .map((item) => item.price)
    .filter((price) => typeof price === 'number' && price > 0)
    .sort((a, b) => a - b)

  const locationsReturned = Array.from(
    new Set(raw.map((item) => item.location).filter((location): location is string => !!location)),
  ).slice(0, 20)

  const persistStats = async (partial: Omit<LastRunStats, 'ranAt' | 'maxItems' | 'apifyReturned' | 'afterSoldLive' | 'priceRangeUsed' | 'pricesReturned' | 'locationsReturned' | 'providerCounts' | 'providerErrors'>) => {
    const stats: LastRunStats = {
      ranAt: new Date().toISOString(),
      maxItems: maxItemsRequested || maxItems,
      apifyReturned: allRawListings.length,
      afterSoldLive: raw.length,
      priceRangeUsed: { min: row.minPrice ?? 500, max: row.maxPrice },
      pricesReturned,
      locationsReturned,
      providerCounts,
      providerErrors,
      ...partial,
    }
    lastStats = stats
    console.log('[STATS]', JSON.stringify(stats))
    console.log(
      `[FB-DEBUG] funnel: returned=${stats.apifyReturned} → live=${stats.afterSoldLive} → price=${stats.afterPrice} → location=${stats.afterLocation} → junk=${stats.afterJunk} → blacklist=${stats.afterBlacklist} → cars=${stats.afterClassifier} → INSERTED=${stats.newlyInserted}` +
      (Object.keys(stats.providerErrors ?? {}).length ? ` errors=${JSON.stringify(stats.providerErrors)}` : ''),
    )
    await db
      .update(searches)
      .set({ lastRunStats: stats, lastRunAt: new Date() })
      .where(eq(searches.id, row.id))
  }

  const minP = row.minPrice ?? 500
  const maxP = row.maxPrice
  const priced = raw.filter((item) => item.price >= minP && item.price <= maxP)
  console.log('[FILTER] After strict price filter:', priced.length)

  const located = priced.filter((item) => {
    // Cars.com / CarGurus: skip location filter — the search URL already uses ZIP + radius
    if (item.provider === 'carsdotcom' || item.provider === 'cargurus') return true

    // OfferUp: results are based on the scraper's IP geolocation, not the
    // search city/state, so a location match would drop everything — skip it
    // and rely on the price filter instead.
    if (item.provider === 'offerup') return true

    // Facebook/Craigslist: private sellers, match city or state
    const loc = (item.location || '').toLowerCase()
    if (!loc) return false
    const cityNeedle = (row.city || '').toLowerCase().replace(/\s+/g, '')
    const stateNeedle = (row.state || '').toLowerCase()
    return loc.replace(/\s+/g, '').includes(cityNeedle) ||
      loc.includes(stateNeedle) ||
      loc.includes(` ${stateNeedle.toUpperCase()}`)
  })
  console.log('[FILTER] After strict location filter:', located.length,
    `(${priced.length - located.length} dropped — providers: ${[...new Set(priced.filter((i) => !located.includes(i)).map((i) => i.provider))].join(', ')})`)

  // The Facebook actor has no year/mileage inputs (the old URL params were
  // silently ignored anyway), so enforce them here. Items with unknown
  // year/mileage are kept — OG enrichment may fill them in later.
  const specced = located.filter((item) => {
    if (row.minYear && item.year && item.year < row.minYear) return false
    if (row.maxYear && item.year && item.year > row.maxYear) return false
    if (row.maxMileage && item.mileage && item.mileage > row.maxMileage) return false
    return true
  })
  console.log('[FILTER] After year/mileage filter:', specced.length)

  const junkList = [
    'parts', 'wheels only', 'tires only', 'engine only', 'transmission only',
    'for parts', 'motorcycle', 'atv', 'jet ski', 'boat', 'trailer', ' rv ', 'camper',
  ]
  const clean = specced.filter((item) => {
    const title = (item.title || '').toLowerCase()
    if (title.startsWith('$')) return true
    return !junkList.some((blocked) => title.includes(blocked))
  })
  console.log('[FILTER] After junk filter:', clean.length)

  const userBlacklist = (row.blacklist ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  const final = userBlacklist.length === 0 ? clean : clean.filter((item) => {
    const title = (item.title || '').toLowerCase()
    return !userBlacklist.some((blocked) => title.includes(blocked))
  })
  console.log('[FILTER] After user blacklist:', final.length, '— inserting these')

  if (final.length === 0) {
    await persistStats({
      afterPrice: priced.length,
      afterLocation: located.length,
      afterJunk: clean.length,
      afterBlacklist: 0,
      afterClassifier: 0,
      newlyInserted: 0,
    })
    return { inserted: totalNewListings, stats: lastStats, providersRun }
  }

  const finalExternalIds = final.map((item) => item.externalId)
  const existingRows = finalExternalIds.length > 0
    ? await db
      .select({ externalId: listings.externalId, provider: listings.provider })
      .from(listings)
      .where(inArray(listings.externalId, finalExternalIds))
    : []
  const existingIds = new Set(existingRows.map((item) => `${item.provider}:${item.externalId}`))
  const newItems = final.filter((item) => !existingIds.has(`${item.provider}:${item.externalId}`))
  console.log(
    '[CRON] New listings after pre-insert dedupe:',
    newItems.length,
    '(duplicates skipped:',
    final.length - newItems.length,
    ')',
  )

  if (newItems.length === 0) {
    await persistStats({
      afterPrice: priced.length,
      afterLocation: located.length,
      afterJunk: clean.length,
      afterBlacklist: final.length,
      afterClassifier: 0,
      newlyInserted: 0,
    })
    return { inserted: totalNewListings, stats: lastStats, providersRun }
  }

  console.log('[ENRICH] Fetching OG data for Facebook listings in', newItems.length, 'listings')
  let ogHits = 0
  const enriched: PipelineListing[] = []
  for (let i = 0; i < newItems.length; i += 10) {
    const batch = newItems.slice(i, i + 10)
    const results = await Promise.all(batch.map(async (item, idx) => {
      if (item.provider !== 'facebook') return item
      if (idx > 0) await new Promise((resolve) => setTimeout(resolve, 200))

      const og = await fetchOgData(item.url)
      const sourceImage = og.image ?? item.image ?? null
      console.log(`[OG] ${item.url} → title: ${og.title ? '✅' : '❌'}  image: ${og.image ? '✅ (og)' : item.image ? '⚠️ (thumbnail)' : '❌'}`)

      if (og.title) {
        ogHits++
        const parsed = parseTitle(og.title)
        return {
          ...item,
          image: sourceImage,
          title: og.title,
          description: og.description ?? item.description ?? null,
          year: parsed.year ?? item.year ?? null,
          make: parsed.make ?? item.make ?? null,
          model: parsed.model ?? item.model ?? null,
        }
      }

      return { ...item, image: sourceImage }
    }))

    enriched.push(...results)
    if (i + 10 < newItems.length) await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  console.log(`[ENRICH] OG hit rate: ${ogHits}/${newItems.filter((item) => item.provider === 'facebook').length}`)

  console.log('[CACHE] Caching images on Cloudinary for', enriched.length, 'listings')
  enriched.forEach((item) => {
    if (item.image) console.log('  →', `${item.provider}:${item.externalId}`, ':', item.image)
  })
  let cacheHits = 0
  const cached = await Promise.all(
    enriched.map(async (item) => {
      if (!item.image) return item
      const cdnUrl = await cacheImageSmart(item.image, `${item.provider}_${item.externalId}`)
      if (cdnUrl) {
        cacheHits++
        return { ...item, image: cdnUrl }
      }
      return item
    }),
  )
  console.log(`[CACHE] Cached ${cacheHits}/${enriched.length} images`)

  console.log('[CLASSIFY] Running on', cached.length, 'listings')
  const classified: ClassifiedListing[] = await Promise.all(
    cached.map(async (item) => {
      const cls = await classifyListing({
        imageUrl: item.image ?? null,
        title: item.title || '',
        price: item.price,
        location: item.location,
      })
      return { ...item, vehicleType: cls.vehicleType, _classification: cls }
    }),
  )

  const cars = classified.filter((item) => {
    const c = item._classification
    if (c.isCar) return true
    if (c.confidence === 'low') return true
    console.log(`[CLASSIFY] ❌ Dropped: "${item.title || item.externalId}" — ${c.vehicleType} (${c.reason})`)
    return false
  })
  console.log(`[CLASSIFY] Kept ${cars.length}/${classified.length} as cars`)

  const enableScoring = plan.aiScoring && cars.length > 0

  let scoredCars: typeof cars = cars

  if (enableScoring) {
    const scorerModelId = process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-sonnet-4-20250514-v1:0'

    console.log(`[SCORER] Using model: ${scorerModelId} for ${plan.name} plan`)
    console.log(`[SCORER] Running for ${plan.name} user on ${cars.length} listings`)

    const scoringResults = await Promise.all(
      cars.map(async (item) => {
        const score = await scoreDeal({
          imageUrl: item.image ?? null,
          title: item.title ?? '',
          description: item.description ?? null,
          price: item.price,
          year: item.year ?? null,
          make: item.make ?? null,
          model: item.model ?? null,
          mileage: item.mileage ?? null,
          location: item.location,
        }, scorerModelId)
        if (!score) return item
        return {
          ...item,
          dealScore: score.dealScore,
          estimatedValue: score.estimatedValue,
          savings: score.savings,
          conditionRating: score.conditionRating,
          conditionNotes: score.conditionNotes,
          redFlags: score.redFlags,
          aiSummary: score.summary,
          aiScoredAt: new Date(),
        }
      }),
    )

    scoredCars = scoringResults

    const scoredCount = scoringResults.filter((item) => item.dealScore != null).length
    console.log(`[SCORER] Scored ${scoredCount}/${cars.length} listings`)

    if (scoredCount > 0) {
      await db
        .update(users)
        .set({ aiCallsThisMonth: sql`ai_calls_this_month + ${scoredCount}` })
        .where(eq(users.id, row.userId))
    }
  } else {
    console.log(`[SCORER] Skipping — Free plan does not include deal scoring`)
  }

  const toInsert: PipelineListing[] = scoredCars.map((item) => item)

  let inserted: (typeof listings.$inferSelect)[] = []
  if (toInsert.length > 0) {
    const mappedRows: (typeof listings.$inferInsert)[] = toInsert.map((item) => ({
      searchId: row.id,
      externalId: item.externalId,
      title: buildInsertTitle(item),
      description: item.description ?? null,
      price: item.price,
      year: item.year ?? null,
      make: item.make ?? null,
      model: item.model ?? null,
      mileage: item.mileage ?? null,
      location: item.location ?? null,
      url: item.url,
      image: item.image ?? null,
      vehicleType: item.vehicleType ?? null,
      dealScore: item.dealScore ?? null,
      estimatedValue: item.estimatedValue ?? null,
      savings: item.savings ?? null,
      conditionRating: item.conditionRating ?? null,
      conditionNotes: item.conditionNotes ?? null,
      redFlags: item.redFlags ?? null,
      aiSummary: item.aiSummary ?? null,
      aiScoredAt: item.aiScoredAt ?? null,
      provider: item.provider,
      alerted: false,
    }))

    inserted = await db
      .insert(listings)
      .values(mappedRows)
      .onConflictDoNothing()
      .returning()

    console.log('[CRON] Net-new inserts:', inserted.length, '(duplicates skipped)')
  }

  console.log('[PROVIDER SUMMARY]', JSON.stringify({ providerCounts, providerErrors }))
  await persistStats({
    afterPrice: priced.length,
    afterLocation: located.length,
    afterJunk: clean.length,
    afterBlacklist: final.length,
    afterClassifier: cars.length,
    newlyInserted: inserted.length,
  })

  console.log(
    `[SCORER] Summary: ${scoredCars.filter((item) => item.dealScore != null).length} scored` +
    ` of ${cars.length} cars inserted`,
  )

  if (inserted.length > 0) {
    const mode = row.emailNotifyMode ?? 'instant'
    if (mode === 'instant') {
      await sendDealAlert(row.userEmail, row.name, inserted)
      console.log('[CRON] Instant alert sent to:', row.userEmail)
    } else if (mode === 'off') {
      console.log('[CRON] Notifications off — skipping email for', row.userEmail)
    } else {
      // 'daily': inserted rows have alerted=false; a future digest cron picks them up.
      console.log(`[CRON] ${mode} mode — deferring to digest for`, row.userEmail)
    }
    totalNewListings += inserted.length
  }

  // Increment run counters after successful completion
  await db.update(users)
    .set({
      runsToday: sql`coalesce(${users.runsToday}, 0) + 1`,
      runsThisMonth: sql`coalesce(${users.runsThisMonth}, 0) + 1`,
    })
    .where(eq(users.id, row.userId))
  console.log(`[QUOTA] Incremented counters for ${row.userEmail}`)

  return { inserted: totalNewListings, stats: lastStats, providersRun }
}
