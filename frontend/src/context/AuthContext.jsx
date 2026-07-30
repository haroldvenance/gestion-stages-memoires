import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api/endpoints'
import { setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const tokens = localStorage.getItem('tokens')
    if (!tokens) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      setTokens(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  async function login(username, password) {
    const { data } = await authApi.login(username, password)
    setTokens(data)
    const { data: me } = await authApi.me()
    setUser(me)
    return me
  }

  function logout() {
    setTokens(null)
    setUser(null)
  }

  async function refreshMe() {
    const { data } = await authApi.me()
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
