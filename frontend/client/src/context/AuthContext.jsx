import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { AuthContext } from './authContext'

function getToken(data) {
  return data?.token || data?.accessToken || data?.jwt || data?.data?.token || ''
}

function getUser(data) {
  return data?.user || data?.data?.user || data?.profile || data?.data || data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('hireflow_token')))
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('hireflow_token')
    if (!token) return undefined
    authService.me()
      .then((data) => { if (active) setUser(getUser(data)) })
      .catch(() => { localStorage.removeItem('hireflow_token') })
      .finally(() => { if (active) setLoading(false) })
    const handleExpired = () => {
      setUser(null)
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:expired', handleExpired)
    return () => {
      active = false
      window.removeEventListener('auth:expired', handleExpired)
    }
  }, [navigate])

  async function login(credentials, remember = true) {
    const data = await authService.login(credentials)
    const token = getToken(data)
    if (!token) throw new Error('The server response did not include an access token.')
    localStorage.setItem('hireflow_token', token)
    setUser(getUser(data))
    if (!getUser(data)?.fullName && !getUser(data)?.name) {
      try { setUser(getUser(await authService.me())) } catch { /* Login succeeded; profile can load on the next visit. */ }
    }
    localStorage.setItem('hireflow_remember', remember ? 'true' : 'false')
    navigate('/', { replace: true })
  }

  async function register(payload) {
    await authService.register(payload)
    navigate('/login', { replace: true, state: { registered: true } })
  }

  async function updateProfile(payload) {
    const data = await authService.updateProfile(payload)
    setUser(getUser(data))
    return data
  }

  function logout() {
    localStorage.removeItem('hireflow_token')
    localStorage.removeItem('hireflow_remember')
    setUser(null)
    navigate('/login', { replace: true })
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, updateProfile, logout }}>{children}</AuthContext.Provider>
}