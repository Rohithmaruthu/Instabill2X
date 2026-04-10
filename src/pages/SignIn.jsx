import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      if (signInError.message.toLowerCase().includes('many requests')) {
        setError('Too many attempts. Wait 60 seconds and try again.')
      } else {
        setError('Incorrect email or password.')
      }
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-[#FAFAF9] text-2xl font-semibold mb-1">Welcome back</h1>
        <p className="text-[#A8A29E] text-sm mb-8">Sign in to your InstaBill account</p>

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
              placeholder="Your password"
              autoComplete="current-password"
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-[#A8A29E] text-sm mt-6 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#D97706] hover:text-[#B45309]">Sign up</Link>
        </p>
      </div>
    </div>
  )
}