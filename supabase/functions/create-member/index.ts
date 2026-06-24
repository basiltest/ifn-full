// create-member: an admin creates a member account directly and emails the sign-in details.
//
// The SPA holds only the anon key, so creating a confirmed user with a known password
// requires the service-role key, which must never reach the browser — hence this function.
//
// Authorization is enforced two ways: the caller's JWT is checked against profiles.role
// === 'admin' before anything happens (a non-admin gets 403), and only then does a
// service-role client create the auth user. The generated password is returned to the
// admin once (shown in the UI) and emailed to the member via Resend (plain text).
//
// Deploy:  supabase functions deploy create-member
// Secrets: RESEND_API_KEY, PUBLIC_SITE_URL, MEMBER_FROM_EMAIL (falls back to INVITE_FROM_EMAIL).
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'
import { generatePassword } from '../_shared/password.ts'

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*', // set ALLOWED_ORIGIN secret to lock to your app domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Plain-text credentials email + a link to the user guide chosen by role (mentors get the
// extended guide). Kept plain text by product decision; no HTML.
function credentialsEmail(siteUrl: string, role: string, email: string, password: string) {
  const base = siteUrl.replace(/\/$/, '')
  const loginUrl = `${base}/login`
  const guideUrl = `${base}/guides/${role === 'mentor' ? 'IFN-User-Guide-Plus.pdf' : 'IFN-User-Guide.pdf'}`
  const subject = `Your ICFAI Founders Network account is ready`
  const text = `Hi,

An administrator created your ICFAI Founders Network account.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const SITE_URL = Deno.env.get('PUBLIC_SITE_URL')
  const FROM = Deno.env.get('MEMBER_FROM_EMAIL') || Deno.env.get('INVITE_FROM_EMAIL')

  if (!RESEND_API_KEY || !SITE_URL || !FROM) {
    return json({ error: 'Email is not configured (RESEND_API_KEY / PUBLIC_SITE_URL / MEMBER_FROM_EMAIL).' }, 500)
  }

  let email: unknown, role: unknown, memberTypeRaw: unknown
  try {
    const body = await req.json()
    email = body.email
    role = body.role
    memberTypeRaw = body.member_type
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const memberType = typeof memberTypeRaw === 'string' && memberTypeRaw.trim() ? memberTypeRaw.trim() : null
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: 'A valid email is required.' }, 400)
  }
  if (typeof role !== 'string' || !['mentor', 'admin', 'student'].includes(role)) {
    return json({ error: 'role must be mentor, admin, or student' }, 400)
  }
  const addr = email.trim().toLowerCase()

  // 1. Authorize the caller: must be an existing admin. Uses the caller's JWT against RLS
  //    (a user can read their own profile row), so this is the same check the client UI uses.
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await caller.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401)
  const { data: me, error: meErr } = await caller
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (meErr || me?.role !== 'admin') return json({ error: 'Not authorized' }, 403)

  // 2. Create the account with the service role. email_confirm so they can sign in at once.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const password = generatePassword()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: addr,
    password,
    email_confirm: true,
  })
  if (createErr || !created?.user) {
    const msg = createErr?.message || 'Could not create the account.'
    const status = /already.*registered|already exists|duplicate/i.test(msg) ? 409 : 400
    return json({ error: /already/i.test(msg) ? 'That email already has an account.' : msg }, status)
  }

  // 3. Set the role on the profile row created by the new-user trigger.
  const { error: roleErr } = await admin
    .from('profiles')
    .update({ role, member_type: memberType })
    .eq('id', created.user.id)
  if (roleErr) {
    // The account exists but the role didn't stick. Surface it so the admin can fix it
    // from the Members tab rather than silently leaving a misroled account.
    console.error('role update failed:', roleErr)
    return json({ error: `Account created, but the role could not be set: ${roleErr.message}. Set it from the Members tab.`, password }, 500)
  }

  // 4. Email the credentials. A send failure does not undo the account — report it so the
  //    admin can share the password (returned below) manually.
  const { subject, text } = credentialsEmail(SITE_URL, role, addr, password)
  let emailed = false
  try {
    await sendEmail({ apiKey: RESEND_API_KEY, from: FROM, to: addr, subject, text })
    emailed = true
  } catch (e) {
    console.error('Resend send failed:', e)
  }

  return json({ ok: true, email: addr, role, password, emailed })
})
