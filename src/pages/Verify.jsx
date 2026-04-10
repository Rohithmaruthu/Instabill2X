import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLocation } from 'react-router-dom'

export default function Verify() {
  const location = useLocation()
  const email = location.state?.email || ''
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    setResent(true)
    setTimeout(() => setResent(false), 4000)
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[#1C1917] border border-[#292524] border-[0.5px] flex items-center justify-center mx-auto mb-6">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 6.5L10 11.5L17.5 6.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="#D97706" strokeWidth="1.5" />
          </svg>
        </div>

        <h1 className="text-[#FAFAF9] text-2xl font-semibold mb-2">Check your email</h1>
        <p className="text-[#A8A29E] text-sm leading-relaxed mb-8">
          We sent a verification link to{' '}
          <span className="text-[#FAFAF9]">{email}</span>.
          {' '}Click it to activate your account.
        </p>

        <button
          onClick={handleResend}
          disabled={loading}
          className="text-[#D97706] hover:text-[#B45309] text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : "Didn't get it? Resend"}
        </button>

        {resent && (
          <p className="text-[#10B981] text-sm mt-3">Verification email sent</p>
        )}
      </div>
    </div>
  )
}