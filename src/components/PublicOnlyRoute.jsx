import { Navigate } from 'react-router-dom'
import LoadingScreen from './LoadingScreen'
import { useAuth } from '../hooks/useAuth'

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Checking your session..." />
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return children
}
