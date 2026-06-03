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
}

export type CollectionResult = {
  inserted: number
  stats: LastRunStats | null
  providersRun: string[]
  skipReason?: string
}

interface ApifyItem {
  id: string
  url: string
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
  description?: string | null
  redactedDescription?: string
  listingPrice?: { amount?: number; currency?: string }
  location?: { reverseGeocode?: { cityPage?: { displayName?: string } } }
  primaryListingPhoto?: { image?: { uri?: string } }
  year?: number | null
  make?: string | null
  model?: string | null
  mileage?: number | null
}

type RawProviderListing =
  | { provider: 'facebook'; listing: ApifyItem }
  | { provider: 'craigslist'; listing: CraigslistListing }
  | { provider: 'carsdotcom'; listing: CarsDotComListing }

type PipelineListing = {
  provider: 'facebook' | 'craigslist' | 'carsdotcom'
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

async function runFacebookScraper(search: Search, maxItems: number): Promise<ApifyItem[] | null> {
  const provider = PROVIDERS.find((p) => p.id === 'facebook')
  if (!provider?.enabled) return null

  const token = process.env.APIFY_TOKEN
  if (!token) {
    console.error('[CRON] APIFY_TOKEN not set')
    return null
  }

  const builtUrl = provider.urlBuilder({
    city: search.city,
    state: search.state,
    minPrice: search.minPrice ?? undefined,
    maxPrice: search.maxPrice,
    minYear: search.minYear ?? undefined,
    maxMileage: search.maxMileage ?? undefined,
    make: search.make ?? undefined,
    model: search.model ?? undefined,
    keywords: search.keywords ?? undefined,
  })

  console.log('[CRON] Facebook URL:', builtUrl)

  const startRes = await fetch(
    `https://api.apify.com/v2/acts/happitap~facebook-marketplace-listings-scraper/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [{ url: builtUrl }],
        maxItems,
      }),
    },
  )

  if (!startRes.ok) {
    const text = await startRes.text().catch(() => '')
    console.error('[CRON] Failed to start Apify run:', startRes.status, text)
    return null
  }

  const startJson = await startRes.json() as { data: { id: string; defaultDatasetId: string } }
  const runId = startJson.data.id
  const datasetId = startJson.data.defaultDatasetId
  console.log('[CRON] Apify run started:', { runId, datasetId })

  let status = 'READY'
  let attempts = 0
  while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'TIMED-OUT' && attempts < 36) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`)
    const statusJson = await statusRes.json() as { data: { status: string } }
    status = statusJson.data.status
    attempts++
    console.log(`[CRON] Run status (${attempts}): ${status}`)
  }

  if (status !== 'SUCCEEDED') {
    console.error('[CRON] Apify run did not succeed:', status)
    return null
  }

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&format=json`,
  )
  const items = (await itemsRes.json()) as ApifyItem[]
  console.log('[CRON] Apify returned items:', items.length)
  if (items.length > 0) {
    console.log('[CRON] Sample item full:', JSON.stringify(items[0], null, 2))
  }

  return items
}

function normalizeToPipeline(raw: RawProviderListing, search: Search): PipelineListing | null {
  if (raw.provider === 'facebook') {
    const item = raw.listing
    if (!item.id || !item.url) return null

    return {
      provider: 'facebook',
      externalId: String(item.id),
      title: item.title ?? '',
      price: Math.round(item.priceNumeric ?? item.listingPrice?.amount ?? 0),
      location: item.locationText ?? null,
      url: item.url,
      image: item.image ?? item.thumbnailUrl ?? null,
      description: item.description ?? null,
      year: item.year ?? null,
      make: item.make ?? null,
      model: item.model ?? null,
      mileage: item.mileage ?? null,
      isSold: item.isSold,
      isLive: item.isLive,
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
  }

  let totalNewListings = 0
  let lastStats: LastRunStats | null = null
  const providersRun: string[] = []

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

  // Reset monthly counter if it's a new month
  const firstOfMonth = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), 1
  ))
  if (!row.runsThisMonthResetAt || new Date(row.runsThisMonthResetAt) < firstOfMonth) {
    await db.update(users)
      .set({ runsThisMonth: 0, runsThisMonthResetAt: firstOfMonth })
      .where(eq(users.id, row.userId))
    row.runsThisMonth = 0
  }

  // Check daily limit
  if ((row.runsToday ?? 0) >= plan.maxRunsPerDay) {
    console.log(`[QUOTA] Daily limit hit — ${row.userEmail}: ${row.runsToday}/${plan.maxRunsPerDay} runs today`)
    return { inserted: 0, stats: null, providersRun: [], skipReason: 'daily_limit' }
  }

  // Check monthly limit
  if ((row.runsThisMonth ?? 0) >= plan.maxRunsPerMonth) {
    console.log(`[QUOTA] Monthly limit hit — ${row.userEmail}: ${row.runsThisMonth}/${plan.maxRunsPerMonth} runs this month`)
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
          maxMileage: row.maxMileage,
          make: row.make,
          model: row.model,
          keywords: row.keywords,
        }, { maxItems: 15 })
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
          maxMileage: row.maxMileage,
          make: row.make,
          model: row.model,
          keywords: row.keywords,
        }, { maxItems: 30 })
        rawProviderListings.push(...items.map((listing) => ({ listing, provider: 'carsdotcom' as const })))
        maxItemsRequested += 30
        if (!providersRun.includes(providerId)) providersRun.push(providerId)
        console.log('[CARSDOTCOM] Added', items.length, 'listings to pipeline')
      }
    } catch (err) {
      console.error(`[CRON] Error — provider: ${providerId}, search: ${row.id}`, err)
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

  const persistStats = async (partial: Omit<LastRunStats, 'ranAt' | 'maxItems' | 'apifyReturned' | 'afterSoldLive' | 'priceRangeUsed' | 'pricesReturned' | 'locationsReturned'>) => {
    const stats: LastRunStats = {
      ranAt: new Date().toISOString(),
      maxItems: maxItemsRequested || maxItems,
      apifyReturned: allRawListings.length,
      afterSoldLive: raw.length,
      priceRangeUsed: { min: row.minPrice ?? 500, max: row.maxPrice },
      pricesReturned,
      locationsReturned,
      ...partial,
    }
    lastStats = stats
    console.log('[STATS]', JSON.stringify(stats))
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
    // Cars.com: skip location filter — the search URL already uses ZIP + radius
    if (item.provider === 'carsdotcom') return true

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

  const junkList = [
    'parts', 'wheels only', 'tires only', 'engine only', 'transmission only',
    'for parts', 'motorcycle', 'atv', 'jet ski', 'boat', 'trailer', ' rv ', 'camper',
  ]
  const clean = located.filter((item) => {
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
    // Select model based on plan — Pro uses Haiku, Dealer uses Sonnet 4
    const scorerModelId = plan.aiModel === 'sonnet'
      ? (process.env.BEDROCK_SCORER_MODEL_ID || process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0')
      : 'us.anthropic.claude-haiku-4-5-20251001-v1:0'

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
    console.log(`[SCORER] Skipping — ${plan.name} plan does not include deal scoring`)
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
    if (plan.emailMode === 'instant') {
      await sendDealAlert(row.userEmail, row.name, inserted)
      console.log('[CRON] Email sent to:', row.userEmail)
    } else {
      console.log('[CRON] digest_daily mode — email queued for daily batch')
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
