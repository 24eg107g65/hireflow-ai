import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading"><div className="brand-mark">p</div><span className="loader-dot" /></div>
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}