// review-registration: an admin approves or disapproves a pending registration request.
//
// Approve  -> create the auth account (random password, email_confirm), set the permission
//             role the admin picked + the member_type label, mark the request approved, and
//             email the applicant their plain-text login details + a link to the user guide.
// Disapprove -> mark the request rejected (reason audited), delete the certificate from the
//             private bucket, and email the applicant the cancellation notice.
//
// Admin-gated: the caller's JWT must resolve to profiles.role = 'admin'. Account creation +
// storage delete run with the service role.
//
// Deploy:  supabase functions deploy review-registration
// Secrets: RESEND_API_KEY, PUBLIC_SITE_URL, MEMBER_FROM_EMAIL (or INVITE_FROM_EMAIL),
//          SUPPORT_EMAIL (the "reach out to ..." address; optional, falls back to a phrase).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'
import { generatePassword } from '../_shared/password.ts'

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*', // set ALLOWED_ORIGIN secret to lock to your app domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function approveEmail(name: string, email: string, password: string, loginUrl: string, guideUrl: string) {
  const subject = 'Your ICFAI Founders Network account is ready'
  const text = `Hi ${name},

Your request to join the ICFAI Founders Network has been approved.

Sign in with these details:
  Email:    ${email}
  Password: ${password}

Sign in here: ${loginUrl}

For your security, please change this password from Settings once you have signed in.

New here? The user guide walks you through everything:
${guideUrl}

— ICFAI Founders Network`
  return { subject, text }
}

function rejectEmail(name: string, support: string) {
  const subject = 'Update on your ICFAI Founders Network registration'
  const text = `Hi ${name},

Thank you for your interest in the ICFAI Founders Network.

We couldn't validate your details, so your registration has been canceled.

If you have any further queries, reach out to ${support}.

— ICFAI Founders Network`
  return { subject, text }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const SITE_URL = (Deno.env.get('PUBLIC_SITE_URL') || '').replace(/\/$/, '')
  const FROM = Deno.env.get('MEMBER_FROM_EMAIL') || Deno.env.get('INVITE_FROM_EMAIL')
  const SUPPORT = Deno.env.get('SUPPORT_EMAIL') || 'the IFN team'

  let id: unknown, action: unknown, role: unknown, reason: unknown
  try {
    const b = await req.json()
    id = b.id; action = b.action; role = b.role; reason = b.reason
  } catch { return json({ error: 'Invalid JSON body' }, 400) }

  if (typeof id !== 'string') return json({ error: 'Missing request id' }, 400)
  if (action !== 'approve' && action !== 'reject') return json({ error: 'action must be approve or reject' }, 400)

  // Authorize: caller must be an admin.
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userErr } = await caller.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401)
  const { data: me } = await caller.from('profiles').select('role').eq('id', userData.user.id).single()
  if (me?.role !== 'admin') return json({ error: 'Not authorized' }, 403)
  const reviewerId = userData.user.id

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  // Load the pending request.
  const { data: reqRow, error: reqErr } = await admin
    .from('registration_requests').select('*').eq('id', id).eq('status', 'pending').maybeSingle()
  if (reqErr) { console.error(reqErr); return json({ error: 'Could not load the request.' }, 500) }
  if (!reqRow) return json({ error: 'Request not found or already handled.' }, 404)

  if (action === 'reject') {
    const { error: e } = await admin.from('registration_requests')
      .update({ status: 'rejected', reason: typeof reason === 'string' ? (reason.trim() || null) : null, reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), cert_path: null })
      .eq('id', id)
    if (e) { console.error(e); return json({ error: 'Could not update the request.' }, 500) }
    // Delete the certificate (we don't retain rejected applicants' documents).
    if (reqRow.cert_path) await admin.storage.from('registration-certs').remove([reqRow.cert_path])
    // Disapprove email (best-effort).
    if (RESEND_API_KEY && FROM) {
      const { subject, text } = rejectEmail(reqRow.name, SUPPORT)
      try { await sendEmail({ apiKey: RESEND_API_KEY, from: FROM, to: reqRow.email, subject, text }) }
      catch (e2) { console.error('reject email failed:', e2) }
    }
    return json({ ok: true })
  }

  // ---- approve ----
  const finalRole = (typeof role === 'string' && ['student', 'mentor', 'admin'].includes(role)) ? role : 'student'
  const password = generatePassword()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: reqRow.email, password, email_confirm: true,
  })
  if (createErr || !created?.user) {
    const msg = createErr?.message || 'Could not create the account.'
    return json({ error: /already/i.test(msg) ? 'That email already has an account.' : msg }, /already/i.test(msg) ? 409 : 400)
  }

  // Role + member_type label on the profile row (created by the new-user trigger).
  const { error: roleErr } = await admin.from('profiles')
    .update({ role: finalRole, member_type: reqRow.member_type }).eq('id', created.user.id)
  if (roleErr) { console.error('profile update failed:', roleErr); return json({ error: `Account created but role/label could not be set: ${roleErr.message}`, password }, 500) }

  // Mark the request approved.
  await admin.from('registration_requests')
    .update({ status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  // Credentials email (plain text) + guide link by role.
  const loginUrl = `${SITE_URL}/login`
  const guideUrl = `${SITE_URL}/guides/${finalRole === 'mentor' ? 'IFN-User-Guide-Plus.pdf' : 'IFN-User-Guide.pdf'}`
  let emailed = false
  if (RESEND_API_KEY && FROM) {
    const { subject, text } = approveEmail(reqRow.name, reqRow.email, password, loginUrl, guideUrl)
    try { await sendEmail({ apiKey: RESEND_API_KEY, from: FROM, to: reqRow.email, subject, text }); emailed = true }
    catch (e) { console.error('approve email failed:', e) }
  }

  return json({ ok: true, password, emailed })
})
