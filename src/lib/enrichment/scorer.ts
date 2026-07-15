/**
 * AI deal scorer — Pro/Dealer only
 *
 * Uses Claude Sonnet via the Anthropic API to analyse each listing and produce:
 *   • dealScore      0-100 (100 = steal, 50 = fair, <20 = avoid)
 *   • estimatedValue USD fair market value
 *   • savings        estimatedValue - askPrice (negative = overpriced)
 *   • conditionRating excellent | good | fair | poor | unknown
 *   • conditionNotes 2-4 short observations from the photo
 *   • redFlags       warning signs (rust, salvage hints, suspiciously low price, etc.)
 *   • summary        one sentence ≤ 100 chars
 *
 * Cost: ~$0.005/listing at Sonnet pricing.
 * Guard: callers should check plan.maxAiCallsPerMonth before invoking.
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
// Scoring is the paid-plan quality feature, so it runs on Sonnet.
// Override with ANTHROPIC_SCORER_MODEL_ID (or the shared ANTHROPIC_MODEL_ID).
// `||` (not `??`) so the empty-string default from next.config env still
// falls through to the code default.
const SCORER_MODEL_ID   =
  process.env.ANTHROPIC_SCORER_MODEL_ID ||
  process.env.ANTHROPIC_MODEL_ID ||
  'claude-sonnet-4-5'

const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

if (!client) {
  console.warn('[SCORER] ANTHROPIC_API_KEY missing — Pro deal scoring will be skipped')
} else {
  console.log(`[SCORER] Anthropic ready — ${SCORER_MODEL_ID}`)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealScore = {
  dealScore: number
  estimatedValue: number
  savings: number               // estimatedValue - askPrice (can be negative)
  conditionRating: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  conditionNotes: string[]
  redFlags: string[]
  summary: string
}

// ─── Image helper (same approach as classifier) ───────────────────────────────

async function imageToBase64(url: string): Promise<{
  data: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
} | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 CarDealAlerts/1.0' },
    })
    if (!res.ok) return null

    const ct = (res.headers.get('content-type') ?? 'image/jpeg').toLowerCase()
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
    if (ct.includes('png'))  mediaType = 'image/png'
    else if (ct.includes('webp')) mediaType = 'image/webp'
    else if (ct.includes('gif'))  mediaType = 'image/gif'

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > 5 * 1024 * 1024) return null   // Anthropic API 5 MB/image limit

    return { data: buf.toString('base64'), mediaType }
  } catch {
    return null
  }
}

// ─── Scorer ───────────────────────────────────────────────────────────────────

export type ScoreInput = {
  imageUrl: string | null
  title: string
  description: string | null
  price: number
  year: number | null
  make: string | null
  model: string | null
  mileage: number | null
  location: string | null
}

export async function scoreDeal(
  input: ScoreInput,
  modelId?: string,
): Promise<DealScore | null> {
  if (!client) return null
  if (!input.imageUrl) return null

  const model = modelId ?? SCORER_MODEL_ID

  const img = await imageToBase64(input.imageUrl)
  if (!img) return null

  try {
    const res = await client.messages.create({
      model,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: img.mediaType, data: img.data },
            },
            {
              type: 'text',
              text: `You are a used-car deal analyzer for the US market. Analyze this Facebook Marketplace listing.

Listing:
- Title: ${input.title}
- Year/Make/Model: ${input.year ?? '?'} ${input.make ?? '?'} ${input.model ?? '?'}
- Asking price: $${input.price.toLocaleString()}
- Mileage: ${input.mileage ? input.mileage.toLocaleString() + ' mi' : 'unknown'}
- Location: ${input.location ?? 'unknown'}
- Description: ${input.description?.slice(0, 600) ?? '(none)'}

Based on the photo and details, estimate fair market value and rate this as a deal.

Return JSON ONLY (no markdown, no code fences):
{
  "dealScore": 0-100 (100 = exceptional steal, 70+ = great deal, 50 = fair price, 30 = overpriced, <20 = avoid),
  "estimatedValue": your USD estimate of true market value,
  "conditionRating": "excellent|good|fair|poor|unknown",
  "conditionNotes": ["2-4 short observations from the photo"],
  "redFlags": ["any warning signs — rust, accident damage, parts-grade, dealer photo without VIN, unusually low price, salvage title hints, etc. Empty array if none."],
  "summary": "ONE sentence under 100 chars summarizing the deal"
}`,
            },
          ],
        },
      ],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Omit<DealScore, 'savings'>
    return {
      ...parsed,
      savings: Math.round(parsed.estimatedValue - input.price),
    }
  } catch (e) {
    console.error('[SCORER] Anthropic call failed:', e instanceof Error ? e.message : e)
    return null
  }
}
