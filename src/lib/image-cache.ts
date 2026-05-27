/**
 * Cloudinary image cache helper
 *
 * Free-tier Cloudinary limits (as of 2025):
 *   - 25 GB managed storage
 *   - 25 GB monthly bandwidth
 *   - No credit card required to sign up
 *
 * Upgrade only needed if you exceed those limits.
 * Sign up at https://cloudinary.com (free, no credit card).
 *
 * Strategy (three attempts, tried in order by cacheImageSmart)
 * ─────────────────────────────────────────────────────────────
 * 1. `cacheImage`            — tells Cloudinary to fetch the URL directly, passing
 *                              a Facebook crawler UA via the `headers` upload option.
 *                              Fast and free (no egress from our server).
 *                              Works for open scontent-*.fbcdn.net URLs.
 *
 * 2. `cacheImageViaDownload` — our server downloads the bytes with a crawler UA
 *                              (+ Referer: facebook.com) and POSTs the binary to
 *                              Cloudinary as a base64 data URI.
 *                              Works for lookaside.fbsbx.com and most scontent URLs.
 *
 *                              If that still returns 403 for an scontent URL, it also
 *                              tries a third sub-attempt via the lookaside/crawler/media
 *                              endpoint, which accepts a numeric photo ID and bypasses
 *                              the expiring signature entirely.
 *
 * 3. `cacheImageSmart`       — orchestrates 1 → 2 with appropriate logging.
 *                              Always use this in application code.
 */

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
})

// Public_id safe chars: letters, digits, underscores, hyphens
function safeId(externalId: string): string {
  return externalId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

const FACEBOOK_CRAWLER_UA =
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

// Shared Cloudinary upload options (applied to both code paths)
function uploadOptions(externalId: string) {
  return {
    folder: 'dealscout/listings',
    // Idempotent: re-uploading the same externalId overwrites the existing asset
    public_id: safeId(externalId),
    overwrite: true,
    resource_type: 'image' as const,
    // Auto-select best format (WebP / AVIF) per requesting browser
    fetch_format: 'auto',
    // Good quality/size balance — free-tier friendly
    quality: 'auto:good',
    // Resize to max 800 px wide, never upscale
    transformation: [{ width: 800, crop: 'limit' }],
  }
}

/**
 * Ask Cloudinary to fetch `facebookUrl` directly and store it.
 * Passes a Facebook crawler User-Agent via the `headers` upload option so
 * Facebook serves the image bytes rather than an HTML login wall.
 *
 * Returns `null` on any failure — caller should try `cacheImageViaDownload`.
 */
export async function cacheImage(
  facebookUrl: string | null,
  externalId: string,
): Promise<string | null> {
  if (!facebookUrl) return null

  try {
    const result = await cloudinary.uploader.upload(facebookUrl, {
      ...uploadOptions(externalId),
      // Tell Cloudinary to include this header when it fetches the remote URL.
      // Format: "HeaderName: value" — multiple headers separated by "\n".
      // Typed as `unknown` because the Cloudinary TS types omit this field,
      // but it is fully supported by the API.
      ...({ headers: `User-Agent: ${FACEBOOK_CRAWLER_UA}` } as unknown as object),
    })
    return result.secure_url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(
      '[CLOUDINARY] Direct upload failed for', externalId,
      '\n  url:', facebookUrl,      // full URL — not truncated
      '\n  err:', msg,
    )
    return null
  }
}

/**
 * Our server downloads the image bytes using a Facebook crawler User-Agent and
 * uploads the binary (as a base64 data URI) to Cloudinary.
 *
 * Falls back to the lookaside/crawler/media endpoint if an scontent.fbcdn.net
 * URL returns 403 — that endpoint accepts a numeric photo ID and bypasses
 * expiring URL signatures entirely.
 *
 * Returns `null` only when all download attempts fail.
 */
export async function cacheImageViaDownload(
  facebookUrl: string | null,
  externalId: string,
): Promise<string | null> {
  if (!facebookUrl) return null

  // ── Inner helper: fetch bytes with crawler UA ─────────────────────────────
  const tryDownload = async (url: string): Promise<Buffer | null> => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': FACEBOOK_CRAWLER_UA,
          'Accept': 'image/avif,image/webp,image/png,image/jpeg,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.facebook.com/',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      })

      if (!res.ok) {
        console.warn('[CACHE] Download failed', res.status, '→', url) // full URL
        return null
      }

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.startsWith('image/')) {
        console.warn('[CACHE] Not an image, content-type:', contentType, '→', url)
        return null
      }

      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      console.warn('[CACHE] Fetch threw', e instanceof Error ? e.message : e, '→', url)
      return null
    }
  }

  // ── Attempt 1: URL as given ───────────────────────────────────────────────
  let buffer = await tryDownload(facebookUrl)

  // ── Attempt 2: lookaside/crawler/media fallback for scontent 403s ─────────
  // When an scontent.fbcdn.net URL returns 403 (expired signature), the
  // lookaside endpoint accepts just the numeric photo ID and always serves
  // the image to crawler UAs — no signature required.
  if (!buffer && facebookUrl.includes('scontent') && facebookUrl.includes('fbcdn.net')) {
    // Extract the numeric photo ID from path segments like:
    //   /v/t39.30808-6/12345678901_...  or  /12345678901_...
    const photoIdMatch = facebookUrl.match(/\/(\d{10,})_/)
    if (photoIdMatch) {
      const lookasideUrl =
        `https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=${photoIdMatch[1]}`
      console.log('[CACHE] scontent 403 — falling back to lookaside →', lookasideUrl)
      buffer = await tryDownload(lookasideUrl)
    }
  }

  if (!buffer) return null

  // ── Upload binary to Cloudinary ───────────────────────────────────────────
  try {
    // Use image/jpeg as the declared type — Cloudinary re-encodes anyway via
    // fetch_format: 'auto', so the declared type only affects the upload path.
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`
    const result = await cloudinary.uploader.upload(base64, uploadOptions(externalId))
    return result.secure_url
  } catch (e) {
    console.error(
      '[CACHE] Cloudinary upload failed for', externalId,
      e instanceof Error ? e.message : e,
    )
    return null
  }
}

/**
 * Smart wrapper — always use this in application code.
 *
 * 1. Tries `cacheImage` (Cloudinary fetches directly — fast, no server egress).
 * 2. If that fails, falls back to `cacheImageViaDownload`, which also has a
 *    built-in sub-fallback to the lookaside endpoint for expired scontent URLs.
 *
 * Returns `null` only when all strategies are exhausted.
 */
export async function cacheImageSmart(
  facebookUrl: string | null,
  externalId: string,
): Promise<string | null> {
  if (!facebookUrl) return null

  // Detect crawler-protected URLs upfront for monitoring
  if (facebookUrl.includes('lookaside.fbsbx.com')) {
    console.log('[CACHE] Detected crawler-protected URL, skipping direct upload for', externalId)
    // Skip straight to download path — direct Cloudinary fetch will always fail
    return cacheImageViaDownload(facebookUrl, externalId)
  }

  const direct = await cacheImage(facebookUrl, externalId)
  if (direct) return direct

  console.log('[CACHE] Direct upload failed, trying download fallback for', externalId)
  return cacheImageViaDownload(facebookUrl, externalId)
}
