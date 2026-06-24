// Shared Resend sender. Used by send-invites / send-session / send-contact so the
// fetch + error handling isn't copy-pasted per function. Throws on a non-2xx response.
export async function sendEmail(opts: {
  apiKey: string
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      ...(opts.html ? { html: opts.html } : {}),
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  return res.json()
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}
