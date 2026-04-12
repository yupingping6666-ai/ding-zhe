import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import type { UserProfile } from '@/api/auth'

type AuthResult = { ok: boolean; error?: string }

interface ApiContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserProfile | null
  updateUser: (patch: Partial<UserProfile>) => void
  login: (nickname: string) => Promise<AuthResult>
  loginWithPhone: (phone: string, password: string) => Promise<AuthResult>
  register: (phone: string, code: string, password: string) => Promise<AuthResult>
  sendCode: (phone: string, purpose: 'register' | 'reset_password') => Promise<AuthResult>
  resetPassword: (phone: string, code: string, newPassword: string) => Promise<AuthResult>
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

  const loginWithPhone = useCallback(async (phone: string, password: string) => {
    const result = await authApi.loginWithPhone(phone, password)
    if (result.ok) {
      setUser(result.user)
      setIsAuthenticated(true)
      return { ok: true }
    }
    return { ok: false, error: result.error?.message }
  }, [])

  const register = useCallback(async (phone: string, code: string, password: string) => {
    const result = await authApi.register(phone, code, password)
    if (result.ok) {
      setUser(result.user)
      setIsAuthenticated(true)
      return { ok: true }
    }
    return { ok: false, error: result.error?.message }
  }, [])

  const sendCode = useCallback(async (phone: string, purpose: 'register' | 'reset_password') => {
    const result = await authApi.sendVerificationCode(phone, purpose)
    if (result.ok) {
      return { ok: true }
    }
    return { ok: false, error: result.error?.message }
  }, [])

  const resetPassword = useCallback(async (phone: string, code: string, newPassword: string) => {
    const result = await authApi.resetPassword(phone, code, newPassword)
    if (result.ok) {
      setUser(result.user)
      setIsAuthenticated(true)
      return { ok: true }
    }
    return { ok: false, error: result.error?.message }
  }, [])

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev)
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <ApiContext.Provider value={{
      isAuthenticated, isLoading, user, updateUser,
      login, loginWithPhone, register, sendCode, resetPassword, logout,
    }}>
      {children}
    </ApiContext.Provider>
  )
}
