// register-request: PUBLIC endpoint for the sign-up request form. No auth — anyone can
// submit. Everything runs with the service role here so the browser never gets INSERT or
// Storage-write access. The function validates, rate-limits, stores the certificate in the
// private registration-certs bucket, inserts a registration_requests row, notifies admins,
// and emails the applicant an acknowledgement. The admin later approves/rejects it.
//
// Deploy WITHOUT JWT verification (it's public):
//   supabase functions deploy register-request --no-verify-jwt
// Secrets: RESEND_API_KEY, MEMBER_FROM_EMAIL (or INVITE_FROM_EMAIL). Optional: TURNSTILE_SECRET
// (Cloudflare Turnstile) — when set, every request must carry a valid captchaToken or it's
// rejected (fail-closed). When unset, the captcha check is skipped entirely. SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'

// Verify a Cloudflare Turnstile token against the siteverify API. Returns false on any failure
// — including a network error reaching Cloudflare — so register stays fail-closed (the honeypot
// and per-IP limit are the backstops if the captcha service itself is down).
async function verifyTurnstile(token: string, secret: string, remoteip: string | null): Promise<boolean> {
  const form = new URLSearchParams({ secret, response: token })
  if (remoteip) form.set('remoteip', remoteip)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const data = await res.json()
    return data?.success === true
  } catch (e) {
    console.error('turnstile verify error:', e)
    return false
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const STUDENT_DOMAIN = 'ifheindia.org'
const ALLOWED_TYPES = ['Founder', 'Student', 'Mentor', 'Investor', 'Network Enabler', 'Service Provider', 'Incubator', 'Other']
const CERT_MIME: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }
const MAX_CERT_BYTES = 5 * 1024 * 1024
const RATE_LIMIT_PER_HOUR = 5

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('MEMBER_FROM_EMAIL') || Deno.env.get('INVITE_FROM_EMAIL')

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }

  // Honeypot: a hidden field real users never fill. If set, pretend success and do nothing.
  // Checked before the captcha so trivial bots never cost us a siteverify round-trip.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true })

  // Captcha (Cloudflare Turnstile). Only enforced when a secret is configured, so local/dev and
  // captcha-off deployments pass straight through. Fail-closed: missing or invalid token -> 400.
  const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET')
  if (TURNSTILE_SECRET) {
    const token = typeof body.captchaToken === 'string' ? body.captchaToken : ''
    if (!token) return json({ error: 'Captcha verification required.' }, 400)
    const remoteip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null
    const ok = await verifyTurnstile(token, TURNSTILE_SECRET, remoteip)
    if (!ok) return json({ error: 'Captcha verification failed. Please try again.' }, 400)
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const memberType = String(body.member_type ?? '').trim()
  const otherText = String(body.other_text ?? '').trim()
  const cert = body.cert as { filename?: string; contentType?: string; dataBase64?: string } | null | undefined

  if (name.length < 2 || name.length > 50) return json({ error: 'Enter your full name.' }, 400)
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return json({ error: 'Enter a valid email.' }, 400)
  if (phone.length > 20) return json({ error: 'Phone number is too long.' }, 400)
  if (otherText.length > 120) return json({ error: 'That field is too long.' }, 400)
  if (!ALLOWED_TYPES.includes(memberType)) return json({ error: 'Pick what you are registering as.' }, 400)

  const isStudentDomain = email.split('@')[1] === STUDENT_DOMAIN
  if (!cert?.dataBase64 && !isStudentDomain) {
    return json({ error: 'A graduate certificate is required.' }, 400)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  // Rate limit by IP.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('registration_requests')
      .select('id', { count: 'exact', head: true })
      .eq('submit_ip', ip)
      .gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return json({ error: 'Too many requests. Try again later.' }, 429)
  }

  // Duplicate: existing account or open request.
  const { data: exists } = await admin.rpc('email_exists', { p_email: email })
  if (exists === true) return json({ error: 'This email is already registered. Try logging in instead.' }, 409)
  const { data: pending } = await admin
    .from('registration_requests')
    .select('id').eq('email', email).eq('status', 'pending').maybeSingle()
  if (pending) return json({ error: 'A request for this email is already under review.' }, 409)

  // Certificate upload (private bucket).
  let certPath: string | null = null
  if (cert?.dataBase64) {
    const ext = CERT_MIME[cert.contentType || '']
    if (!ext) return json({ error: 'Certificate must be a PDF, JPG, or PNG.' }, 400)
    let bytes: Uint8Array
    try { bytes = Uint8Array.from(atob(cert.dataBase64), (c) => c.charCodeAt(0)) }
    catch { return json({ error: 'Could not read the uploaded file.' }, 400) }
    if (bytes.byteLength === 0) return json({ error: 'The uploaded file is empty.' }, 400)
    if (bytes.byteLength > MAX_CERT_BYTES) return json({ error: 'Certificate must be 5 MB or smaller.' }, 400)
    certPath = `${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await admin.storage.from('registration-certs').upload(certPath, bytes, { contentType: cert.contentType })
    if (upErr) { console.error('cert upload failed:', upErr); return json({ error: 'Could not store the certificate. Try again.' }, 500) }
  }

  // Insert the request.
  const { error: insErr } = await admin.from('registration_requests').insert({
    name, email, phone: phone || null, member_type: memberType,
    other_text: memberType === 'Other' ? (otherText || null) : null,
    cert_path: certPath, submit_ip: ip,
  })
  if (insErr) {
    if (insErr.code === '23505') return json({ error: 'A request for this email is already under review.' }, 409)
    console.error('insert failed:', insErr)
    if (certPath) await admin.storage.from('registration-certs').remove([certPath]) // don't orphan the file
    return json({ error: 'Could not submit your request. Try again.' }, 500)
  }

  // Notify admins (best-effort).
  try { await admin.rpc('notify_admins_new_registration', { p_name: name, p_member_type: memberType }) } catch (e) { console.error('notify failed:', e) }

  // Acknowledgement email (plain text, best-effort).
  if (RESEND_API_KEY && FROM) {
    const text = `Hi ${name},

Thanks for requesting access to the ICFAI Founders Network. We've received your request and our team will review it shortly.

You'll get another email once it has been reviewed.

— ICFAI Founders Network`
    try { await sendEmail({ apiKey: RESEND_API_KEY, from: FROM, to: email, subject: 'We received your registration request', text }) }
    catch (e) { console.error('ack email failed:', e) }
  }

  return json({ ok: true })
})
