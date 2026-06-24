// Shared Gmail SMTP sender for the transactional emails the edge functions send:
// registration acknowledgement (register-request), approval credentials
// (review-registration), and admin-created member credentials (create-member).
//
// Why SMTP and not Resend's HTTP API: this deployment sends those via a personal Gmail
// account + App Password. Gmail rewrites the From header to the authenticated account
// unless a verified send-as alias exists, so we FORCE From = "<name> <GMAIL_SMTP_USER>"
// and ignore whatever `from` the caller passes (the `from`/`apiKey` fields are kept in the
// signature only so this is a drop-in replacement for the old _shared/resend.ts sender).
//
// Env (set on the functions container — see docker-compose.yml):
//   GMAIL_SMTP_USER  the @gmail.com address that authenticates + appears as the sender
//   GMAIL_SMTP_PASS  16-char Google App Password (NOT the account password; needs 2FA)
//   GMAIL_SMTP_HOST  optional, default smtp.gmail.com
//   GMAIL_SMTP_PORT  optional, default 465 (implicit TLS)
//   GMAIL_FROM_NAME  optional, default "ICFAI Founders Network"
//
// NOTE: opens a raw SMTP TCP socket from the edge-runtime. If the runtime blocks
// Deno.connect, fall back to Resend (set RESEND_API_KEY and revert these imports).
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

export async function sendEmail(opts: {
  apiKey?: string // ignored — kept for signature compatibility with the old Resend sender
  from?: string // ignored — Gmail forces the authenticated account as the From header
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
}) {
  const user = Deno.env.get('GMAIL_SMTP_USER')
  const pass = Deno.env.get('GMAIL_SMTP_PASS')
  if (!user || !pass) throw new Error('GMAIL_SMTP_USER / GMAIL_SMTP_PASS not set')
  const host = Deno.env.get('GMAIL_SMTP_HOST') || 'smtp.gmail.com'
  const port = Number(Deno.env.get('GMAIL_SMTP_PORT') || '465')
  const fromName = Deno.env.get('GMAIL_FROM_NAME') || 'ICFAI Founders Network'

  const client = new SMTPClient({
    connection: { hostname: host, port, tls: true, auth: { username: user, password: pass } },
  })
  try {
    await client.send({
      from: `${fromName} <${user}>`,
      to: opts.to,
      subject: opts.subject,
      // denomailer needs content and/or html. Our callers send plain text.
      content: opts.text ?? (opts.html ? undefined : ' '),
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    })
  } finally {
    await client.close()
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}
