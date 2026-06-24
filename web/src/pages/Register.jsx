import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, X } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import { supabase } from '../lib/supabase'
import { CAPTCHA_SITEKEY, captchaEnabled } from '../lib/captcha'
import Logo from '../components/Logo'
import { MEMBER_TYPES } from '../lib/options'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STUDENT_DOMAIN = 'ifheindia.org'
const GENERIC_ERR = 'Something went wrong. Please try again.'
const MAX_CERT_MB = 5
const CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// Public sign-up is now a REQUEST: it goes to the super-admin queue (register-request edge
// function), not a direct account. The admin approves (account + emailed credentials) or
// disapproves. No password is set here.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = () => reject(new Error('read failed'))
    r.readAsDataURL(file)
  })
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', member_type: '', other_text: '', website: '' })
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const fileRef = useRef(null)
  const turnstileRef = useRef(null)
  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const memberTypeRef = useRef(null)
  const errorRef = useRef(null)

  function clearFile() {
    setCert(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Single-use token: re-mint a fresh one after any failed submit so a retry isn't rejected.
  function resetCaptcha() {
    if (!captchaEnabled) return
    turnstileRef.current?.reset()
    setCaptchaToken('')
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isStudentDomain = form.email.trim().toLowerCase().split('@')[1] === STUDENT_DOMAIN
  const certRequired = !isStudentDomain

  function onFile(e) {
    setError('')
    const f = e.target.files?.[0] || null
    if (f) {
      if (!CERT_TYPES.includes(f.type)) { setError('Certificate must be a PDF, JPG, or PNG.'); e.target.value = ''; return }
      if (f.size > MAX_CERT_MB * 1024 * 1024) { setError(`Certificate must be ${MAX_CERT_MB} MB or smaller.`); e.target.value = ''; return }
    }
    setCert(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const fail = (msg, ref) => { setError(msg); ref?.current?.focus(); return undefined }
    if (form.name.trim().length < 2) return fail('Enter your full name.', nameRef)
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return fail('Enter a valid email.', emailRef)
    if (!form.member_type) return fail('Pick what you are registering as.', memberTypeRef)
    if (certRequired && !cert) return fail('A graduate certificate is required for your email.', fileRef)
    if (captchaEnabled && !captchaToken) return fail('Please complete the verification below.', errorRef)

    setLoading(true)
    try {
      let certPayload = null
      if (cert) certPayload = { filename: cert.name, contentType: cert.type, dataBase64: await fileToBase64(cert) }

      const { data, error: fnErr } = await supabase.functions.invoke('register-request', {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          member_type: form.member_type,
          other_text: form.other_text.trim(),
          website: form.website, // honeypot
          captchaToken, // verified server-side in the edge fn (fail-closed when a secret is set)
          cert: certPayload,
        },
      })
      if (fnErr) {
        resetCaptcha()
        let msg = fnErr.message
        try { msg = (await fnErr.context?.json())?.error || msg } catch { /* ignore */ }
        return setError(msg === 'Failed to send a request to the Edge Function' ? 'Could not reach the registration service. Try again shortly.' : msg || GENERIC_ERR)
      }
      if (data?.error) { resetCaptcha(); return setError(data.error) }
      setDone(true)
    } catch {
      resetCaptcha()
      setError(GENERIC_ERR)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="card w-full max-w-sm p-8 text-center animate-pop-in">
          <div aria-hidden="true" className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success text-xl font-bold">✓</div>
          <h1 className="text-lg font-semibold">Request received</h1>
          <p className="mt-1 break-words text-sm text-muted">
            Thanks, <span className="font-semibold text-ink">{form.name.trim()}</span>. Our team will review your request and email <span className="font-semibold text-ink">{form.email.trim()}</span> with the outcome.
          </p>
          <p className="mt-3 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 py-10">
      <form onSubmit={handleSubmit} noValidate className="card w-full max-w-sm p-8 animate-pop-in">
        <Logo className="mb-5 h-12 w-auto" />
        <h1 className="text-lg font-semibold">Request access</h1>
        <p className="mb-5 text-sm text-muted">Tell us about you. An admin reviews every request before your account is created.</p>

        {error && (
          <div ref={errorRef} id="register-error" tabIndex={-1} role="alert" className="mb-4 rounded-lg border border-down/30 bg-down/10 px-3 py-2 text-sm text-down outline-none">{error}</div>
        )}

        {/* honeypot: hidden from humans, bots fill it */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={form.website} onChange={set('website')}
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

        <div className="mb-3.5 flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium text-muted">Full name <span className="text-down" aria-hidden="true">*</span></label>
          <input ref={nameRef} id="name" className="input" maxLength={50} required aria-required="true" aria-invalid={!!error} aria-describedby={error ? 'register-error' : undefined} value={form.name} onChange={set('name')} />
        </div>

        <div className="mb-3.5 flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-muted">Email <span className="text-down" aria-hidden="true">*</span></label>
          <input ref={emailRef} id="email" type="email" className="input" maxLength={254} required aria-required="true" aria-invalid={!!error} aria-describedby={error ? 'register-error' : undefined} value={form.email} autoComplete="email" onChange={set('email')} />
        </div>

        <div className="mb-3.5 flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-medium text-muted">Phone <span className="text-muted">(optional)</span></label>
          <input id="phone" type="tel" className="input" maxLength={20} value={form.phone} autoComplete="tel" onChange={set('phone')} />
        </div>

        <div className="mb-3.5 flex flex-col gap-1.5">
          <label htmlFor="member_type" className="text-xs font-medium text-muted">Registering as <span className="text-down" aria-hidden="true">*</span></label>
          <select ref={memberTypeRef} id="member_type" className="input" required aria-required="true" value={form.member_type} onChange={set('member_type')}>
            <option value="">Select...</option>
            {MEMBER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {form.member_type === 'Other' && (
          <div className="mb-3.5 flex flex-col gap-1.5">
            <label htmlFor="other_text" className="text-xs font-medium text-muted">Tell us more <span className="text-muted">(optional)</span></label>
            <input id="other_text" className="input" maxLength={120} value={form.other_text} onChange={set('other_text')} placeholder="What describes you" />
          </div>
        )}

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="cert" className="text-xs font-medium text-muted">
            Last graduate certificate {certRequired ? <span className="text-down" aria-hidden="true">*</span> : <span className="text-muted">(optional)</span>}
          </label>
          <input ref={fileRef} id="cert" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onFile} required={certRequired} aria-required={certRequired} aria-describedby="cert-hint" className="peer sr-only" />
          {cert ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-page px-3 py-2.5">
              <FileText size={18} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{cert.name}</div>
                <div className="text-xs text-muted">{formatSize(cert.size)}</div>
              </div>
              <button type="button" onClick={clearFile} aria-label="Remove file"
                className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-down">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-card px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:bg-accent-soft/40 hover:text-ink peer-focus-visible:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50">
              <Upload size={16} /> Choose a file
            </button>
          )}
          <span id="cert-hint" className="text-xs text-muted">
            {isStudentDomain ? `Optional for @${STUDENT_DOMAIN} emails.` : 'PDF, JPG, or PNG, up to 5 MB.'}
          </span>
        </div>

        {captchaEnabled && (
          <div className="mb-4 flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={CAPTCHA_SITEKEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              onError={() => setCaptchaToken('')}
              options={{ theme: 'auto', size: 'flexible' }}
            />
          </div>
        )}

        <button type="submit" disabled={loading} aria-busy={loading} className="btn-primary w-full">
          {loading ? 'Submitting...' : 'Submit request'}
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">Log in</Link>
        </p>
      </form>
    </main>
  )
}
