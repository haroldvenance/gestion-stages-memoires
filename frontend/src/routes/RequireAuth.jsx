import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

export function RequireAuth({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}`} replace />
  }

  return children
}
