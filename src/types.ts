import type { CompanionAnimal, CompanionMood, RelationType } from '@/lib/companion'

// ---- Core enums ----
export type Category = 'health' | 'life' | 'work' | 'study' | 'other'
export type RepeatRule = 'once' | 'daily' | 'weekly'
export type FollowUpIntensity = 'light' | 'standard' | 'strong'
export type InstanceStatus = 'pending' | 'awaiting' | 'deferred' | 'completed' | 'skipped' | 'expired'

// ---- New: Item type & relation status ----
export type ItemType = 'care' | 'todo' | 'confirm'
export type RelationStatus = 'sent' | 'delivered' | 'seen' | 'responded' | 'resolved'

// ---- Pet & Space ----
export type PetMood = 'happy' | 'content' | 'neutral' | 'lonely' | 'sleepy'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type PetInteractionType = 'pet' | 'feed'

export interface PetState {
  mood: PetMood
  energy: number              // 0-100
  lastFed: number | null
  lastPetted: number | null
  todayInteractions: number
  interactionDate: string     // "YYYY-MM-DD"
}

export interface Anniversary {
  id: string
  title: string
  date: string                // "MM-DD"
  year: number | null         // optional start year for "Nth" calculation
  emoji: string
  isRecurring: boolean
}

export const PET_MOOD_CONFIG: Record<PetMood, { label: string; emoji: string; companionMood: CompanionMood }> = {
  happy: { label: '开心', emoji: '✨', companionMood: 'happy' },
  content: { label: '满足', emoji: '😊', companionMood: 'idle' },
  neutral: { label: '一般', emoji: '😐', companionMood: 'thinking' },
  lonely: { label: '想你们了', emoji: '🥺', companionMood: 'sad' },
  sleepy: { label: '困困的', emoji: '💤', companionMood: 'sleeping' },
}

// ---- User ----
export interface User {
  id: string
  name: string
  avatar: string // emoji
  partnerId: string
  onboarded: boolean
}

// ---- Relationship Space (shared between two users) ----
export interface RelationshipSpace {
  id: string
  userIds: [string, string]
  relationType: RelationType
  companion: CompanionAnimal
  createdAt: number
  petState: PetState
  anniversaries: Anniversary[]
}

// ---- Notification ----
export interface Notification {
  id: string
  toUserId: string
  message: string
  relatedTemplateId?: string
  timestamp: number
  read: boolean
}

// ---- Task template ----
export interface TaskTemplate {
  id: string
  name: string
  category: Category
  remindTime: string // "HH:mm"
  repeatRule: RepeatRule
  weeklyDays: number[] // 0=Sun, 1=Mon...
  followUpIntensity: FollowUpIntensity
  isActive: boolean
  createdAt: number
  // Dual-person fields
  itemType: ItemType
  creatorId: string
  receiverId: string
  note: string // creator's attached note (e.g. "天冷了记得穿厚点")
}

export interface ActionLog {
  timestamp: number
  action:
    | 'reminded'
    | 'user_completed'
    | 'user_deferred'
    | 'user_skipped'
    | 'auto_deferred'
    | 'follow_up_sent'
    | 'expired'
    | 'acknowledged'  // care: receiver tapped "好的💛"
    | 'feedback_sent' // confirm: receiver sent feedback text
    | 'cant_do'       // receiver said "做不了"
  note: string
}

export interface TaskInstance {
  id: string
  templateId: string
  scheduledTime: number
  status: InstanceStatus
  followUpCount: number
  maxFollowUps: number
  followUpInterval: number // minutes
  nextFollowUpAt: number | null
  deferredSince: number | null
  completedAt: number | null
  skippedAt: number | null
  expiredAt: number | null
  actionLog: ActionLog[]
  // Dual-person fields
  relationStatus: RelationStatus
  feedback: string | null // confirm type: receiver's feedback text
}

// ---- Config objects ----
export const CATEGORY_CONFIG: Record<Category, { emoji: string; label: string }> = {
  health: { emoji: '💊', label: '健康' },
  life: { emoji: '🏠', label: '生活' },
  work: { emoji: '💼', label: '工作' },
  study: { emoji: '📖', label: '学习' },
  other: { emoji: '📌', label: '其他' },
}

export const INTENSITY_CONFIG: Record<FollowUpIntensity, { label: string; desc: string; interval: number; maxFollowUps: number }> = {
  light: { label: '轻', desc: '偶尔提醒，不打扰', interval: 30, maxFollowUps: 2 },
  standard: { label: '标准', desc: '适度跟进，确保不忘', interval: 10, maxFollowUps: 3 },
  strong: { label: '强', desc: '紧密跟进，重要的事', interval: 5, maxFollowUps: 5 },
}

export const REPEAT_CONFIG: Record<RepeatRule, { label: string }> = {
  once: { label: '仅一次' },
  daily: { label: '每天' },
  weekly: { label: '每周' },
}

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export const ITEM_TYPE_CONFIG: Record<ItemType, {
  label: string
  emoji: string
  desc: string
  color: string
  defaultIntensity: FollowUpIntensity
  closureAction: string
  senderVerb: string
}> = {
  care: {
    label: '关心',
    emoji: '🧡',
    desc: '温柔的提醒，希望你好好的',
    color: 'care',
    defaultIntensity: 'light',
    closureAction: '收到啦~',
    senderVerb: '想提醒你',
  },
  todo: {
    label: '待办',
    emoji: '🍀',
    desc: '帮个忙，拜托啦',
    color: 'todo',
    defaultIntensity: 'standard',
    closureAction: '搞定啦!',
    senderVerb: '请你帮忙',
  },
  confirm: {
    label: '反馈',
    emoji: '💬',
    desc: '想知道结果，告诉我一声',
    color: 'confirm',
    defaultIntensity: 'standard',
    closureAction: '已回复',
    senderVerb: '想知道',
  },
}

// ---- NLP parsed result ----
export interface ParsedTask {
  name: string
  time: string | null            // "HH:mm"
  dateContext: 'today' | 'tomorrow' | 'day-after' | 'specific' | null
  specificDate: string | null    // "MM-DD"
  repeatRule: RepeatRule | null
  weeklyDays: number[]
  category: Category | null
  confidence: { time: boolean; repeat: boolean; category: boolean }
  receiver: string | null        // parsed receiver name, e.g. "小明"
  itemType: ItemType | null
}

export interface CreateTaskInput {
  name: string
  category: Category
  remindTime: string
  repeatRule: RepeatRule
  weeklyDays: number[]
  followUpIntensity: FollowUpIntensity
  // Dual-person fields
  itemType: ItemType
  creatorId: string
  receiverId: string
  note: string
}
