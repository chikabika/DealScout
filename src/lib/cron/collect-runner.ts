// Force env vars to be available — Next.js API routes can have inconsistent
// env loading unless vars are explicitly forwarded via next.config.ts.
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
import { sendDealAlert } from '@/lib/email'

type Search = typeof searches.$inferSelect
type User = typeof users.$inferSelect

type RunSearch = Search & {
  userEmail: string
  userPlan: string
  userScrapesUsed: number
  userScrapesResetAt: Date | null
  userAiCallsThisMonth: number
}

export type CollectionResult = {
  inserted: number
  stats: LastRunStats | null
  providersRun: string[]
}

function firstOfNextMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

// ─── Apify field shape (shallow scrape) ──────────────────────────────────────

interface ApifyItem {
  id: string
  url: string
  title?: string
  priceFormatted?: string
  priceNumeric?: number
  locationText?: string
  thumbnailUrl?: string
  // Unified image field populated during OG enrichment.
  // Prefers og:image (scontent-*.fbcdn.net, directly accessible) over
  // thumbnailUrl (may be a crawler-protected lookaside.fbsbx.com URL).
  image?: string | null
  // Set after AI classification
  vehicleType?: string | null
  // Set after AI deal scoring (Pro/Dealer only)
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
  mileage?: number
}

