import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'

import ProtectedRoute from './components/ProtectedRoute'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'

function RootRedirect() {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [hasName, setHasName] = useState(false)

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setChecking(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      setHasName(!!data?.name)
      setChecking(false)
    }

    checkProfile()
  }, [user])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/signin" replace />
  if (!hasName) return <Navigate to="/profile-setup" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/verify" element={<Verify />} />

      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}