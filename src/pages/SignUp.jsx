import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import { Field } from '../components/ui/Field'

export default function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.includes('@')) {
      setError("That doesn't look like a valid email address.")
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already')) {
          setError('An account with this email already exists. Sign in instead?')
        } else {
          setError('We could not create your account right now. Please try again.')
        }
        return
      }

      navigate('/verify', { state: { email } })
    } catch {
      setError('We could not create your account right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Start free"
      title="Create your account"
      description="Your first five invoices are included. No card required."
      asideTitle="A calmer invoice workflow, built for how Indian freelancers already get paid."
      asideCopy="Profile once, generate fast, share a clean link, and keep the payment path obvious."
      footer={
        <p className="support-copy">
          Already have an account? <Link className="text-link" to="/signin">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="stack">
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
          }}
        />
        <Field
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
        />

        {error ? <p className="alert alert--error">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
