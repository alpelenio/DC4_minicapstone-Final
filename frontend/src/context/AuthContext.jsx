import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('barangaybook_token'))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem('barangaybook_token')
      setToken(null)
      setUser(null)
    }
    window.addEventListener('barangaybook:unauthorized', clearSession)
    if (!token) {
      setReady(true)
      return () => window.removeEventListener('barangaybook:unauthorized', clearSession)
    }
    api.get('/user')
      .then(({ data }) => setUser(data.data ?? data))
      .catch(clearSession)
      .finally(() => setReady(true))
    return () => window.removeEventListener('barangaybook:unauthorized', clearSession)
  }, [token])

  const acceptSession = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem('barangaybook_token', nextToken)
    setToken(nextToken)
    setUser(nextUser.data ?? nextUser)
    setReady(true)
  }

  const login = async (credentials) => {
    const { data } = await api.post('/login', credentials)
    acceptSession(data)
    return data.user
  }

  const register = async (details) => {
    const { data } = await api.post('/register', details)
    acceptSession(data)
    return data.user
  }

  const logout = async () => {
    try { await api.post('/logout') } finally {
      localStorage.removeItem('barangaybook_token')
      setToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
