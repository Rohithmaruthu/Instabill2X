import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import { Field } from '../components/ui/Field'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        if (signInError.message.toLowerCase().includes('many requests')) {
          setError('Too many attempts. Wait 60 seconds and try again.')
        } else {
          setError('Incorrect email or password.')
        }
        return
      }

      navigate('/app')
    } catch {
      setError('We could not sign you in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in"
      description="Pick up right where you left off."
      asideTitle="Your billing workspace should feel fast, focused, and quiet."
      asideCopy="No clutter, no accounting suite energy. Just the shortest path from finished work to a paid invoice."
      footer={
        <p className="support-copy">
          Don&apos;t have an account? <Link className="text-link" to="/signup">Sign up</Link>
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
          placeholder="Your password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
        />

        {error ? <p className="alert alert--error">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
