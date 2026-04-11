import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { getMyProfile, hasCompletedProfile } from './lib/profiles'

import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import LoadingScreen from './components/LoadingScreen'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'
import InvoiceComposer from './pages/InvoiceComposer'
import InvoicePreview from './pages/InvoicePreview'
import ShareScreen from './pages/ShareScreen'
import Paywall from './pages/Paywall'
import SharedInvoicePage from './pages/SharedInvoicePage'

function RootRedirect() {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setChecking(false)
        return
      }

      try {
        const profile = await getMyProfile()
        setIsReady(hasCompletedProfile(profile))
      } catch {
        setIsReady(false)
      } finally {
        setChecking(false)
      }
    }

    checkProfile()
  }, [user])

  if (loading || checking) {
    return <LoadingScreen message="Preparing your workspace..." />
  }

  if (!user) return <Navigate to="/" replace />
  if (!isReady) return <Navigate to="/profile-setup" replace />
  return <Navigate to="/app/new" replace />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Landing />
          </PublicOnlyRoute>
        }
      />
      <Route path="/go" element={<RootRedirect />} />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignUp />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signin"
        element={
          <PublicOnlyRoute>
            <SignIn />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <PublicOnlyRoute>
            <Verify />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Navigate to="/app/new" replace />
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
      <Route
        path="/app/new"
        element={
          <ProtectedRoute>
            <InvoiceComposer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/preview"
        element={
          <ProtectedRoute>
            <InvoicePreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/share"
        element={
          <ProtectedRoute>
            <ShareScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/paywall"
        element={
          <ProtectedRoute>
            <Paywall />
          </ProtectedRoute>
        }
      />
      <Route path="/inv/:token" element={<SharedInvoicePage />} />
      <Route path="*" element={<Navigate to="/go" replace />} />
    </Routes>
  )
}
