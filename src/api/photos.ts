import { apiFetch, apiUpload } from './client'

export interface Photo {
  id: string
  userId: string
  mode: string
  url: string
  description: string | null
  relatedTaskId: string | null
  tags: string[]
  createdAt: string
}

export async function getPhotos(limit = 50) {
  return apiFetch<Photo[]>(`/photo/list?limit=${limit}`)
}

export async function uploadPhoto(
  file: File,
  options?: {
    description?: string
    relatedTaskId?: string
    mode?: string
    tags?: string[]
  }
) {
  const formData = new FormData()
  formData.append('file', file)

  if (options?.description) formData.append('description', options.description)
  if (options?.relatedTaskId) formData.append('relatedTaskId', options.relatedTaskId)
  if (options?.mode) formData.append('mode', options.mode)
  if (options?.tags) {
    options.tags.forEach((tag) => formData.append('tags[]', tag))
  }

  return apiUpload<Photo>('/photo/upload', formData)
}
