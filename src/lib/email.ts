const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://dealscout.app'

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
  provider: string
  listings: Array<{
    title: string
    price: number
    location: string | null
    url: string
    image: string | null
    year: number | null
    mileage: number | null
    dealScore: number | null
    aiSummary: string | null
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
      <img src="${APP_URL}/logo-dark.svg" alt="DealScout" width="130" style="display:block;height:32px;width:auto;" />
    </div>

    <div style="background:#18181b;border-radius:12px;padding:24px;border:1px solid #27272a;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;">
        ${count} new deal${count === 1 ? '' : 's'} found
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
      You're receiving this because you have an active CarDealAlerts search.
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
      sender: { name: 'CarDealAlerts', email: senderEmail },
      to: [{ email: toEmail }],
      subject: `${count} new deal${count === 1 ? '' : 's'} found — ${searchName}`,
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
  totalNewListings: number
  appUrl: string
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL
  if (!apiKey || !senderEmail) {
    console.warn('[DIGEST] Brevo not configured — skipping')
    return
  }

  const firstName = params.userName?.split(' ')[0] ?? 'there'
  const subject = `${params.totalNewListings} new deal${params.totalNewListings === 1 ? '' : 's'} found for you today`

  function esc(s: string | null | undefined): string {
    if (!s) return ''
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function scoreBadge(score: number | null): string {
    if (!score) return ''
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#71717a'
    const emoji = score >= 80 ? '🔥' : score >= 60 ? '👍' : ''
    return `<span style="display:inline-block;background:${color}20;color:${color};border:1px solid ${color}40;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:600;margin-left:6px;">${score}/100 ${emoji}</span>`
  }

  const groupsHtml = params.groups.map((g) => {
    const listingsHtml = g.listings.map((l) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="96" style="vertical-align:top;padding-right:12px;">
                ${l.image
                  ? `<img src="${esc(l.image)}" width="96" height="72" style="display:block;border-radius:6px;object-fit:cover;width:96px;height:72px;" referrerpolicy="no-referrer" />`
                  : `<div style="width:96px;height:72px;background:#27272a;border-radius:6px;"></div>`
                }
              </td>
              <td style="vertical-align:top;">
                <div style="font-size:14px;font-weight:500;color:#f4f4f5;line-height:1.4;margin-bottom:3px;">
                  ${esc(l.title)}${scoreBadge(l.dealScore)}
                </div>
                <div style="font-size:12px;color:#71717a;margin-bottom:6px;">
                  ${l.location ? `📍 ${esc(l.location)}` : ''}
                  ${l.year ? ` · ${l.year}` : ''}
                  ${l.mileage ? ` · ${l.mileage.toLocaleString()} mi` : ''}
                </div>
                ${l.aiSummary ? `<div style="font-size:11px;color:#a1a1aa;font-style:italic;margin-bottom:6px;">${esc(l.aiSummary)}</div>` : ''}
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:18px;font-weight:700;color:#10b981;">$${l.price.toLocaleString()}</span>
                  <a href="${esc(l.url)}" style="font-size:12px;color:#10b981;text-decoration:none;font-weight:500;">View listing →</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')

    const providerLabel = g.provider === 'facebook' ? '📘 Facebook Marketplace' : g.provider === 'craigslist' ? '🪧 Craigslist' : g.provider

    return `
      <div style="margin:20px 0;">
        <div style="margin-bottom:10px;">
          <span style="font-size:15px;font-weight:600;color:#f4f4f5;">${esc(g.searchName)}</span>
          <span style="font-size:12px;color:#71717a;margin-left:8px;">${providerLabel} · ${g.listings.length} new</span>
        </div>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${listingsHtml}
        </table>
      </div>
    `
  }).join('<hr style="border:none;border-top:1px solid #27272a;margin:4px 0;" />')

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#09090b;">
    <tr><td align="center" style="padding:32px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

        <tr><td style="background:#18181b;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:1px solid #27272a;">
          <img src="${APP_URL}/logo-dark.svg" alt="DealScout" width="130" style="display:block;height:32px;width:auto;" />
          <div style="font-size:13px;color:#71717a;margin-top:8px;">Your daily car deal digest</div>
        </td></tr>

        <tr><td style="background:#18181b;padding:20px 28px 0;">
          <h2 style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Hi ${esc(firstName)},</h2>
          <p style="font-size:14px;color:#a1a1aa;margin:0 0 4px;">
            Here are <strong style="color:#10b981;">${params.totalNewListings} new listing${params.totalNewListings === 1 ? '' : 's'}</strong> matching your searches from the last 24 hours.
          </p>
        </td></tr>

        <tr><td style="background:#18181b;padding:16px 28px;">
          ${groupsHtml}
        </td></tr>

        <tr><td style="background:#18181b;padding:4px 28px 24px;">
          <a href="${esc(params.appUrl)}/dashboard/listings"
             style="display:inline-block;background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
            View all deals →
          </a>
        </td></tr>

        <tr><td style="background:#18181b;border-top:1px solid #27272a;padding:20px 28px;border-radius:0 0 12px 12px;">
          <p style="font-size:13px;color:#71717a;margin:0 0 12px;">
            <strong style="color:#f4f4f5;">Want instant alerts?</strong>
            Upgrade to Pro for 30-minute polling and real-time notifications the moment a deal appears — before anyone else sees it.
          </p>
          <a href="${esc(params.appUrl)}/pricing"
             style="display:inline-block;border:1px solid #10b981;color:#10b981;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">
            Upgrade to Pro →
          </a>
          <p style="font-size:11px;color:#52525b;margin:20px 0 0;">
            You're receiving this because you have an active CarDealAlerts Free account.<br />
            <a href="${esc(params.appUrl)}/dashboard/settings" style="color:#52525b;">Manage notifications</a>
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
      sender: { email: senderEmail, name: 'CarDealAlerts' },
      to: [{ email: params.to, name: params.userName ?? undefined }],
      subject,
      htmlContent,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[DIGEST] Brevo send failed:', res.status, errBody)
    throw new Error(`Brevo digest failed: ${res.status}`)
  }

  console.log('[DIGEST] ✅ Sent to:', params.to, `(${params.totalNewListings} listings)`)
}

// ─── sendWelcomeEmail ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  name: string | null
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL
  if (!apiKey || !senderEmail) {
    console.warn('[email] BREVO_API_KEY or SENDER_EMAIL not set — skipping welcome email')
    return
  }

  const firstName = params.name?.split(' ')[0] || 'there'

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#09090b;">
    <tr><td align="center" style="padding:32px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

        <tr><td style="background:#18181b;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:1px solid #27272a;">
          <img src="${APP_URL}/logo-dark.svg" alt="DealScout" width="130" style="display:block;height:32px;width:auto;" />
        </td></tr>

        <tr><td style="background:#18181b;padding:24px 28px;">
          <h1 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 12px;">Welcome, ${escape(firstName)} 👋</h1>
          <p style="font-size:14px;color:#a1a1aa;line-height:1.6;margin:0 0 20px;">
            DealScout monitors car listings across the web for the searches you set up, scores each one with AI to flag genuine deals,
            and sends you instant alerts the moment a great match appears — so you never miss out.
          </p>

          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="${escape(APP_URL)}/dashboard"
                   style="display:inline-block;background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
                  Go to Dashboard →
                </a>
              </td>
              <td>
                <a href="${escape(APP_URL)}/pricing"
                   style="display:inline-block;border:1px solid #10b981;color:#10b981;padding:9px 18px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;">
                  Upgrade to Pro
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="background:#18181b;border-top:1px solid #27272a;padding:20px 28px;border-radius:0 0 12px 12px;">
          <p style="font-size:11px;color:#52525b;margin:0;">
            You're receiving this because you just created a DealScout account.
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
      to: [{ email: params.to, name: params.name ?? undefined }],
      subject: 'Welcome to DealScout',
      htmlContent,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[email] Welcome email send failed:', res.status, errBody)
  }
}

