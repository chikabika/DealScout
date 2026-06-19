import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'admin@cardealalerts.com'
const MIN_SUBMIT_MS = 3000

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL

  if (!apiKey || !senderEmail) {
    console.warn('[free-sample-alerts] BREVO_API_KEY or SENDER_EMAIL not set')
    return NextResponse.json({ success: false, message: 'Email service not configured.' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot check
  if (body.website) {
    return NextResponse.json({ success: true })
  }

  // Minimum submit time check
  const submittedAt = typeof body.submittedAt === 'number' ? body.submittedAt : 0
  if (Date.now() - submittedAt < MIN_SUBMIT_MS) {
    return NextResponse.json({ success: false, message: 'Submission too fast. Please try again.' }, { status: 400 })
  }

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const cityOrZip = typeof body.cityOrZip === 'string' ? body.cityOrZip.trim() : ''
  const buyerType = typeof body.buyerType === 'string' ? body.buyerType.trim() : ''
  const vehiclesWanted = typeof body.vehiclesWanted === 'string' ? body.vehiclesWanted.trim() : ''
  const maxBudget = typeof body.maxBudget === 'string' ? body.maxBudget.trim() : ''
  const searchDistance = typeof body.searchDistance === 'string' ? body.searchDistance.trim() : ''
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

  // Required field validation
  const missing: string[] = []
  if (!fullName) missing.push('Full Name')
  if (!email) missing.push('Email Address')
  if (!cityOrZip) missing.push('City or ZIP Code')
  if (!buyerType) missing.push('Buyer Type')
  if (!vehiclesWanted) missing.push('Vehicles Wanted')

  if (missing.length > 0) {
    return NextResponse.json({ success: false, message: `Missing required fields: ${missing.join(', ')}.` }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 })
  }

  const submissionTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#09090b;font-family:system-ui,sans-serif;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#18181b;border-radius:12px;padding:28px;border:1px solid #27272a;">
    <h1 style="margin:0 0 20px;font-size:20px;color:#fff;">New Free Sample Alert Request</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;width:140px;">Full Name</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(fullName)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">Email Address</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(email)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">City / ZIP Code</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(cityOrZip)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">Buyer Type</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(buyerType)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">Vehicles Wanted</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(vehiclesWanted)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">Max Budget</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(maxBudget) || '—'}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">Search Distance</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(searchDistance) || '—'}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #27272a;color:#71717a;font-size:13px;">Notes</td><td style="padding:10px 0 10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">${esc(notes) || '—'}</td></tr>
      <tr><td style="padding:10px 0;color:#71717a;font-size:13px;">Submitted</td><td style="padding:10px 0 10px 12px;color:#e4e4e7;font-size:14px;">${esc(submissionTime)} ET</td></tr>
    </table>
  </div>
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
      sender: { name: 'CarDealAlerts', email: senderEmail },
      to: [{ email: ADMIN_EMAIL }],
      replyTo: { email: email, name: fullName },
      subject: 'New Free Sample Alert Request - CarDealAlerts',
      htmlContent,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[free-sample-alerts] Brevo send failed:', res.status, errBody)
    return NextResponse.json({ success: false, message: 'Failed to send request. Please try again or email us directly.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
