import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import apiClient, { getStoredAuth, setStoredAuth } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStoredAuth(auth)
  }, [auth])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      setAuth(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const { data } = await apiClient.post('/auth/register', payload)
      setAuth(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiClient.post('/auth/logout').catch(() => {})
    setAuth(null)
  }, [])

  const value = {
    user: auth?.user ?? null,
    isAuthenticated: Boolean(auth?.accessToken),
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
