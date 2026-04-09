import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import type { UserProfile } from '@/api/auth'

interface ApiContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserProfile | null
  login: (nickname: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const ApiContext = createContext<ApiContextValue | null>(null)

export function useApi() {
  const ctx = useContext(ApiContext)
  if (!ctx) {
    throw new Error('useApi must be used within ApiProvider')
  }
  return ctx
}

interface ApiProviderProps {
  children: ReactNode
}

export function ApiProvider({ children }: ApiProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('dingzhe_token')
    if (token) {
      authApi.getUserProfile().then((result) => {
        if (result.ok && result.data) {
          setUser(result.data)
          setIsAuthenticated(true)
        } else {
          // Token invalid or expired
          localStorage.removeItem('dingzhe_token')
        }
        setIsLoading(false)
      }).catch(() => {
        localStorage.removeItem('dingzhe_token')
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (nickname: string) => {
    const result = await authApi.login(nickname)
    if (result.ok) {
      setUser(result.user)
      setIsAuthenticated(true)
      return { ok: true }
    }
    return { ok: false, error: result.error?.message }
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <ApiContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </ApiContext.Provider>
  )
}
