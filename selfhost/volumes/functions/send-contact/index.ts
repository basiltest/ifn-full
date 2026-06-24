// send-contact: member-to-member contact relay. The sender never sees the recipient's
// email; the recipient never sees the sender's until they choose to reply.
//
// Policy (not-banned, recipient reachable, daily cap, audit) lives in the
// contact_member() RPC, called with the CALLER's JWT so is_admin()/auth.uid() govern.
// Addresses are resolved here with the SERVICE-ROLE key (never reachable from a browser),
// so no email ever crosses a user-callable boundary.
//
// Deploy:  supabase functions deploy send-contact
// Secrets: reuses RESEND_API_KEY + INVITE_FROM_EMAIL (no new config).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, escapeHtml } from '../_shared/resend.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('INVITE_FROM_EMAIL')
  if (!RESEND_API_KEY || !FROM) return json({ error: 'Email is not configured.' }, 500)

  let to: unknown, subject: unknown, body: unknown
  try {
    const b = await req.json()
    to = b.to; subject = b.subject; body = b.body
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (typeof to !== 'string') return json({ error: 'to (user id) is required' }, 400)
  if (typeof body !== 'string' || !body.trim()) return json({ error: 'Message body is required' }, 400)
  const subj = typeof subject === 'string' ? subject.trim().slice(0, 150) : ''
  const msg = body.trim().slice(0, 4000)

  // 1. policy + rate limit + audit, as the caller (is_admin/auth.uid apply)
  const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } })
  const { error: gateErr } = await asUser.rpc('contact_member', { p_to: to, p_subject: subj })
  if (gateErr) {
    const m = gateErr.message || 'Could not send the message.'
    const status = /banned|not authenticated/i.test(m) ? 403 : /limit/i.test(m) ? 429 : 400
    return json({ error: m }, status)
  }

  // 2. resolve both addresses server-side (service-role; never exposed to the client)
  const sender = (await asUser.auth.getUser()).data.user
  const admin = createClient(SUPABASE_URL, SERVICE)
  const recipient = (await admin.auth.admin.getUserById(to)).data.user
  if (!sender?.email || !recipient?.email) return json({ error: 'Could not resolve a recipient.' }, 400)

  const { data: rp } = await admin.from('profiles').select('name').eq('id', to).single()
  const { data: sp } = await admin.from('profiles').select('name').eq('id', sender.id).single()
  const senderName = sp?.name || 'A member'

  const subjectLine = subj
    ? `[ICFAI Founders Network] ${senderName}: ${subj}`
    : `[ICFAI Founders Network] ${senderName} sent you a message`
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px 24px;color:#1a1a1a">
    <p style="font-size:13px;color:#888;margin:0 0 14px">via the ICFAI Founders Network directory</p>
    <p style="font-size:15px;margin:0 0 6px"><strong>${escapeHtml(senderName)}</strong>${rp?.name ? ` messaged ${escapeHtml(rp.name)}` : ''}:</p>
    <div style="font-size:15px;line-height:1.55;white-space:pre-wrap;border-left:3px solid #eee;padding-left:12px;margin:10px 0 18px">${escapeHtml(msg)}</div>
    <p style="font-size:13px;color:#888;margin:0">Reply to this email to reach ${escapeHtml(senderName)} directly. Manage your visibility in Settings.</p>
  </div>`

  try {
    await sendEmail({ apiKey: RESEND_API_KEY, from: FROM, to: recipient.email, subject: subjectLine, html, replyTo: sender.email })
  } catch (e) {
    return json({ error: `Delivery failed: ${String(e)}` }, 502)
  }
  return json({ sent: true })
})
