import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'

export default function Verify() {
  const location = useLocation()
  const email = location.state?.email || ''
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    setLoading(true)
    setError('')

    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })

      if (resendError) {
        throw resendError
      }

      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch {
      setError('We could not resend the verification email right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Verify email"
      title="Check your inbox"
      description="Open the verification link to activate your account."
      asideTitle="Your profile unlocks the rest of the invoice flow."
      asideCopy="Once you verify your email, we can take you into profile setup and prepare the workspace for invoice creation."
      footer={
        <p className="support-copy">
          Need to sign in instead? <Link className="text-link" to="/signin">Go to sign in</Link>
        </p>
      }
    >
      <div className="stack">
        <div className="verification-badge" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 6.5L10 11.5L17.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <p className="support-copy">
          We sent a verification link to <strong>{email || 'your email address'}</strong>.
        </p>

        {error ? <p className="alert alert--error">{error}</p> : null}
        {resent ? <p className="alert alert--success">Verification email sent.</p> : null}

        <Button variant="secondary" onClick={handleResend} disabled={loading || !email}>
          {loading ? 'Sending...' : "Didn't get it? Resend"}
        </Button>
      </div>
    </AuthLayout>
  )
}
