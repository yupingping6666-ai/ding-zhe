import { apiFetch, setToken, clearToken } from './client'

export interface UserProfile {
  id: string
  nickname: string
  avatar: string
  mode: 'single' | 'dual'
  partnerId: string | null
  onboarded: boolean
  createdAt: string
  partner?: {
    id: string
    nickname: string
    avatar: string
  } | null
}

export async function login(nickname: string) {
  const result = await apiFetch<{ token: string; user: UserProfile }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  })

  if (result.ok && result.data) {
    setToken(result.data.token)
    return { ok: true as const, user: result.data.user }
  }

  return { ok: false as const, error: result.error }
}

export async function getUserProfile() {
  return apiFetch<UserProfile>('/user/me')
}

export function logout() {
  clearToken()
}
