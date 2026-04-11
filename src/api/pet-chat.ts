import { apiFetch } from './client'

interface ChatHistory {
  role: 'user' | 'assistant'
  content: string
}

interface PetChatContext {
  companionName: string
  mood: string
  energy: number
  relationDays: number
}

interface PetChatResult {
  text: string
  fallback: boolean
}

export async function chatWithPet(
  message: string,
  history: ChatHistory[],
  context: PetChatContext,
  imageUrls?: string[],
  timeoutMs = 12000,
): Promise<PetChatResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Only pass valid http(s) URLs, filter out blob: and invalid URLs
    const safeImages = imageUrls?.filter(u => /^https?:\/\//.test(u))

    const body: Record<string, unknown> = { message, history, context }
    if (safeImages && safeImages.length > 0) {
      body.imageUrls = safeImages
    }

    const res = await apiFetch<PetChatResult>('/pet-chat/reply', {
      method: 'POST',
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (res.ok && res.data && !res.data.fallback && res.data.text) {
      return res.data
    }

    // Log why AI was not used
    console.warn('[PetChat] AI fallback:', res.ok ? 'empty/fallback response' : res.error)
    return { text: '', fallback: true }
  } catch (err) {
    console.warn('[PetChat] AI request failed:', err)
    return { text: '', fallback: true }
  } finally {
    clearTimeout(timer)
  }
}
