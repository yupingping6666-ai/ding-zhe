const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
}

function getToken(): string | null {
  return localStorage.getItem('dingzhe_token')
}

export function setToken(token: string) {
  localStorage.setItem('dingzhe_token', token)
}

export function clearToken() {
  localStorage.removeItem('dingzhe_token')
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    const json = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        error: json.error || { code: 'UNKNOWN', message: 'Unknown error' },
      }
    }

    return { ok: true, data: json.data }
  } catch (error) {
    return {
      ok: false,
      error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
    }
  }
}

export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const json = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        error: json.error || { code: 'UNKNOWN', message: 'Unknown error' },
      }
    }

    return { ok: true, data: json.data }
  } catch (error) {
    return {
      ok: false,
      error: { code: 'NETWORK_ERROR', message: 'Upload failed' },
    }
  }
}
