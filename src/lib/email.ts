type ListingRow = {
  title: string
  price: number
  url: string
  image: string | null
  location: string | null
}

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
          ${l.image ? `<img src="${l.image}" width="64" height="48" style="border-radius:6px;object-fit:cover;" alt="" />` : '<div style="width:64px;height:48px;background:#27272a;border-radius:6px;"></div>'}
        </td>
        <td style="padding:12px 8px;color:#e4e4e7;font-size:14px;">${l.title}</td>
        <td style="padding:12px 8px;color:#34d399;font-size:14px;font-weight:600;white-space:nowrap;">
          ${l.price > 0 ? `$${l.price.toLocaleString()}` : 'Free'}
        </td>
        <td style="padding:12px 8px;color:#71717a;font-size:13px;">${l.location ?? ''}</td>
        <td style="padding:12px 8px;">
          <a href="${l.url}" style="background:#059669;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">View →</a>
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
        Search: <strong style="color:#e4e4e7;">${searchName}</strong>
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