// ─── sendSubscriptionEmail ────────────────────────────────────────────────────

export async function sendSubscriptionEmail(params: {
  to: string
  name: string | null
  plan: 'pro' | 'dealer'
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL
  if (!apiKey || !senderEmail) {
    console.warn('[email] BREVO_API_KEY or SENDER_EMAIL not set — skipping subscription email')
    return
  }

  const firstName = params.name?.split(' ')[0] || 'there'
  const planName = params.plan === 'pro' ? 'Pro' : 'Dealer'
  const planPrice = params.plan === 'pro' ? '$49/mo' : '$149/mo'
  const features = params.plan === 'pro'
    ? ['5 searches', 'Facebook + Craigslist', 'Every 4h polling', 'Instant alerts', 'AI deal scoring']
    : ['15 searches', 'All 3 providers', 'Every 2h polling', 'Instant alerts', 'AI deal scoring']

  const featuresHtml = features
    .map((f) => `<li style="font-size:14px;color:#e4e4e7;line-height:1.8;">${escape(f)}</li>`)
    .join('')

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#09090b;">
    <tr><td align="center" style="padding:32px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

        <tr><td style="background:#18181b;border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:1px solid #27272a;">
          <img src="${APP_URL}/logo-dark.svg" alt="DealScout" width="130" style="display:block;height:32px;width:auto;" />
        </td></tr>

        <tr><td style="background:#18181b;padding:24px 28px;">
          <h1 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 12px;">Hi ${escape(firstName)},</h1>
          <p style="font-size:14px;color:#a1a1aa;line-height:1.6;margin:0 0 16px;">
            Your <strong style="color:#10b981;">DealScout ${escape(planName)}</strong> plan (${escape(planPrice)}) is now active. Here's what's included:
          </p>

          <ul style="margin:0 0 24px;padding-left:20px;">${featuresHtml}</ul>

          <a href="${escape(APP_URL)}/dashboard/searches/new"
             style="display:inline-block;background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
            Create your first search →
          </a>
        </td></tr>

        <tr><td style="background:#18181b;border-top:1px solid #27272a;padding:20px 28px;border-radius:0 0 12px 12px;">
          <p style="font-size:11px;color:#52525b;margin:0;">
            You're receiving this because you just subscribed to DealScout.
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
      to: [{ email: params.to, name: params.name ?? undefined }],
      subject: `Your DealScout ${planName} plan is active`,
      htmlContent,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[email] Subscription email send failed:', res.status, errBody)
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
