import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { getMyProfile } from '../lib/profiles'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [gstin, setGstin] = useState('')
  const [footerText, setFooterText] = useState('')
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile()

        if (!alive || !profile) {
          return
        }

        setFullName(profile.full_name ?? '')
        setBusinessName(profile.business_name ?? '')
        setUpiId(profile.upi_id ?? '')
        setGstin(profile.gstin ?? '')
        setFooterText(profile.footer_text ?? '')
      } catch {
        if (alive) {
          setError('We could not load your profile details.')
        }
      } finally {
        if (alive) {
          setBootstrapping(false)
        }
      }
    }

    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedFullName = fullName.trim()
    const trimmedBusinessName = businessName.trim()
    const trimmedUpiId = upiId.trim()

    if (!trimmedFullName && !trimmedBusinessName) {
      setError('Enter your name or business name.')
      return
    }

    if (!trimmedUpiId) {
      setError('Enter your UPI ID.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('auth')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName || null,
          business_name: trimmedBusinessName || null,
          upi_id: trimmedUpiId,
          gstin: gstin.trim() || null,
          footer_text: footerText.trim() || null,
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('update')
      }

      navigate('/dashboard')
    } catch {
      setError('We could not save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--bg-base] text-[--text-primary]">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--bg-base] text-[--text-primary]">
      <div className="w-full max-w-md border border-[--border-default] p-6 rounded-2xl bg-[--bg-surface]">
        <p className="text-xs uppercase tracking-widest text-[--text-secondary] mb-2">
          One-time setup
        </p>

        <h1 className="text-2xl font-semibold mb-2">
          Set up your profile
        </h1>

        <p className="text-sm text-[--text-secondary] mb-6">
          This fills in every invoice automatically. You will only do this once.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
              YOUR NAME
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full mt-1 p-3 bg-[--bg-base] border border-[--border-default] rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
              BUSINESS NAME
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="w-full mt-1 p-3 bg-[--bg-base] border border-[--border-default] rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
              YOUR UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              className="w-full mt-1 p-3 bg-[--bg-base] border border-[--border-default] rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
              GSTIN
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(event) => setGstin(event.target.value)}
              className="w-full mt-1 p-3 bg-[--bg-base] border border-[--border-default] rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
              FOOTER TEXT
            </label>
            <textarea
              value={footerText}
              onChange={(event) => setFooterText(event.target.value)}
              className="w-full mt-1 p-3 min-h-24 bg-[--bg-base] border border-[--border-default] rounded-xl"
            />
          </div>

          {error && (
            <p className="text-sm text-[--danger]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[--accent] text-[#0C0A09]"
          >
            {loading ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
