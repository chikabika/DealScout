// ─── Types ────────────────────────────────────────────────────────────────────

type ListingRow = {
  title: string
  price: number
  url: string
  image: string | null
  location: string | null
}

export type DigestGroup = {
  searchName: string
  searchId: string
  listings: Array<{
    title: string
    price: number
    location: string | null
    url: string
    image: string | null
    year: number | null
    mileage: number | null
  }>
}

// ─── sendDealAlert ────────────────────────────────────────────────────────────

export async function sendDealAlert(
  toEmail: string,
  searchName: string,
  newListings: ListingRow[],
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL

  if (!apiKey || !senderEmail) {
    console.warn('[email] BREVO_API_KEY or SENDER_EMAIL not set — skipping alert')
    return
  }

  const count = newListings.length
  const preview = newListings.slice(0, 5)

  const listingsHtml = preview
    .map(
      (l) => `
      <tr style="border-bottom:1px solid #27272a;">
        <td style="padding:12px 8px;">
          ${l.image ? `<img src="${escape(l.image)}" width="64" height="48" style="border-radius:6px;object-fit:cover;" alt="" />` : '<div style="width:64px;height:48px;background:#27272a;border-radius:6px;"></div>'}
        </td>
        <td style="padding:12px 8px;color:#e4e4e7;font-size:14px;">${escape(l.title)}</td>
        <td style="padding:12px 8px;color:#34d399;font-size:14px;font-weight:600;white-space:nowrap;">
          ${l.price > 0 ? `$${l.price.toLocaleString()}` : 'Free'}
        </td>
        <td style="padding:12px 8px;color:#71717a;font-size:13px;">${escape(l.location)}</td>
        <td style="padding:12px 8px;">
          <a href="${escape(l.url)}" style="background:#059669;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">View →</a>
        </td>
      </tr>`,
    )
    .join('')

  const moreNote =
    count > 5
      ? `<p style="color:#71717a;font-size:13px;margin-top:12px;">…and ${count - 5} more listing${count - 5 === 1 ? '' : 's'}.</p>`
      : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#09090b;font-family:system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#ffffff;">DealScout</span>
    </div>

    <div style="background:#18181b;border-radius:12px;padding:24px;border:1px solid #27272a;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;">
        🚗 ${count} new deal${count === 1 ? '' : 's'} found
      </h1>
      <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;">
        Search: <strong style="color:#e4e4e7;">${escape(searchName)}</strong>
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #3f3f46;">
            <th style="padding:8px;width:72px;"></th>
            <th style="padding:8px;text-align:left;color:#71717a;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;">Title</th>
            <th style="padding:8px;text-align:left;color:#71717a;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;">Price</th>
            <th style="padding:8px;text-align:left;color:#71717a;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;">Location</th>
            <th style="padding:8px;width:80px;"></th>
          </tr>
        </thead>
        <tbody>${listingsHtml}</tbody>
      </table>
      ${moreNote}
    </div>

    <p style="margin-top:16px;color:#52525b;font-size:12px;text-align:center;">
      You're receiving this because you have an active DealScout search.
    </p>
  </div>
</body>
</html>`

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'DealScout', email: senderEmail },
      to: [{ email: toEmail }],
      subject: `🚗 ${count} new deal${count === 1 ? '' : 's'} found — ${searchName}`,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[email] Brevo send failed:', res.status, text)
  }
}

// ─── sendDailyDigest ──────────────────────────────────────────────────────────

export async function sendDailyDigest(params: {
  to: string
  userName: string | null
  groups: DigestGroup[]
  totalListings: number
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL
  if (!apiKey || !senderEmail) {
    console.warn('[email] Brevo not configured — skipping digest')
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dealscout.com'
  const firstName = params.userName ? params.userName.split(' ')[0] : null
  const greeting = firstName ? `Hi ${escape(firstName)},` : 'Hi there,'
  const totalShown = params.groups.reduce((sum, g) => sum + g.listings.length, 0)

  const moreNote =
    params.totalListings > totalShown
      ? `<p style="font-size:13px;color:#a1a1aa;margin:8px 0 16px;">
           Showing top ${totalShown} of ${params.totalListings} new listings —
           <a href="${appUrl}/dashboard/listings" style="color:#10b981;text-decoration:none;">see all on the dashboard →</a>
         </p>`
      : ''

  const groupsHtml = params.groups
    .map(
      (g) => `
    <div style="margin:24px 0;">
      <h2 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 12px;padding-left:10px;border-left:3px solid #10b981;">
        ${escape(g.searchName)}
        <span style="font-weight:400;color:#71717a;font-size:14px;"> · ${g.listings.length} new</span>
      </h2>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        ${g.listings
          .map(
            (l) => `
          <tr style="border-bottom:1px solid #27272a;">
            <td style="padding:10px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <td style="width:100px;vertical-align:top;">
                    ${
                      l.image
                        ? `<img src="${escape(l.image)}" alt="" width="92" height="69"
                             style="display:block;border-radius:6px;object-fit:cover;width:92px;height:69px;" />`
                        : `<div style="width:92px;height:69px;background:#27272a;border-radius:6px;"></div>`
                    }
                  </td>
                  <td style="padding-left:12px;vertical-align:top;">
                    <div style="font-size:14px;font-weight:500;color:#f4f4f5;line-height:1.4;margin-bottom:3px;">
                      ${escape(l.title)}
                    </div>
                    <div style="font-size:12px;color:#71717a;margin-bottom:7px;">
                      ${[
                        l.location ? escape(l.location) : null,
                        l.year     ? String(l.year)    : null,
                        l.mileage  ? `${l.mileage.toLocaleString()} mi` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <span style="font-size:16px;font-weight:700;color:#10b981;">
                            $${l.price.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <a href="${escape(l.url)}"
                             style="font-size:12px;color:#10b981;text-decoration:none;
                                    border:1px solid #10b981;border-radius:5px;padding:3px 8px;">
                            View →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`,
          )
          .join('')}
      </table>
    </div>`,
    )
    .join('')

  const subject =
    `🚗 ${params.totalListings} new car deal${params.totalListings === 1 ? '' : 's'} found for you`

  const htmlContent = `
<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#09090b;">
    <tr><td align="center" style="padding:40px 16px;">
      <table cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;background:#18181b;border-radius:12px;overflow:hidden;border:1px solid #27272a;">
        <tr><td style="padding:32px;">

          <!-- Header -->
          <div style="margin-bottom:4px;">
            <span style="font-size:20px;font-weight:700;color:#fff;">DealScout</span>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 4px;">🚗 Your Daily Deal Digest</h1>
          <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px;">
            ${greeting} here's what DealScout found for you in the last 24 hours.
          </p>

          ${moreNote}
          ${groupsHtml}

          <!-- Upgrade CTA -->
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #27272a;">
            <p style="font-size:13px;color:#a1a1aa;margin:0 0 14px;">
              <strong style="color:#f4f4f5;">Want instant alerts?</strong>
              Upgrade to Pro for 30-minute polling and notifications the moment a new deal appears.
            </p>
            <a href="${appUrl}/pricing"
               style="display:inline-block;background:#10b981;color:#fff;padding:10px 20px;
                      border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
              Upgrade to Pro →
            </a>
          </div>

          <!-- Footer -->
          <p style="font-size:11px;color:#52525b;margin:28px 0 0;text-align:center;line-height:1.6;">
            You're receiving this because you have an active DealScout Free account.<br />
            <a href="${appUrl}/dashboard" style="color:#71717a;text-decoration:none;">Go to dashboard</a>
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: 'DealScout' },
      to: [{ email: params.to, name: params.userName ?? undefined }],
      subject,
      htmlContent,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[email] Digest send failed:', res.status, errBody)
    throw new Error(`Brevo digest failed: ${res.status}`)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escape HTML special chars to prevent injection from user-controlled strings. */
function escape(s: string | null | undefined): string {
  if (s == null) return ''
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )
}
