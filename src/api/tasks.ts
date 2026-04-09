import { apiFetch } from './client'

export interface TaskTemplate {
  id: string
  creatorId: string
  receiverId: string
  name: string
  category: string
  remindTime: string
  repeatRule: string
  weeklyDays: number[]
  followUpIntensity: string
  isActive: boolean
  itemType: string
  note: string
  createdAt: string
  instances: TaskInstance[]
}

export interface TaskInstance {
  id: string
  templateId: string
  scheduledTime: string
  status: string
  followUpCount: number
  maxFollowUps: number
  followUpInterval: number
  nextFollowUpAt: string | null
  deferredSince: string | null
  completedAt: string | null
  skippedAt: string | null
  expiredAt: string | null
  relationStatus: string
  feedback: string | null
  actionLog: Array<{ timestamp: number; action: string; note: string }>
}

export async function getTasks() {
  return apiFetch<TaskTemplate[]>('/task/list')
}

export async function createTask(data: {
  name: string
  category: string
  remindTime: string
  repeatRule: string
  weeklyDays: number[]
  followUpIntensity: string
  itemType: string
  receiverId: string
  note: string
}) {
  return apiFetch('/task/create', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateInstanceStatus(
  instanceId: string,
  status: string,
  feedback?: string
) {
  return apiFetch('/task/update_status', {
    method: 'POST',
    body: JSON.stringify({ instanceId, status, feedback }),
  })
}
