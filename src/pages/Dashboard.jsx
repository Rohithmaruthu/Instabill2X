import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getMyProfile } from '../lib/profiles'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    let alive = true

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile()
        if (!alive || !profile) return
        setProfileName(
          profile.display_name || profile.business_name || profile.full_name || ''
        )
      } catch {
        if (alive) {
          setProfileName('')
        }
      }
    }

    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  return (
    <div className="min-h-screen bg-[--bg-base] text-[--text-primary] p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">
          InstaBill
        </h1>

        <button
          onClick={handleSignOut}
          className="text-sm text-[--text-secondary]"
        >
          Sign out
        </button>
      </div>

      <div className="border border-[--border-default] rounded-2xl p-6 bg-[--bg-surface]">
        <h2 className="text-lg font-medium mb-2">
          Dashboard
        </h2>

        <p className="text-sm text-[--text-secondary] mb-4">
          {profileName ? `Welcome back, ${profileName}.` : "You're logged in as:"}
        </p>

        <p className="text-sm">
          {user?.email}
        </p>
      </div>
    </div>
  )
}
