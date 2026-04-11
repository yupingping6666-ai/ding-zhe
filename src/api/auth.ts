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

// ===== Demo Mock =====
const DEMO_PHONE = '13800000000'
const DEMO_PASSWORD = '123456'
const DEMO_TOKEN = 'demo-token-dingzhe'
const DEMO_USER: UserProfile = {
  id: 'demo-user-001',
  nickname: '小橘主人',
  avatar: '',
  mode: 'dual',
  partnerId: null,
  onboarded: true,
  createdAt: new Date().toISOString(),
}

function isDemoAccount(phone: string) {
  return phone === DEMO_PHONE
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
  if (localStorage.getItem('dingzhe_token') === DEMO_TOKEN) {
    return { ok: true as const, data: DEMO_USER }
  }
  return apiFetch<UserProfile>('/user/me')
}

export function logout() {
  clearToken()
}

export async function loginWithPhone(phone: string, password: string) {
  if (isDemoAccount(phone)) {
    if (password === DEMO_PASSWORD) {
      setToken(DEMO_TOKEN)
      return { ok: true as const, user: DEMO_USER }
    }
    return { ok: false as const, error: { code: 'WRONG_PASSWORD', message: '密码错误' } }
  }

  const result = await apiFetch<{ token: string; user: UserProfile }>('/auth/login-phone', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })

  if (result.ok && result.data) {
    setToken(result.data.token)
    return { ok: true as const, user: result.data.user }
  }

  return { ok: false as const, error: result.error }
}

export async function register(phone: string, code: string, password: string) {
  const result = await apiFetch<{ token: string; user: UserProfile }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, code, password }),
  })

  if (result.ok && result.data) {
    setToken(result.data.token)
    return { ok: true as const, user: result.data.user }
  }

  return { ok: false as const, error: result.error }
}

export async function sendVerificationCode(phone: string, purpose: 'register' | 'reset_password') {
  return apiFetch<{ message: string }>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone, purpose }),
  })
}

export async function resetPassword(phone: string, code: string, newPassword: string) {
  const result = await apiFetch<{ token: string; user: UserProfile }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ phone, code, newPassword }),
  })

  if (result.ok && result.data) {
    setToken(result.data.token)
    return { ok: true as const, user: result.data.user }
  }

  return { ok: false as const, error: result.error }
}