// Classified item carries the temporary _classification field (stripped before insert)
type ClassifiedItem = ApifyItem & { _classification: Classification }

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runCollectionForSearch(search: Search, user: User): Promise<CollectionResult> {
  const db = getDb()
  const rows: RunSearch[] = [{
    ...search,
    userEmail: user.email,
    userPlan: user.plan,
    userScrapesUsed: user.scrapesUsedThisMonth,
    userScrapesResetAt: user.scrapesResetAt,
    userAiCallsThisMonth: user.aiCallsThisMonth,
  }]

  let totalNewListings = 0
  let lastStats: LastRunStats | null = null
  const providersRun: string[] = []

  // Track in-memory scrape counts per user so multiple searches for the same user
  // accumulate correctly within a single cron call
  const userScrapeCounts = new Map<string, number>()

  for (const search of rows) {
    const plan = getPlan(search.userPlan ?? 'free')

    // ── Monthly reset check ──────────────────────────────────────────────────
    const now = new Date()
    const resetAt = search.userScrapesResetAt
    if (!resetAt || resetAt <= now) {
      await db
        .update(users)
        .set({ scrapesUsedThisMonth: 0, scrapesResetAt: firstOfNextMonth() })
        .where(eq(users.id, search.userId))
      userScrapeCounts.set(search.userId, 0)
    } else if (!userScrapeCounts.has(search.userId)) {
      userScrapeCounts.set(search.userId, search.userScrapesUsed ?? 0)
    }

    // ── Scrape limit check ───────────────────────────────────────────────────
    const currentScrapes = userScrapeCounts.get(search.userId) ?? 0
    if (currentScrapes >= plan.maxScrapesPerMonth) {
      console.log(`[CRON] User ${search.userId} hit monthly scrape limit (${plan.maxScrapesPerMonth}) — skipping`)
      continue
    }

    const providerIds = (search.providers as string[]) ?? ['facebook']

    for (const providerId of providerIds) {
      const provider = PROVIDERS.find((p) => p.id === providerId)
      if (!provider?.enabled) continue

      // Enforce plan's allowed providers
      if (!(plan.allowedProviders as readonly string[]).includes(providerId)) {
        console.log(`[CRON] Provider ${providerId} not in ${plan.name} plan — skipping`)
        continue
      }

      try {
        if (providerId === 'facebook') {
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

          // Plan-aware Apify depth:
          //   Free   → 30 items (~$0.02/run)
          //   Pro    → 75 items
          //   Dealer → 100 items
          const maxItems = plan.maxItemsPerRun

          // ── Step A: start the run ────────────────────────────────────────
          const startRes = await fetch(
            `https://api.apify.com/v2/acts/happitap~facebook-marketplace-listings-scraper/runs?token=${process.env.APIFY_TOKEN}`,
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
            continue
          }

          const startJson = await startRes.json() as { data: { id: string; defaultDatasetId: string } }
          const runId = startJson.data.id
          const datasetId = startJson.data.defaultDatasetId
          console.log('[CRON] Apify run started:', { runId, datasetId })

          // ── Step B: poll until SUCCEEDED ──────────────────────────────────
          let status = 'READY'
          let attempts = 0
          while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'TIMED-OUT' && attempts < 36) {
            await new Promise((r) => setTimeout(r, 5000))
            const statusRes = await fetch(
              `https://api.apify.com/v2/actor-runs/${runId}?token=${process.env.APIFY_TOKEN}`,
            )
            const statusJson = await statusRes.json() as { data: { status: string } }
            status = statusJson.data.status
            attempts++
            console.log(`[CRON] Run status (${attempts}): ${status}`)
          }

          if (status !== 'SUCCEEDED') {
            console.error('[CRON] Apify run did not succeed:', status)
            continue
          }

          // ── Step C: fetch dataset items ────────────────────────────────────
          const itemsRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}&clean=true&format=json`,
          )
          const items = (await itemsRes.json()) as ApifyItem[]
          console.log('[CRON] Apify returned items:', items.length)
          if (items.length > 0) {
            console.log('[CRON] Sample item full:', JSON.stringify(items[0], null, 2))
          }

          // Increment scrape counter in DB and in-memory
          await db
            .update(users)
            .set({ scrapesUsedThisMonth: sql`scrapes_used_this_month + 1` })
            .where(eq(users.id, search.userId))
          userScrapeCounts.set(search.userId, currentScrapes + 1)

          // ── Filters ───────────────────────────────────────────────────────

          const raw = items.filter((i) => !i.isSold && i.isLive !== false)
          console.log('[FILTER] After sold/live filter:', raw.length)

          // Pre-compute stats fields that depend on `raw` (prices, locations).
          // These are collected regardless of how far the pipeline gets so the
          // dashboard can always show "prices Facebook actually returned".
          const pricesReturned = raw
            .map((i) => i.priceNumeric)
            .filter((p): p is number => typeof p === 'number' && p > 0)
            .sort((a, b) => a - b)

          const locationsReturned = Array.from(
            new Set(raw.map((i) => i.locationText).filter((l): l is string => !!l)),
          ).slice(0, 20)

          // Helper: persist stats and timestamp for this search.
          // Called at every exit point (early or full) so the dashboard always
          // has up-to-date diagnostic data.
          const persistStats = async (partial: Omit<LastRunStats, 'ranAt' | 'maxItems' | 'apifyReturned' | 'afterSoldLive' | 'priceRangeUsed' | 'pricesReturned' | 'locationsReturned'>) => {
            const stats: LastRunStats = {
              ranAt: new Date().toISOString(),
              maxItems,
              apifyReturned: items.length,
              afterSoldLive: raw.length,
              priceRangeUsed: { min: search.minPrice ?? 500, max: search.maxPrice },
              pricesReturned,
              locationsReturned,
              ...partial,
            }
            lastStats = stats
            console.log('[STATS]', JSON.stringify(stats))
            await db
              .update(searches)
              .set({ lastRunStats: stats, lastRunAt: new Date() })
              .where(eq(searches.id, search.id))
          }

          // STRICT price filter — Facebook ignores our maxPrice ~10% of the time
          const minP = search.minPrice ?? 500
          const maxP = search.maxPrice
          const priced = raw.filter((i) => {
            const p = i.priceNumeric ?? 0
            return p >= minP && p <= maxP
          })
          console.log('[FILTER] After strict price filter:', priced.length)

          // STRICT location filter — require user's city or state in locationText
          const cityNeedle = (search.city || '').toLowerCase().replace(/\s+/g, '')
          const stateNeedle = (search.state || '').toLowerCase()
          const located = priced.filter((i) => {
            const loc = (i.locationText || '').toLowerCase()
            if (!loc) return false
            const compactLoc = loc.replace(/\s+/g, '')
            return compactLoc.includes(cityNeedle) || loc.includes(stateNeedle)
          })
          console.log('[FILTER] After strict location filter:', located.length)

          // Junk filter (catches "parts/wheels/motorcycle" leakage)
          const junkList = [
            'parts', 'wheels only', 'tires only', 'engine only', 'transmission only',
            'for parts', 'motorcycle', 'atv', 'jet ski', 'boat', 'trailer', ' rv ', 'camper',
          ]
          const clean = located.filter((i) => {
            const title = (i.title || '').toLowerCase()
            if (title.startsWith('$')) return true
            return !junkList.some((b) => title.includes(b))
          })
          console.log('[FILTER] After junk filter:', clean.length)

          // Apply user's custom blacklist words from search.blacklist (if any)
          const userBlacklist = (search.blacklist ?? '')
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean)
          const final = userBlacklist.length === 0 ? clean : clean.filter((i) => {
            const title = (i.title || '').toLowerCase()
            return !userBlacklist.some((b) => title.includes(b))
          })
          console.log('[FILTER] After user blacklist:', final.length, '— inserting these')

          if (final.length === 0) {
            // Persist partial stats so the dashboard can show the diagnostic
            await persistStats({
              afterPrice: priced.length,
              afterLocation: located.length,
              afterJunk: clean.length,
              afterBlacklist: 0,
              afterClassifier: 0,
              newlyInserted: 0,
            })
            continue
          }

          const existingRows = await db
            .select({ externalId: listings.externalId })
            .from(listings)
            .where(inArray(listings.externalId, final.map((item) => item.id)))
          const existingIds = new Set(existingRows.map((row) => row.externalId))
          const newItems = final.filter((item) => !existingIds.has(item.id))
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
            continue
          }

          // ── Step D: OG enrichment ────────────────────────────────────────────
          // Batched 10-at-a-time to stay within the route's maxDuration.
          // Always populates item.image with the best available source URL:
          //   og:image  — usually scontent-*.fbcdn.net, directly accessible
          //   thumbnailUrl — may be lookaside.fbsbx.com (crawler-protected fallback)
          console.log('[ENRICH] Fetching OG data for', newItems.length, 'listings')
          let ogHits = 0

          const enriched: ApifyItem[] = []
          for (let i = 0; i < newItems.length; i += 10) {
            const batch = newItems.slice(i, i + 10)
            const results = await Promise.all(batch.map(async (item, idx) => {
              if (idx > 0) await new Promise((r) => setTimeout(r, 200))

              const og = await fetchOgData(item.url)

              // Prefer OG image — usually a directly-accessible scontent URL.
              // Fall back to thumbnailUrl from Apify (may be lookaside-protected).
              const sourceImage = og.image ?? item.thumbnailUrl ?? null
              console.log(`[OG] ${item.url} → title: ${og.title ? '✅' : '❌'}  image: ${og.image ? '✅ (og)' : item.thumbnailUrl ? '⚠️ (thumbnail)' : '❌'}`)

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

              // Even without a title, capture the best image source we have
              return { ...item, image: sourceImage }
            }))

            enriched.push(...results)
            if (i + 10 < newItems.length) await new Promise((r) => setTimeout(r, 1000))
          }

          console.log(`[ENRICH] OG hit rate: ${ogHits}/${newItems.length}`)

          // ── Step E: upload images to Cloudinary ───────────────────────────────
          // Free tier: 25 GB storage + 25 GB bandwidth/month — no paid plan needed
          // unless you exceed those limits (see https://cloudinary.com/pricing).
          console.log('[CACHE] Caching images on Cloudinary for', enriched.length, 'listings')
          enriched.forEach((item) => {
            if (item.image) console.log('  →', item.id, ':', item.image)
          })
          let cacheHits = 0

          const cached = await Promise.all(
            enriched.map(async (item) => {
              if (!item.image) return item
              const cdnUrl = await cacheImageSmart(item.image, item.id)
              if (cdnUrl) {
                cacheHits++
                return { ...item, image: cdnUrl }
              }
              return item
            }),
          )
          console.log(`[CACHE] Cached ${cacheHits}/${enriched.length} images`)

          // ── Step F: AI classification ────────────────────────────────────────
          console.log('[CLASSIFY] Running on', cached.length, 'listings')

          const classified: ClassifiedItem[] = await Promise.all(
            cached.map(async (item) => {
              const cls = await classifyListing({
                imageUrl: item.image ?? null,
                title: item.title || '',
                price: Math.round(item.priceNumeric ?? item.listingPrice?.amount ?? 0),
                location: item.locationText ?? null,
              })
              return { ...item, vehicleType: cls.vehicleType, _classification: cls }
            }),
          )

          const cars = classified.filter((item) => {
            const c = item._classification
            if (c.isCar) return true
            if (c.confidence === 'low') return true
            console.log(`[CLASSIFY] ❌ Dropped: "${item.title || item.id}" — ${c.vehicleType} (${c.reason})`)
            return false
          })

          console.log(`[CLASSIFY] Kept ${cars.length}/${classified.length} as cars`)

          // ── Step G: AI deal scoring (Pro / Dealer only) ───────────────────────
          // Guards: plan must have scoring enabled AND user must have quota remaining.
          const enableScoring =
            (plan.id === 'pro' || plan.id === 'dealer') &&
            (plan.maxAiCallsPerMonth ?? 0) > 0 &&
            cars.length > 0

          const currentAiCalls =
            userScrapeCounts.get(`ai_${search.userId}`) ?? (search.userAiCallsThisMonth ?? 0)

          let scoredCars: typeof cars = cars

          if (enableScoring) {
            const remainingAiCalls = (plan.maxAiCallsPerMonth ?? 0) - currentAiCalls
            if (remainingAiCalls <= 0) {
              console.warn(
                `[SCORER] User ${search.userEmail} hit AI quota` +
                ` (${currentAiCalls}/${plan.maxAiCallsPerMonth}) — scoring skipped`,
              )
            } else {
              const toScore = cars.slice(0, remainingAiCalls)
              console.log(`[SCORER] Running for ${plan.name} user on ${toScore.length} listings`)

              const scoringResults = await Promise.all(
                toScore.map(async (item) => {
                  const score = await scoreDeal({
                    imageUrl: item.image ?? null,
                    title: item.title ?? '',
                    description: item.description ?? null,
                    price: Math.round(item.priceNumeric ?? item.listingPrice?.amount ?? 0),
                    year: item.year ?? null,
                    make: item.make ?? null,
                    model: item.model ?? null,
                    mileage: item.mileage ?? null,
                    location: item.locationText ?? null,
                  })
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

              // Preserve any cars that were beyond the quota (unscored, still inserted)
              scoredCars = [...scoringResults, ...cars.slice(remainingAiCalls)]

              const scoredCount = scoringResults.filter((s) => s.dealScore != null).length
              console.log(`[SCORER] Scored ${scoredCount}/${toScore.length} listings`)

              if (scoredCount > 0) {
                // Persist increment to DB and in-memory
                userScrapeCounts.set(`ai_${search.userId}`, currentAiCalls + scoredCount)
                await db
                  .update(users)
                  .set({ aiCallsThisMonth: sql`ai_calls_this_month + ${scoredCount}` })
                  .where(eq(users.id, search.userId))
              }
            }
          } else if (!enableScoring) {
            console.log(`[SCORER] Skipping — ${plan.name} plan does not include deal scoring`)
          }

          // Strip the temporary _classification before building insert rows
          const toInsert = scoredCars.map(({ _classification, ...rest }) => rest)

          // ── Insert ────────────────────────────────────────────────────────────
          let inserted: (typeof listings.$inferSelect)[] = []

          if (toInsert.length > 0) {
            const mappedRows = toInsert.map((item) => ({
              searchId: search.id,
              externalId: item.id,
              title:
                item.title && !item.title.startsWith('$')
                  ? item.title
                  : `Car listing in ${item.locationText || 'your area'}`,
              description: item.description ?? null,
              price: Math.round(item.priceNumeric || item.listingPrice?.amount || 0),
              year: item.year ?? null,
              make: item.make ?? null,
              model: item.model ?? null,
              mileage: null,
              location: item.locationText || null,
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
              provider: providerId,
              alerted: false,
            }))

            inserted = await db
              .insert(listings)
              .values(mappedRows)
              .onConflictDoNothing()
              .returning()

            console.log('[CRON] Net-new inserts:', inserted.length, '(duplicates skipped)')
          }

          // ── Persist stats ─────────────────────────────────────────────────────
          await persistStats({
            afterPrice: priced.length,
            afterLocation: located.length,
            afterJunk: clean.length,
            afterBlacklist: final.length,
            afterClassifier: cars.length,
            newlyInserted: inserted.length,
          })
          console.log(
            `[SCORER] Summary: ${scoredCars.filter((s) => s.dealScore != null).length} scored` +
            ` of ${cars.length} cars inserted`,
          )

          if (inserted.length > 0) {
            if (plan.emailMode === 'instant') {
              await sendDealAlert(search.userEmail, search.name, inserted)
              console.log('[CRON] Email sent to:', search.userEmail)
            } else {
              console.log('[CRON] digest_daily mode — email queued for daily batch')
            }
            totalNewListings += inserted.length
          }

          if (!providersRun.includes(providerId)) providersRun.push(providerId)
        }
      } catch (err) {
        console.error(`[CRON] Error — provider: ${providerId}, search: ${search.id}`, err)
      }
    }
  }

  return { inserted: totalNewListings, stats: lastStats, providersRun }
}
