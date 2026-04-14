import { apiFetch } from './client'

export interface Narrative {
  id: string
  scope: 'self' | 'relationship'
  userId: string
  partnerId: string | null
  photoId: string | null
  taskIds: string[]
  content: string
  createdAt: string
}

export interface NarrativeFeelingInput {
  content: string
  mood: string
  photoCount: number
}

export async function generateNarrative(data: {
  scope: 'self' | 'relationship'
  partnerId?: string
  photoId?: string
  taskIds?: string[]
  feelings?: NarrativeFeelingInput[]
  photoUrls?: string[]
}) {
  return apiFetch<Narrative>('/narrative/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
