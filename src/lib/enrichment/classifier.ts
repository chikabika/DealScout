/**
 * AI-powered listing classifier
 *
 * Uses Claude via the Anthropic API to verify that a listing actually shows a
 * passenger car/SUV/truck/van — filtering out motorcycles, boats, ATVs, RVs,
 * trailers, and parts-only listings that slip through the keyword filter.
 *
 * Two-stage approach:
 *   1. Free text-based keyword reject (instant, no API call)
 *   2. Vision-based classification (image inlined as base64)
 *
 * Always errs on the side of keeping listings when confidence is low or when
 * the classifier errors — better to show an edge case than silently drop a car.
 */

import Anthropic from '@anthropic-ai/sdk'

// Read env explicitly — Next.js doesn't always populate process.env the way
// tsx scripts do, and API routes can miss vars that aren't in next.config.ts.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
// Haiku 4.5 (vision-capable) — this is a cheap car/not-car check, so it runs on
// the fastest, lowest-cost tier. Deliberately NOT reading ANTHROPIC_MODEL_ID:
// that var drives the deal scorer (Sonnet) and would silently upgrade this
// call's cost. Override with ANTHROPIC_CLASSIFIER_MODEL_ID if needed.
// `||` (not `??`) so the empty-string default from next.config env still
// falls through to the code default.
const MODEL_ID          = process.env.ANTHROPIC_CLASSIFIER_MODEL_ID || 'claude-haiku-4-5'

// Log at module-load so misconfig surfaces in the dev console, not silently at runtime
if (!ANTHROPIC_API_KEY) {
  console.warn('[CLASSIFIER] ANTHROPIC_API_KEY missing from env — classifier will fall back to keep-all mode')
  console.warn('  MODEL_ID:', MODEL_ID)
} else {
  console.log('[CLASSIFIER] Anthropic ready —', MODEL_ID)
}

const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

export type Classification = {
  isCar: boolean
  vehicleType:
    | 'sedan'
    | 'suv'
    | 'truck'
    | 'coupe'
    | 'van'
    | 'hatchback'
    | 'wagon'
    | 'convertible'
    | 'motorcycle'
    | 'boat'
    | 'rv'
    | 'trailer'
    | 'atv'
    | 'parts'
    | 'other'
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

// ─── Stage 1: free text-based keyword reject ──────────────────────────────────
// Matches against obvious non-car titles before spending an API token.

const NON_CAR_KEYWORDS = [
  // motorcycles
  'motorcycle',
  'ducati',
  'harley',
  'yamaha wr',
  'yamaha r1',
  'yamaha r6',
  'kawasaki ninja',
  'suzuki gs',
  'suzuki gsx',
  'royal enfield',
  'bmw g650',
  'bmw r1',
  'bmw s1000',
  'ktm',
  'cbr',
  'cbr600',
  'cbr1000',
  'ninja zx',
  'scrambler',
  'sportster',
  'triumph speed',
  'triumph daytona',
  'triumph tiger',
  'triumph street',
  'aprilia',
  'moto guzzi',
  'vespa',
  'piaggio',
  // boats
  'seabird',
  'islander 36',
  'sailboat',
  'yacht',
  'catamaran',
  'bayliner',
  'sea ray',
  'jet ski',
  'pontoon',
  'cuddy cabin',
  'mirromarine',
  'boston whaler',
  'fishing boat',
  // RVs / trailers
  'rv ',
  'motorhome',
  'camper',
  'travel trailer',
  'fifth wheel',
  'sea breeze',
  // ATVs
  'atv',
  'quad bike',
  'side-by-side',
  'utv',
  'polaris ranger',
  // parts
  'parts only',
  'for parts',
  'wheels only',
  'tires only',
  'engine only',
  'transmission only',
]

function textReject(title: string): Classification | null {
  const t = title.toLowerCase()

  for (const kw of NON_CAR_KEYWORDS) {
    if (t.includes(kw)) {
      const vt: Classification['vehicleType'] =
        /motorcycle|harley|ducati|cbr|ninja|scrambler|wr|gsx|r1|r6|sportster|royal enfield|g650|triumph (speed|daytona|tiger|street)|aprilia|moto guzzi|vespa|piaggio/.test(t)
          ? 'motorcycle'
          : /sailboat|yacht|catamaran|sea ray|bayliner|jet ski|pontoon|seabird|islander|cuddy cabin|mirromarine|boston whaler|fishing boat/.test(t)
            ? 'boat'
            : /motorhome|camper|travel trailer|fifth wheel|sea breeze/.test(t)
              ? 'rv'
              : /\batv\b|\bquad bike\b|\bside-by-side\b|\butv\b/.test(t)
                ? 'atv'
                : /parts only|for parts|wheels only|tires only|engine only|transmission only/.test(t)
                  ? 'parts'
                  : 'other'

      return {
        isCar: false,
        vehicleType: vt,
        confidence: 'high',
        reason: `title keyword match: "${kw}"`,
      }
    }
  }

  return null
}

// ─── Image fetcher ────────────────────────────────────────────────────────────
// We download the image server-side and base64-encode it. (The Anthropic API
// also accepts URL sources, but many Facebook CDN URLs expire or block
// hotlinking, so fetching once and inlining is more reliable.)

async function imageToBase64(url: string): Promise<{
  data: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
} | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 CarDealAlerts/1.0' },
    })
    if (!res.ok) {
      console.warn('[CLASSIFIER] image fetch returned', res.status, 'for', url.slice(0, 80))
      return null
    }

    const contentType = (res.headers.get('content-type') ?? 'image/jpeg').toLowerCase()
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
    if (contentType.includes('png'))  mediaType = 'image/png'
    else if (contentType.includes('webp')) mediaType = 'image/webp'
    else if (contentType.includes('gif'))  mediaType = 'image/gif'

    const buf = Buffer.from(await res.arrayBuffer())

    // The Anthropic API has a ~5 MB limit per image
    if (buf.length > 5 * 1024 * 1024) {
      console.warn('[CLASSIFIER] image too large for the Anthropic API:', buf.length, 'bytes — skipping vision')
      return null
    }

    return { data: buf.toString('base64'), mediaType }
  } catch (e) {
    console.warn('[CLASSIFIER] image fetch failed:', e instanceof Error ? e.message : e)
    return null
  }
}

