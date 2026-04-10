import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
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
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already')) {
        setError('An account with this email already exists. Sign in instead?')
      } else {
        setError('Something went wrong. Please try again.')
      }
      return
    }

    navigate('/verify', { state: { email } })
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-[#FAFAF9] text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-[#A8A29E] text-sm mb-8">Free for your first 5 invoices. No credit card needed.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#A8A29E] text-[11px] font-medium tracking-[0.08em] uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              className="bg-[#1C1917] border border-[#292524] border-[0.5px] text-[#FAFAF9] rounded-md px-3 py-2.5 text-sm outline-none focus:border-[#D97706] transition-colors"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#A8A29E] text-[11px] font-medium tracking-[0.08em] uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              className="bg-[#1C1917] border border-[#292524] border-[0.5px] text-[#FAFAF9] rounded-md px-3 py-2.5 text-sm outline-none focus:border-[#D97706] transition-colors"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-[#EF4444] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#D97706] text-[#0C0A09] font-semibold rounded-md py-2.5 text-sm hover:bg-[#B45309] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-[#A8A29E] text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-[#D97706] hover:text-[#B45309]">Sign in</Link>
        </p>
      </div>
    </div>
  )
}