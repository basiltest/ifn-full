import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import Logo from '../components/Logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) {
        setError(authErrorMessage(resetError))
        return
      }
      // Generic success regardless of whether the account exists (no enumeration).
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="card w-full max-w-sm p-8 text-center animate-pop-in">
          <div aria-hidden="true" className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success text-xl font-bold">
            ✓
          </div>
          <h1 className="text-lg font-semibold">Check your email</h1>
          <p className="mt-1 text-sm text-muted">
            If an account exists for{' '}
            <span className="font-semibold text-ink break-words">{email}</span>, a password
            reset link is on its way.
          </p>
          <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page rounded">
            Back to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <form onSubmit={handleSubmit} noValidate className="card w-full max-w-sm p-8 animate-pop-in">
        <Logo className="mb-5 h-12 w-auto" />
        <h1 className="text-lg font-semibold">Reset your password</h1>
        <p className="mb-5 text-sm text-muted">We will email you a link to set a new one.</p>

        {error && (
          <div id="forgot-error" role="alert" className="mb-4 rounded-lg border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-muted">Email</label>
          <input
            id="email" type="email" required className="input" value={email}
            placeholder="you@example.com" autoComplete="email"
            aria-invalid={!!error}
            aria-describedby={error ? 'forgot-error' : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} aria-busy={loading} className="btn-primary w-full">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page rounded">Log in</Link>
        </p>
      </form>
    </main>
  )
}
