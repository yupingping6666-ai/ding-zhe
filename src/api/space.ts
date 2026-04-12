import { apiFetch } from './client'
import type { CompanionAnimal, RelationType, PetState, Anniversary } from '../types'

export interface SpaceData {
  id: string
  companion: CompanionAnimal
  relationType: RelationType
  createdAt: number
  petState: PetState
  anniversaries: Anniversary[]
}

export async function getMySpace() {
  return apiFetch<SpaceData>('/space/my')
}

export async function updateCompanion(companion: CompanionAnimal) {
  return apiFetch<{ companion: CompanionAnimal }>('/space/companion', {
    method: 'POST',
    body: JSON.stringify({ companion }),
  })
}

export async function getAnniversaries() {
  return apiFetch<Anniversary[]>('/space/anniversaries')
}

export async function addAnniversary(data: {
  title: string
  date: string
  year: number | null
  emoji: string
  isRecurring: boolean
}) {
  return apiFetch<Anniversary>('/space/anniversaries', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      date_mm_dd: data.date,
      start_year: data.year,
      emoji: data.emoji,
      is_recurring: data.isRecurring,
    }),
  })
}

export async function updateAnniversary(id: string, patch: Partial<Omit<Anniversary, 'id'>>) {
  return apiFetch<Anniversary>(`/anniversaries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.date !== undefined && { date_mm_dd: patch.date }),
      ...(patch.year !== undefined && { start_year: patch.year }),
      ...(patch.emoji !== undefined && { emoji: patch.emoji }),
      ...(patch.isRecurring !== undefined && { is_recurring: patch.isRecurring }),
    }),
  })
}

export async function deleteAnniversary(id: string) {
  return apiFetch<{ id: string }>(`/anniversaries/${id}`, {
    method: 'DELETE',
  })
}

export async function petInteract(type: 'pet' | 'feed') {
  return apiFetch<PetState>('/space/pet-interact', {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}

export async function dissolveRelationship() {
  return apiFetch<{ mode: string }>('/relation/dissolve', {
    method: 'POST',
  })
}
