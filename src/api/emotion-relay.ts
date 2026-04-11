import { apiFetch } from './client'
import type { RelayGenerateResult } from '@/types'

interface RelayContext {
  senderName: string
  receiverName: string
  companionName: string
  relationDays: number
  relationType: string
}

interface RelayApiResult {
  gentle: string
  casual: string
  direct: string
  fallback: boolean
}

export async function generateRelayVersions(
  message: string,
  context: RelayContext,
  timeoutMs = 15000,
): Promise<RelayApiResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await apiFetch<RelayGenerateResult>('/emotion-relay/generate', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    })

    if (res.ok && res.data && res.data.gentle && res.data.casual && res.data.direct) {
      return { ...res.data, fallback: false }
    }

    console.warn('[EmotionRelay] API fallback:', res.ok ? 'incomplete response' : res.error)
    return { gentle: '', casual: '', direct: '', fallback: true }
  } catch (err) {
    console.warn('[EmotionRelay] API request failed:', err)
    return { gentle: '', casual: '', direct: '', fallback: true }
  } finally {
    clearTimeout(timer)
  }
}