// ─── Stage 2: vision classification via the Anthropic API ─────────────────────

export async function classifyListing(input: {
  imageUrl: string | null
  title: string
  price: number
  location: string | null
}): Promise<Classification> {
  // Stage 1 — free text reject
  const textResult = textReject(input.title)
  if (textResult) return textResult

  // No image → keep the listing (can't reject without visual evidence)
  if (!input.imageUrl) {
    return { isCar: true, vehicleType: 'other', confidence: 'low', reason: 'no_image_keeping' }
  }

  // No Anthropic API key → keep the listing
  if (!client) {
    return { isCar: true, vehicleType: 'other', confidence: 'low', reason: 'no_anthropic_api_key' }
  }

  // Fetch the image and inline it as base64 (see imageToBase64 note above)
  const img = await imageToBase64(input.imageUrl)
  if (!img) {
    return { isCar: true, vehicleType: 'other', confidence: 'low', reason: 'image_fetch_failed_keeping' }
  }

  try {
    const res = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: img.mediaType,
                data: img.data,
              },
            },
            {
              type: 'text',
              text: `Facebook Marketplace listing. Title: "${input.title}". Price: $${input.price}. Location: ${input.location ?? 'unknown'}.

Look at the photo. Is this a passenger CAR/SUV/TRUCK/VAN that someone can drive?

NOT a car: motorcycles, scooters, ATVs, boats, jet skis, RVs, motorhomes, trailers, campers, parts/wheels/engines only, lease transfers without a car shown.

Reply as JSON only, no markdown:
{"isCar": boolean, "vehicleType": "sedan|suv|truck|coupe|van|hatchback|wagon|convertible|motorcycle|boat|rv|trailer|atv|parts|other", "confidence": "high|medium|low", "reason": "one sentence why"}`,
            },
          ],
        },
      ],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as Classification
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[CLASSIFIER] Anthropic call failed:', err.message)
    console.error('  Model:', MODEL_ID)
    if (err.message.toLowerCase().includes('auth') || err.message.toLowerCase().includes('credential') || err.message.includes('401')) {
      console.error('  → Check that ANTHROPIC_API_KEY is set in .env.local')
      console.error('  → Restart dev server after .env.local changes (Next.js caches env at startup)')
    }
    // Keep the listing — better to show an edge case than silently drop a car
    return { isCar: true, vehicleType: 'other', confidence: 'low', reason: 'anthropic_error_keeping' }
  }
}
