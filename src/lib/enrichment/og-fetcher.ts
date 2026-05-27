export type OgData = {
  title: string | null
  description: string | null
  image: string | null
  fetchedOk: boolean
}

// Facebook serves richer meta to known crawlers — try several
const USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
]

/**
 * Normalise a Facebook *listing* URL for fetching — strips tracking query
 * params and canonicalises the path to /marketplace/item/{id}/.
 *
 * IMPORTANT: this function is ONLY called on listing page URLs passed to
 * tryFetch(). It is NEVER called on image URLs extracted from og:image — those
 * must be returned verbatim (query strings contain auth signatures and are
 * critical for the URL to work).
 */
function cleanUrl(url: string): string {
  try {
    const u = new URL(url)
    const m = u.pathname.match(/^\/marketplace\/item\/(\d+)/)
    if (m) return `https://www.facebook.com/marketplace/item/${m[1]}/`
    return u.origin + u.pathname
  } catch {
    return url
  }
}

/**
 * Decode HTML entities found inside meta-tag content attributes.
 *
 * Critical for image URLs: Facebook encodes `&` as `&amp;` in attribute
 * values, so the query-string parameters (auth signature, `oh=`, `oe=`, etc.)
 * arrive as `amp;oh=` / `amp;oe=` without this decode → every download 403s.
 *
 * Also handles numeric entities (&#x…; and &#…;) that appear in titles,
 * descriptions, and occasionally in URL fragments.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Numeric hex entities: &#xB7; &#x2019; etc.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    // Numeric decimal entities: &#183; &#8217; etc.
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

async function tryFetch(url: string, userAgent: string): Promise<OgData> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { title: null, description: null, image: null, fetchedOk: false }

    const html = await res.text()

    const match = (prop: string): string | null => {
      // Try property= first (standard OG), then name= (some FB pages use this)
      const re1 = new RegExp(`<meta\\s+property=["']og:${prop}["']\\s+content=["']([^"']*)["']`, 'i')
      const re2 = new RegExp(`<meta\\s+name=["']og:${prop}["']\\s+content=["']([^"']*)["']`, 'i')
      const raw = html.match(re1)?.[1] || html.match(re2)?.[1] || null
      if (!raw) return null
      // Decode HTML entities — critical for image URLs whose query strings
      // contain & separators encoded as &amp; in HTML attribute values.
      // Also handles &#xB7;, &#183;, etc. that appear in titles/descriptions.
      return decodeEntities(raw)
    }

    const title = match('title')
    const description = match('description')
    const image = match('image') || match('image:secure_url')

    // Reject generic fallback values (login wall, generic FB page, etc.)
    const isGeneric =
      !title ||
      title.toLowerCase().includes('facebook') ||
      title.toLowerCase() === 'log in' ||
      title.toLowerCase() === 'log into facebook'

    // Even on a generic page, preserve whatever image we found — the caller
    // may have already collected a better image from a prior UA attempt.
    if (isGeneric) return { title: null, description: null, image, fetchedOk: true }

    return { title, description, image, fetchedOk: true }
  } catch {
    return { title: null, description: null, image: null, fetchedOk: false }
  }
}

export async function fetchOgData(url: string): Promise<OgData> {
  const cleaned = cleanUrl(url)

  for (const ua of USER_AGENTS) {
    const result = await tryFetch(cleaned, ua)
    if (result.title) return result
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))
  }

  return { title: null, description: null, image: null, fetchedOk: false }
}

export function parseTitle(title: string): {
  year: number | null
  make: string | null
  model: string | null
} {
  const m = title.match(/^(\d{4})\s+(\S+)\s+(.+)$/)
  if (!m) return { year: null, make: null, model: null }

  const year = parseInt(m[1])
  if (year < 1950 || year > new Date().getFullYear() + 1) {
    return { year: null, make: null, model: null }
  }

  return { year, make: m[2], model: m[3].trim() }
}
