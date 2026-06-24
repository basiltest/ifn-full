// Dependency-free SMTP-over-implicit-TLS sender (Gmail) for the transactional emails the
// edge functions send: registration acknowledgement (register-request), approval
// credentials (review-registration), admin-created member credentials (create-member).
//
// Why hand-rolled and not a library: the supabase edge-runtime killed the isolate
// ("wall clock duration warning" -> "early termination") whenever a deno.land/x mailer
// was imported — the remote module fetch / connection pool stalls past the wall-clock
// limit. This file imports nothing, so module load is instant, and every socket op has an
// explicit timeout: it sends fast or throws fast (the callers catch it, so the account is
// still created and the password is shown in the admin UI).
//
// Why SMTP and not Resend's HTTP API: this deployment sends via a personal Gmail account +
// App Password. Gmail rewrites the From header to the authenticated account unless a
// verified send-as alias exists, so we FORCE From = "<name> <GMAIL_SMTP_USER>" and ignore
// whatever `from` the caller passes (kept in the signature for drop-in compatibility with
// the old _shared/resend.ts sender).
//
// Env (set on the functions container — see docker-compose.yml):
//   GMAIL_SMTP_USER  the @gmail.com address that authenticates + appears as the sender
//   GMAIL_SMTP_PASS  16-char Google App Password (NOT the account password; needs 2FA)
//   GMAIL_SMTP_HOST  optional, default smtp.gmail.com
//   GMAIL_SMTP_PORT  optional, default 465 (implicit TLS)
//   GMAIL_FROM_NAME  optional, default "ICFAI Founders Network"

const ENC = new TextEncoder()
const DEC = new TextDecoder()
const STEP_MS = 8000 // per socket op; normal end-to-end send is ~1-2s

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`SMTP timeout: ${label} (${ms}ms)`)), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

class Smtp {
  private conn: Deno.TlsConn
  private buf = new Uint8Array(8192)
  constructor(conn: Deno.TlsConn) { this.conn = conn }

  // Read one full SMTP reply (handles multi-line "250-foo\r\n250 bar"); throw on >= 400.
  async expect(want: number): Promise<void> {
    let acc = ''
    while (true) {
      const n = await withTimeout(this.conn.read(this.buf), STEP_MS, 'read')
      if (n === null) throw new Error('SMTP connection closed')
      acc += DEC.decode(this.buf.subarray(0, n))
      const finals = acc.split('\n')
        .map((l) => l.replace(/\r$/, ''))
        .filter((l) => /^\d{3} /.test(l)) // a space (not '-') after the code = final line
      if (finals.length) {
        const code = parseInt(finals[finals.length - 1].slice(0, 3), 10)
        if (code !== want) throw new Error(`SMTP expected ${want}, got: ${acc.trim()}`)
        return
      }
    }
  }

  async send(line: string): Promise<void> {
    await withTimeout(this.conn.write(ENC.encode(line)), STEP_MS, 'write')
  }

  close(): void { try { this.conn.close() } catch { /* already closed */ } }
}

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
  const from = `${fromName} <${user}>`

  const tls = await withTimeout(Deno.connectTls({ hostname: host, port }), STEP_MS, 'connect')
  const c = new Smtp(tls)
  try {
    await c.expect(220) // greeting
    await c.send(`EHLO localhost\r\n`); await c.expect(250)
    await c.send(`AUTH LOGIN\r\n`); await c.expect(334)
    await c.send(`${btoa(user)}\r\n`); await c.expect(334)
    await c.send(`${btoa(pass)}\r\n`); await c.expect(235)
    await c.send(`MAIL FROM:<${user}>\r\n`); await c.expect(250)
    await c.send(`RCPT TO:<${opts.to}>\r\n`); await c.expect(250)
    await c.send(`DATA\r\n`); await c.expect(354)

    const headers = [
      `From: ${from}`,
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      `MIME-Version: 1.0`,
      opts.replyTo ? `Reply-To: ${opts.replyTo}` : '',
      opts.html ? `Content-Type: text/html; charset=utf-8` : `Content-Type: text/plain; charset=utf-8`,
    ].filter(Boolean).join('\r\n')
    // Normalize newlines to CRLF and dot-stuff lines starting with '.' (SMTP DATA rule).
    const body = (opts.html ?? opts.text ?? ' ').replace(/\r?\n/g, '\r\n').replace(/\r\n\./g, '\r\n..')
    await c.send(`${headers}\r\n\r\n${body}\r\n.\r\n`); await c.expect(250)

    await c.send(`QUIT\r\n`)
    try { await c.expect(221) } catch { /* server may just drop the connection */ }
  } finally {
    c.close()
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}
