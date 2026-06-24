// send-invites: create invites + email the links via Resend.
//
// The SPA holds only the anon key and has no server, so email must go through
// here. This function does NOT re-implement authorization: it calls the same
// admin-guarded RPCs the client uses (admin_create_invites / admin_mark_invites_sent)
// with the *caller's* JWT, so is_admin() in Postgres is the single source of truth.
// A non-admin caller gets a 403 because the RPC raises.
//
// Deploy:  supabase functions deploy send-invites
// Secrets: supabase secrets set RESEND_API_KEY=... PUBLIC_SITE_URL=https://your-app \
//                               INVITE_FROM_EMAIL="IFN <invites@your-domain>"
// (SUPABASE_URL and SUPABASE_ANON_KEY are injected by the platform.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*', // set ALLOWED_ORIGIN secret to lock to your app domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ROLE_LABEL: Record<string, string> = { mentor: 'Mentor', admin: 'Admin', student: 'Student' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function inviteEmail(siteUrl: string, role: string, token: string) {
  const link = `${siteUrl.replace(/\/$/, '')}/register?invite=${token}`
  const roleLabel = ROLE_LABEL[role] || role
  const subject = `You're invited to the ICFAI Founders Network as a ${roleLabel}`
  // Inline styles only — email clients ignore <style>/external CSS.
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">ICFAI Founders Network</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 20px;color:#444">
      You've been invited to join as a <strong>${roleLabel}</strong>. Set up your account with the button below.
    </p>
    <a href="${link}"
       style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px">
      Accept invite
    </a>
    <p style="font-size:13px;line-height:1.5;margin:22px 0 0;color:#888">
      Or paste this link into your browser:<br>
      <a href="${link}" style="color:#555;word-break:break-all">${link}</a>
    </p>
    <p style="font-size:12px;line-height:1.5;margin:20px 0 0;color:#aaa">
      This link is tied to your email address and expires in 14 days. If you weren't expecting it, ignore this email.
    </p>
  </div>`
  return { subject, html, link }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const SITE_URL = Deno.env.get('PUBLIC_SITE_URL')
  const FROM = Deno.env.get('INVITE_FROM_EMAIL')

  if (!RESEND_API_KEY || !SITE_URL || !FROM) {
    return json({ error: 'Email is not configured (RESEND_API_KEY / PUBLIC_SITE_URL / INVITE_FROM_EMAIL).' }, 500)
  }

  let emails: unknown, role: unknown
  try {
    const body = await req.json()
    emails = body.emails
    role = body.role
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!Array.isArray(emails) || emails.length === 0) return json({ error: 'emails must be a non-empty array' }, 400)
  if (typeof role !== 'string' || !['mentor', 'admin', 'student'].includes(role)) {
    return json({ error: 'role must be mentor, admin, or student' }, 400)
  }

  // Run as the caller: admin_create_invites enforces is_admin() server-side.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: invites, error } = await supabase.rpc('admin_create_invites', {
    p_emails: emails,
    p_role: role,
  })
  if (error) {
    // RPC raises "Not authorized" for non-admins -> surface as 403.
    const status = /not authorized/i.test(error.message) ? 403 : 400
    return json({ error: error.message }, status)
  }
  if (!invites || invites.length === 0) {
    return json({ created: 0, sent: 0, failed: [], message: 'No valid new invites were created.' })
  }

  // Send each link. One email per invite (links are email-bound).
  const sentTokens: string[] = []
  const failed: { email: string; reason: string }[] = []

  for (const inv of invites) {
    const { subject, html } = inviteEmail(SITE_URL, inv.role, inv.token)
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: inv.email, subject, html }),
      })
      if (res.ok) sentTokens.push(inv.token)
      else failed.push({ email: inv.email, reason: `Resend ${res.status}: ${await res.text()}` })
    } catch (e) {
      failed.push({ email: inv.email, reason: String(e) })
    }
  }

  if (sentTokens.length > 0) {
    // Best-effort stamp; a failure here doesn't undo the sent emails.
    await supabase.rpc('admin_mark_invites_sent', { p_tokens: sentTokens })
  }

  return json({ created: invites.length, sent: sentTokens.length, failed })
})
