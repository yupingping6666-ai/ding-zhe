import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  TaskTemplate,
  TaskInstance,
  InstanceStatus,
  CreateTaskInput,
  User,
  Notification,
  RelationStatus,
  RelationshipSpace,
  PetState,
  PetInteractionType,
  Anniversary,
  FeelingEntry,
  Comment,
  NarrativeEntry,
  RelayMessage,
  RelayVersionType,
} from '@/types'
import { INTENSITY_CONFIG, ITEM_TYPE_CONFIG, inferTaskActionType } from '@/types'
import type { CompanionAnimal, RelationType } from '@/lib/companion'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { calculateMood, calculateEnergy, getTodayDateString } from '@/lib/pet-state'
import { isTodayAnniversary, daysUntilNext } from '@/lib/anniversary'
import { generateWarmComment, generatePetComment } from '@/lib/ai-comments'
import { generateDemoNarrativeEntry } from '@/lib/narrative'
import * as narrativeApi from '@/api/narrative'
import { generateVisionNarrative, isVisionAvailable } from '@/lib/vision-narrative'
import { storage } from '@/lib/storage'

// API integration (optional)
import * as taskApi from '@/api/tasks'
import * as spaceApi from '@/api/space'

// ---- helpers ----
let _id = 100
function uid() {
  return String(++_id)
}

function todayAt(h: number, m: number) {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

function minutesAgo(mins: number) {
  return Date.now() - mins * 60_000
}

// ---- users ----
export const USERS: User[] = [
  { id: 'user-1', name: '小红', avatar: '👧', partnerId: 'user-2', onboarded: true },
  { id: 'user-2', name: '小明', avatar: '👦', partnerId: 'user-1', onboarded: true },
]

// Live snapshot synced by useStore() so module-level getUser/getPartner reflect
// runtime edits (e.g. nickname/avatar updates via updateUserProfile).
let CURRENT_USERS: User[] = USERS.slice()
export function _syncCurrentUsers(list: User[]) {
  CURRENT_USERS = list
}

// ---- shared relationship space ----
const INITIAL_SPACE: RelationshipSpace = {
  id: 'space-1',
  userIds: ['user-1', 'user-2'],
  relationType: 'couple',
  companion: 'cat',
  createdAt: Date.now(),
  petState: {
    mood: 'content',
    energy: 60,
    lastFed: null,
    lastPetted: null,
    todayInteractions: 0,
    interactionDate: getTodayDateString(),
  },
  anniversaries: [],
}

export function getUser(id: string): User {
  return CURRENT_USERS.find((u) => u.id === id) || CURRENT_USERS[0]
}

export function getPartner(userId: string): User {
  const user = getUser(userId)
  return getUser(user.partnerId)
}

// ---- seed data ----
function createSeedData(): { templates: TaskTemplate[]; instances: TaskInstance[] } {
  const templates: TaskTemplate[] = [
    // --- 小红 → 小明 (care) ---
    {
      id: '1', name: '记得喝水', category: 'health', remindTime: '09:30',
      repeatRule: 'daily', weeklyDays: [], followUpIntensity: 'light',
      isActive: true, createdAt: Date.now() - 7 * 86400000,
      itemType: 'care', creatorId: 'user-1', receiverId: 'user-2',
      note: '多喝热水哦~',
    },
    {
      id: '2', name: '早点睡觉', category: 'health', remindTime: '22:30',
      repeatRule: 'daily', weeklyDays: [], followUpIntensity: 'light',
      isActive: true, createdAt: Date.now() - 5 * 86400000,
      itemType: 'care', creatorId: 'user-1', receiverId: 'user-2',
      note: '别熬夜了~',
    },
    // --- 小红 → 小明 (todo) ---
    {
      id: '3', name: '取快递', category: 'life', remindTime: '18:00',
      repeatRule: 'once', weeklyDays: [], followUpIntensity: 'standard',
      isActive: true, createdAt: Date.now() - 1 * 86400000,
      itemType: 'todo', creatorId: 'user-1', receiverId: 'user-2',
      note: '菜鸟驿站 A205',
      actionType: 'pickup',
    },
    {
      id: '4', name: '洗碗', category: 'life', remindTime: '20:00',
      repeatRule: 'daily', weeklyDays: [], followUpIntensity: 'standard',
      isActive: true, createdAt: Date.now() - 3 * 86400000,
      itemType: 'todo', creatorId: 'user-1', receiverId: 'user-2',
      note: '',
    },
    // --- 小明 → 小红 (care) ---
    {
      id: '5', name: '吃药', category: 'health', remindTime: '08:00',
      repeatRule: 'daily', weeklyDays: [], followUpIntensity: 'standard',
      isActive: true, createdAt: Date.now() - 7 * 86400000,
      itemType: 'care', creatorId: 'user-2', receiverId: 'user-1',
      note: '饭后半小时吃',
    },
    // --- 小明 → 小红 (todo) ---
    {
      id: '6', name: '遛狗', category: 'life', remindTime: '07:30',
      repeatRule: 'daily', weeklyDays: [], followUpIntensity: 'standard',
      isActive: true, createdAt: Date.now() - 7 * 86400000,
      itemType: 'todo', creatorId: 'user-2', receiverId: 'user-1',
      note: '去公园那边',
    },
    // --- 小明 → 小红 (confirm) ---
    {
      id: '7', name: '今天面试怎么样', category: 'work', remindTime: '19:00',
      repeatRule: 'once', weeklyDays: [], followUpIntensity: 'light',
      isActive: true, createdAt: Date.now() - 0.5 * 86400000,
      itemType: 'confirm', creatorId: 'user-2', receiverId: 'user-1',
      note: '加油！不管怎样都很棒',
    },
    // --- 小红 → 小明 (confirm) ---
    {
      id: '8', name: '驾考科目二过了吗', category: 'study', remindTime: '17:00',
      repeatRule: 'once', weeklyDays: [], followUpIntensity: 'standard',
      isActive: true, createdAt: Date.now() - 0.3 * 86400000,
      itemType: 'confirm', creatorId: 'user-1', receiverId: 'user-2',
      note: '别紧张，你一定行的',
    },
    // --- Self reminders (creator = receiver) ---
    {
      id: '9', name: '晨跑', category: 'health', remindTime: '06:30',
      repeatRule: 'weekly', weeklyDays: [1, 3, 5], followUpIntensity: 'strong',
      isActive: true, createdAt: Date.now() - 10 * 86400000,
      itemType: 'todo', creatorId: 'user-1', receiverId: 'user-1',
      note: '',
    },
    {
      id: '10', name: '准备明天的东西', category: 'life', remindTime: '21:00',
      repeatRule: 'daily', weeklyDays: [], followUpIntensity: 'standard',
      isActive: true, createdAt: Date.now() - 2 * 86400000,
      itemType: 'todo', creatorId: 'user-2', receiverId: 'user-2',
      note: '',
    },
  ]

  const now = Date.now()
  const instances: TaskInstance[] = [
    // --- 小红→小明: "记得喝水" care, deferred ---
    {
      id: '101', templateId: '1', scheduledTime: todayAt(9, 30),
      status: 'deferred', followUpCount: 1, maxFollowUps: 2,
      followUpInterval: 30, nextFollowUpAt: now + 15 * 60000,
      deferredSince: minutesAgo(40), completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'delivered', feedback: null,
      actionLog: [
        { timestamp: todayAt(9, 30), action: 'reminded', note: '发出提醒' },
        { timestamp: todayAt(9, 35), action: 'auto_deferred', note: '未响应，自动进入待完成' },
        { timestamp: todayAt(10, 5), action: 'follow_up_sent', note: '第1次跟进提醒' },
      ],
    },
    // --- 小红→小明: "取快递" todo, awaiting ---
    {
      id: '102', templateId: '3', scheduledTime: todayAt(18, 0),
      status: 'awaiting', followUpCount: 0, maxFollowUps: 3,
      followUpInterval: 10, nextFollowUpAt: null,
      deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'sent', feedback: null,
      actionLog: [
        { timestamp: todayAt(18, 0), action: 'reminded', note: '发出提醒' },
      ],
    },
    // --- 小红→小明: "洗碗" todo, pending ---
    {
      id: '103', templateId: '4', scheduledTime: todayAt(20, 0),
      status: 'pending', followUpCount: 0, maxFollowUps: 3,
      followUpInterval: 10, nextFollowUpAt: null,
      deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'sent', feedback: null,
      actionLog: [],
    },
    // --- 小红→小明: "驾考科目二过了吗" confirm, pending ---
    {
      id: '104', templateId: '8', scheduledTime: todayAt(17, 0),
      status: 'pending', followUpCount: 0, maxFollowUps: 3,
      followUpInterval: 10, nextFollowUpAt: null,
      deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'sent', feedback: null,
      actionLog: [],
    },
    // --- 小明→小红: "吃药" care, deferred ---
    {
      id: '105', templateId: '5', scheduledTime: todayAt(8, 0),
      status: 'deferred', followUpCount: 2, maxFollowUps: 3,
      followUpInterval: 10, nextFollowUpAt: now + 5 * 60000,
      deferredSince: minutesAgo(47), completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'delivered', feedback: null,
      actionLog: [
        { timestamp: todayAt(8, 0), action: 'reminded', note: '发出提醒' },
        { timestamp: todayAt(8, 3), action: 'auto_deferred', note: '未响应，自动进入待完成' },
        { timestamp: todayAt(8, 13), action: 'follow_up_sent', note: '第1次跟进提醒' },
        { timestamp: todayAt(8, 23), action: 'follow_up_sent', note: '第2次跟进提醒' },
      ],
    },
    // --- 小明→小红: "遛狗" todo, completed ---
    {
      id: '106', templateId: '6', scheduledTime: todayAt(7, 30),
      status: 'completed', followUpCount: 0, maxFollowUps: 3,
      followUpInterval: 10, nextFollowUpAt: null,
      deferredSince: null, completedAt: todayAt(7, 45), skippedAt: null, expiredAt: null,
      relationStatus: 'responded', feedback: null,
      actionLog: [
        { timestamp: todayAt(7, 30), action: 'reminded', note: '发出提醒' },
        { timestamp: todayAt(7, 45), action: 'user_completed', note: '已完成' },
      ],
    },
    // --- 小明→小红: "今天面试怎么样" confirm, awaiting ---
    {
      id: '107', templateId: '7', scheduledTime: todayAt(19, 0),
      status: 'awaiting', followUpCount: 0, maxFollowUps: 2,
      followUpInterval: 30, nextFollowUpAt: null,
      deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'delivered', feedback: null,
      actionLog: [
        { timestamp: todayAt(19, 0), action: 'reminded', note: '发出提醒' },
      ],
    },
    // --- 小红→小明: "早点睡觉" care, completed ---
    {
      id: '108', templateId: '2', scheduledTime: todayAt(22, 30),
      status: 'completed', followUpCount: 0, maxFollowUps: 2,
      followUpInterval: 30, nextFollowUpAt: null,
      deferredSince: null, completedAt: minutesAgo(30), skippedAt: null, expiredAt: null,
      relationStatus: 'responded', feedback: null,
      actionLog: [
        { timestamp: todayAt(22, 30), action: 'reminded', note: '发出提醒' },
        { timestamp: minutesAgo(30), action: 'acknowledged', note: '好的💛' },
      ],
    },
    // --- Self: 小红晨跑, skipped ---
    {
      id: '109', templateId: '9', scheduledTime: todayAt(6, 30),
      status: 'skipped', followUpCount: 0, maxFollowUps: 5,
      followUpInterval: 5, nextFollowUpAt: null,
      deferredSince: null, completedAt: null, skippedAt: todayAt(6, 32), expiredAt: null,
      relationStatus: 'responded', feedback: null,
      actionLog: [
        { timestamp: todayAt(6, 30), action: 'reminded', note: '发出提醒' },
        { timestamp: todayAt(6, 32), action: 'user_skipped', note: '已跳过' },
      ],
    },
    // --- Self: 小明准备明天东西, pending ---
    {
      id: '110', templateId: '10', scheduledTime: todayAt(21, 0),
      status: 'pending', followUpCount: 0, maxFollowUps: 3,
      followUpInterval: 10, nextFollowUpAt: null,
      deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
      relationStatus: 'sent', feedback: null,
      actionLog: [],
    },
  ]

  return { templates, instances }
}

// ---- hook ----
export function useStore(options?: { apiMode?: boolean }) {
  const { apiMode = false } = options || {}
  const seed = createSeedData()

  // Use lazy initialization: prefer localStorage cache, fallback to seed data
  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const cached = storage.load<TaskTemplate[]>('templates')
    if (!cached) return seed.templates
    // Backfill actionType for legacy records (pre-MVP data)
    return cached.map((t) => ({
      ...t,
      actionType: t.actionType ?? inferTaskActionType(t.name),
    }))
  })
  const [instances, setInstances] = useState<TaskInstance[]>(() =>
    storage.load<TaskInstance[]>('instances') ?? seed.instances
  )
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'skip' } | null>(null)
  const [users, setUsers] = useState<User[]>(() =>
    storage.load<User[]>('users') ?? USERS
  )

  // Keep module-level getUser/getPartner in sync with live state so any call
  // site (including legacy imports) reads the latest nickname/avatar.
  useEffect(() => {
    _syncCurrentUsers(users)
  }, [users])
  const [space, setSpace] = useState<RelationshipSpace>(() =>
    storage.load<RelationshipSpace>('space') ?? INITIAL_SPACE
  )
  const [isApiLoading, setIsApiLoading] = useState(false)

  // ---- Relay messages state ----
  const [relayMessages, setRelayMessages] = useState<RelayMessage[]>(() =>
    storage.load<RelayMessage[]>('relayMessages') ?? []
  )

  // ---- Feelings state ----
  const FEELINGS_SEED: FeelingEntry[] = [
    {
      id: 'feeling-1', userId: 'user-1', content: '今天心情还不错，阳光很好', mood: '😊',
      entryType: 'mood', createdAt: Date.now() - 2 * 3600000, isDraft: false,
    },
    {
      id: 'feeling-2', userId: 'user-1', content: '工作压力有点大，需要找个方式放松', mood: '😔',
      entryType: 'text', createdAt: Date.now() - 5 * 3600000, isDraft: false,
    },
    {
      id: 'feeling-3', userId: 'user-1', content: '下午在公园散步，很舒服', mood: '🌿',
      entryType: 'mood', createdAt: Date.now() - 8 * 3600000, isDraft: false,
    },
    {
      id: 'feeling-photo-1', userId: 'user-1', content: '和TA一起吃了晚餐，很温暖', mood: '🥰',
      entryType: 'photo', createdAt: Date.now() - 24 * 3600000, isDraft: false,
      photoUrls: ['https://picsum.photos/seed/dinner1/400/300', 'https://picsum.photos/seed/dinner2/400/300'],
      photoUrl: 'https://picsum.photos/seed/dinner1/400/300',
      location: { lat: 39.9042, lng: 116.4074, name: '北京市朝阳区' },
    },
    {
      id: 'feeling-photo-2', userId: 'user-1', content: '周末去了海边，天气超好', mood: '😊',
      entryType: 'photo', createdAt: Date.now() - 48 * 3600000, isDraft: false,
      photoUrls: [
        'https://picsum.photos/seed/beach1/400/300',
        'https://picsum.photos/seed/beach2/400/300',
        'https://picsum.photos/seed/beach3/400/300',
      ],
      photoUrl: 'https://picsum.photos/seed/beach1/400/300',
      location: { lat: 36.0671, lng: 120.3826, name: '青岛市崂山区' },
    },
    {
      id: 'feeling-photo-3', userId: 'user-1', content: '今天的咖啡特别好喝', mood: '😌',
      entryType: 'photo', createdAt: Date.now() - 72 * 3600000, isDraft: false,
      photoUrls: ['https://picsum.photos/seed/coffee1/400/300'],
      photoUrl: 'https://picsum.photos/seed/coffee1/400/300',
    },
    {
      id: 'feeling-hidden-1', userId: 'user-1', content: '这条是隐藏的记录', mood: '💭',
      entryType: 'mood', createdAt: Date.now() - 96 * 3600000, isDraft: false,
      isHidden: true,
    },
    // --- user-2 seed feelings (dual mode sharing) ---
    {
      id: 'feeling-u2-1', userId: 'user-2', content: '今天加班到很晚，但感觉很有成就感', mood: '💪',
      entryType: 'mood', createdAt: Date.now() - 3 * 3600000, isDraft: false,
    },
    {
      id: 'feeling-u2-2', userId: 'user-2', content: '给TA做了一顿饭，看到TA开心的样子，值了', mood: '🥰',
      entryType: 'photo', createdAt: Date.now() - 30 * 3600000, isDraft: false,
      photoUrls: ['https://picsum.photos/seed/cook1/400/300', 'https://picsum.photos/seed/cook2/400/300'],
      photoUrl: 'https://picsum.photos/seed/cook1/400/300',
    },
    {
      id: 'feeling-u2-hidden', userId: 'user-2', content: '小明的隐藏记录', mood: '🤫',
      entryType: 'mood', createdAt: Date.now() - 80 * 3600000, isDraft: false,
      isHidden: true,
    },
  ]

  const [feelings, setFeelings] = useState<FeelingEntry[]>(() =>
    storage.load<FeelingEntry[]>('feelings') ?? FEELINGS_SEED
  )

  // ---- Comments state ----
  const COMMENTS_SEED: Comment[] = [
    { id: 'comment-seed-1', entryId: 'feeling-1', content: '看起来今天是美好的一天！', author: 'ai', createdAt: Date.now() - 2 * 3600000 + 500 },
    { id: 'comment-seed-2', entryId: 'feeling-2', content: '抱抱你，一切都会好起来的 🤗', author: 'ai', createdAt: Date.now() - 5 * 3600000 + 500 },
    { id: 'comment-seed-3', entryId: 'feeling-3', content: '每个瞬间都值得被珍惜 💫', author: 'ai', createdAt: Date.now() - 8 * 3600000 + 500 },
  ]
  const [comments, setComments] = useState<Comment[]>(() =>
    storage.load<Comment[]>('comments') ?? COMMENTS_SEED
  )

  // ---- Narratives state ----
  const [narratives, setNarratives] = useState<NarrativeEntry[]>(() =>
    storage.load<NarrativeEntry[]>('narratives') ?? []
  )

  // Fetch from API when apiMode is enabled
  useEffect(() => {
    if (!apiMode) return
    setIsApiLoading(true)
    Promise.all([
      taskApi.getTasks(),
      spaceApi.getMySpace(),
    ]).then(([taskResult, spaceResult]) => {
      if (taskResult.ok && taskResult.data) {
        const apiTemplates: TaskTemplate[] = []
        const apiInstances: TaskInstance[] = []
        for (const tpl of taskResult.data) {
          apiTemplates.push({
            id: tpl.id, creatorId: tpl.creatorId, receiverId: tpl.receiverId,
            name: tpl.name, category: tpl.category, remindTime: tpl.remindTime,
            repeatRule: tpl.repeatRule, weeklyDays: tpl.weeklyDays,
            followUpIntensity: tpl.followUpIntensity, isActive: tpl.isActive,
            itemType: tpl.itemType, note: tpl.note, createdAt: tpl.createdAt,
          })
          for (const inst of tpl.instances) { apiInstances.push(inst) }
        }
        setTemplates(apiTemplates)
        setInstances(apiInstances)
      }
      if (spaceResult.ok && spaceResult.data) {
        const sp = spaceResult.data!
        const loadedAnniversaries = sp.anniversaries
        setSpace({
          id: sp.id,
          userIds: [],
          relationType: sp.relationType,
          companion: sp.companion,
          createdAt: sp.createdAt,
          petState: sp.petState,
          anniversaries: loadedAnniversaries,
        })
      }
      setIsApiLoading(false)
    }).catch(() => setIsApiLoading(false))
  }, [apiMode])

  // ---- localStorage auto-sync: persist state changes ----
  const isInitialMount = useRef(true)
  useEffect(() => {
    // Skip the first render to avoid overwriting cache with initial state
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    storage.save('users', users)
    storage.save('space', space)
    storage.save('templates', templates)
    storage.save('instances', instances)
    storage.save('feelings', feelings)
    storage.save('comments', comments)
    storage.save('narratives', narratives)
    storage.save('relayMessages', relayMessages)
  }, [users, space, templates, instances, feelings, comments, narratives, relayMessages])

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'skip' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2200)
  }, [])

  const addNotification = useCallback((toUserId: string, message: string, relatedTemplateId?: string) => {
    setNotifications((prev) => [
      ...prev,
      {
        id: uid(),
        toUserId,
        message,
        relatedTemplateId,
        timestamp: Date.now(),
        read: false,
      },
    ])
  }, [])

  const dismissNotification = useCallback((notifId: string) => {
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n))
  }, [])

  const getTemplate = useCallback(
    (templateId: string) => templates.find((t) => t.id === templateId),
    [templates]
  )

  // ---- Derived: per-user filtered lists ----
  const getReceivedItems = useCallback(
    (userId: string) => {
      return instances.filter((inst) => {
        const tpl = templates.find((t) => t.id === inst.templateId)
        return tpl && tpl.receiverId === userId
      })
    },
    [instances, templates]
  )

  const getSentItems = useCallback(
    (userId: string) => {
      return instances.filter((inst) => {
        const tpl = templates.find((t) => t.id === inst.templateId)
        return tpl && tpl.creatorId === userId && tpl.receiverId !== userId
      })
    },
    [instances, templates]
  )

  const getUserNotifications = useCallback(
    (userId: string) => notifications.filter((n) => n.toUserId === userId && !n.read),
    [notifications]
  )

  // ---- Actions ----
  const completeInstance = useCallback((instanceId: string, actionNote?: string, photoUrl?: string) => {
    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== instanceId) return inst
        const tpl = templates.find((t) => t.id === inst.templateId)
        const itemType = tpl?.itemType || 'todo'
        const baseNote = itemType === 'care' ? '好的💛' : '做好了'
        const action = itemType === 'care' ? 'acknowledged' as const : 'user_completed' as const
        const actionNoteText = actionNote ? `${baseNote}｜${actionNote}` : baseNote
        return {
          ...inst,
          status: 'completed' as InstanceStatus,
          completedAt: Date.now(),
          nextFollowUpAt: null,
          relationStatus: 'responded' as RelationStatus,
          actionLog: [
            ...inst.actionLog,
            { timestamp: Date.now(), action, note: actionNoteText, ...(photoUrl ? { photoUrl } : {}) },
          ],
        }
      })
    )
    // Notify creator
    const inst = instances.find((i) => i.id === instanceId)
    if (inst) {
      const tpl = templates.find((t) => t.id === inst.templateId)
      if (tpl && tpl.creatorId !== tpl.receiverId) {
        const receiverName = getUser(tpl.receiverId).name
        const itemType = tpl.itemType
        const msg = itemType === 'care'
          ? `${receiverName} 收到了你的关心「${tpl.name}」🧡`
          : `${receiverName} 完成了「${tpl.name}」🌟`
        addNotification(tpl.creatorId, msg, tpl.id)
      }
    }
    showToast('做好了', 'success')
  }, [showToast, instances, templates, addNotification])

  const deferInstance = useCallback((instanceId: string, delayMinutes: number) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === instanceId
          ? {
              ...inst,
              status: 'deferred' as InstanceStatus,
              deferredSince: inst.deferredSince || Date.now(),
              nextFollowUpAt: Date.now() + delayMinutes * 60000,
              actionLog: [
                ...inst.actionLog,
                {
                  timestamp: Date.now(),
                  action: 'user_deferred' as const,
                  note: `选择${delayMinutes}分钟后提醒`,
                },
              ],
            }
          : inst
      )
    )
    showToast(`${delayMinutes} 分钟后再提醒你`, 'info')
  }, [showToast])

  const skipInstance = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === instanceId
          ? {
              ...inst,
              status: 'skipped' as InstanceStatus,
              skippedAt: Date.now(),
              nextFollowUpAt: null,
              relationStatus: 'responded' as RelationStatus,
              actionLog: [
                ...inst.actionLog,
                { timestamp: Date.now(), action: 'user_skipped' as const, note: '已跳过' },
              ],
            }
          : inst
      )
    )
    showToast('这次跳过了', 'skip')
  }, [showToast])

  const cantDoInstance = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== instanceId) return inst
        return {
          ...inst,
          status: 'skipped' as InstanceStatus,
          skippedAt: Date.now(),
          nextFollowUpAt: null,
          relationStatus: 'responded' as RelationStatus,
          actionLog: [
            ...inst.actionLog,
            { timestamp: Date.now(), action: 'cant_do' as const, note: '做不了' },
          ],
        }
      })
    )
    // Notify creator
    const inst = instances.find((i) => i.id === instanceId)
    if (inst) {
      const tpl = templates.find((t) => t.id === inst.templateId)
      if (tpl && tpl.creatorId !== tpl.receiverId) {
        const receiverName = getUser(tpl.receiverId).name
        addNotification(tpl.creatorId, `${receiverName} 暂时做不了「${tpl.name}」`, tpl.id)
      }
    }
    showToast('已告知对方', 'info')
  }, [showToast, instances, templates, addNotification])

  const respondWithFeedback = useCallback((instanceId: string, feedbackText: string) => {
    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== instanceId) return inst
        return {
          ...inst,
          status: 'completed' as InstanceStatus,
          completedAt: Date.now(),
          nextFollowUpAt: null,
          relationStatus: 'responded' as RelationStatus,
          feedback: feedbackText,
          actionLog: [
            ...inst.actionLog,
            { timestamp: Date.now(), action: 'feedback_sent' as const, note: feedbackText },
          ],
        }
      })
    )
    // Notify creator
    const inst = instances.find((i) => i.id === instanceId)
    if (inst) {
      const tpl = templates.find((t) => t.id === inst.templateId)
      if (tpl && tpl.creatorId !== tpl.receiverId) {
        const receiverName = getUser(tpl.receiverId).name
        addNotification(tpl.creatorId, `${receiverName} 回复了「${tpl.name}」: ${feedbackText}`, tpl.id)
      }
    }
    showToast('已回复', 'success')
  }, [showToast, instances, templates, addNotification])

  const markSeen = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === instanceId && (inst.relationStatus === 'sent' || inst.relationStatus === 'delivered')
          ? { ...inst, relationStatus: 'seen' as RelationStatus }
          : inst
      )
    )
  }, [])

  // ---- Draft task flow ----
  const saveDraftTask = useCallback(
    (data: CreateTaskInput) => {
      const templateId = uid()
      const intensity = INTENSITY_CONFIG[data.followUpIntensity]
      const [h, m] = data.remindTime.split(':').map(Number)

      const newTemplate: TaskTemplate = {
        id: templateId, name: data.name, category: data.category,
        remindTime: data.remindTime, repeatRule: data.repeatRule,
        weeklyDays: data.weeklyDays, followUpIntensity: data.followUpIntensity,
        isActive: true, createdAt: Date.now(), itemType: data.itemType,
        creatorId: data.creatorId, receiverId: data.receiverId, note: data.note,
      }

      const newInstance: TaskInstance = {
        id: uid(), templateId, scheduledTime: todayAt(h, m),
        status: 'pending', followUpCount: 0, maxFollowUps: intensity.maxFollowUps,
        followUpInterval: intensity.interval, nextFollowUpAt: null,
        deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
        actionLog: [], relationStatus: 'draft', feedback: null,
      }

      setTemplates((prev) => [...prev, newTemplate])
      setInstances((prev) => [...prev, newInstance])
      // NO notification for drafts
      showToast('已保存为草稿', 'info')
    },
    [showToast]
  )

  const promoteDraftToSent = useCallback(
    (templateId: string) => {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.templateId === templateId && inst.relationStatus === 'draft'
            ? { ...inst, relationStatus: 'sent' as RelationStatus }
            : inst
        )
      )
      // Notify receiver
      const tpl = templates.find((t) => t.id === templateId)
      if (tpl && tpl.creatorId !== tpl.receiverId) {
        const creatorName = getUser(tpl.creatorId).name
        const typeLabel = ITEM_TYPE_CONFIG[tpl.itemType].label
        addNotification(
          tpl.receiverId,
          `${creatorName} 给你发了${typeLabel}「${tpl.name}」`,
          templateId
        )
      }

      showToast('已发送给 TA', 'success')
    },
    [showToast, templates, addNotification]
  )

  // ---- Feelings ----
  const saveFeeling = useCallback(
    (content: string, mood: string, aboutPartnerId?: string, entryType?: FeelingEntry['entryType'], photoUrls?: string[], location?: FeelingEntry['location'], mediaTypes?: FeelingEntry['mediaTypes']): string => {
      const feelingId = uid()
      const newFeeling: FeelingEntry = {
        id: feelingId, userId: users[0].id, content, mood,
        entryType, aboutPartnerId, photoUrl: photoUrls?.[0], photoUrls,
        location, mediaTypes,
        createdAt: Date.now(), isDraft: false,
      }
      setFeelings((prev) => [...prev, newFeeling])
      // Auto-generate AI comment
      const aiText = generateWarmComment(content, mood, !!(photoUrls && photoUrls.length > 0))
      const aiComment: Comment = {
        id: uid(), entryId: feelingId, content: aiText, author: 'ai', createdAt: Date.now() + 500,
      }
      setComments((prev) => [...prev, aiComment])
      showToast('感受已记录', 'success')
      return feelingId
    },
    [showToast]
  )

  const convertFeelingToTask = useCallback(
    (feelingId: string) => {
      const feeling = feelings.find((f) => f.id === feelingId)
      if (!feeling || !feeling.aboutPartnerId) return

      const newTemplate: TaskTemplate = {
        id: uid(), name: feeling.content.substring(0, 20),
        category: 'other', remindTime: '12:00', repeatRule: 'once',
        weeklyDays: [], followUpIntensity: 'light', isActive: true,
        createdAt: Date.now(), itemType: 'care',
        creatorId: feeling.userId, receiverId: feeling.aboutPartnerId,
        note: feeling.content,
      }

      const newInstance: TaskInstance = {
        id: uid(), templateId: newTemplate.id, scheduledTime: todayAt(12, 0),
        status: 'pending', followUpCount: 0, maxFollowUps: 2,
        followUpInterval: 30, nextFollowUpAt: null,
        deferredSince: null, completedAt: null, skippedAt: null, expiredAt: null,
        actionLog: [], relationStatus: 'draft', feedback: null,
      }

      setTemplates((prev) => [...prev, newTemplate])
      setInstances((prev) => [...prev, newInstance])
      setFeelings((prev) => prev.filter((f) => f.id !== feelingId))
      showToast('已转为草稿任务', 'info')
    },
    [showToast, feelings]
  )

  const createTask = useCallback(
    (data: CreateTaskInput) => {
      const templateId = uid()
      const intensity = INTENSITY_CONFIG[data.followUpIntensity]
      const [h, m] = data.remindTime.split(':').map(Number)

      // Calculate scheduled time with date offset
      const now = new Date()
      let scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      if (data.scheduledDateOffset && data.scheduledDateOffset > 0) {
        // Add days offset
        scheduledDate.setDate(scheduledDate.getDate() + data.scheduledDateOffset)
      } else if (data.specificDate) {
        // Parse specific date "MM-DD"
        const [month, day] = data.specificDate.split('-').map(Number)
        scheduledDate = new Date(now.getFullYear(), month - 1, day)
        // If the date is in the past this year, use next year
        if (scheduledDate < now) {
          scheduledDate.setFullYear(scheduledDate.getFullYear() + 1)
        }
      }

      const scheduledTime = scheduledDate.getTime() + h * 3600000 + m * 60000

      const newTemplate: TaskTemplate = {
        id: templateId,
        name: data.name,
        category: data.category,
        remindTime: data.remindTime,
        repeatRule: data.repeatRule,
        weeklyDays: data.weeklyDays,
        followUpIntensity: data.followUpIntensity,
        isActive: true,
        createdAt: Date.now(),
        itemType: data.itemType,
        creatorId: data.creatorId,
        receiverId: data.receiverId,
        note: data.note,
        actionType: data.actionType ?? inferTaskActionType(data.name),
      }

      const newInstance: TaskInstance = {
        id: uid(),
        templateId,
        scheduledTime,
        status: 'pending',
        followUpCount: 0,
        maxFollowUps: intensity.maxFollowUps,
        followUpInterval: intensity.interval,
        nextFollowUpAt: null,
        deferredSince: null,
        completedAt: null,
        skippedAt: null,
        expiredAt: null,
        actionLog: [],
        relationStatus: 'sent',
        feedback: null,
      }

      setTemplates((prev) => [...prev, newTemplate])
      setInstances((prev) => [...prev, newInstance])

      // Notify receiver if it's for someone else
      if (data.receiverId !== newTemplate.creatorId) {
        const creatorName = getUser(newTemplate.creatorId).name
        const typeLabel = ITEM_TYPE_CONFIG[data.itemType].label
        addNotification(
          data.receiverId,
          `${creatorName} 给你发了${typeLabel}「${data.name}」`,
          templateId
        )
      }

      showToast('已创建，到时间会提醒', 'success')
    },
    [showToast, addNotification]
  )

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    setInstances((prev) => prev.filter((i) => i.templateId !== templateId))
    showToast('已删除', 'info')
  }, [showToast])

  const updateTemplate = useCallback((templateId: string, patch: Partial<Pick<TaskTemplate, 'name' | 'remindTime' | 'repeatRule' | 'weeklyDays' | 'category' | 'followUpIntensity' | 'receiverId'>>) => {
    setTemplates((prev) => prev.map((t) => t.id === templateId ? { ...t, ...patch } : t))
    showToast('已更新', 'success')
  }, [showToast])

  const updateInstanceDate = useCallback((instanceId: string, newDate: Date) => {
    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== instanceId) return inst
        // Keep the original time (hours and minutes), just change the date
        const oldDate = new Date(inst.scheduledTime)
        const newScheduledTime = new Date(newDate)
        newScheduledTime.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0)
        return { ...inst, scheduledTime: newScheduledTime.getTime() }
      })
    )
  }, [])

  // ---- User profile management ----
  const getUserProfile = useCallback(
    (userId: string) => users.find((u) => u.id === userId) || users[0],
    [users]
  )

  // ---- Shared space management ----
  const updateSpaceCompanion = useCallback((companion: CompanionAnimal) => {
    if (apiMode) {
      spaceApi.updateCompanion(companion).then((result) => {
        if (result.ok && result.data) setSpace((prev) => ({ ...prev, companion }))
      })
    } else {
      setSpace((prev) => ({ ...prev, companion }))
    }
  }, [apiMode])

  const updateSpaceRelationType = useCallback((relationType: RelationType) => {
    setSpace((prev) => ({ ...prev, relationType }))
  }, [])

  const setUserCity = useCallback((userId: string, city: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, userCity: city } : u))
  }, [])

  const updateUserProfile = useCallback((userId: string, patch: Partial<Pick<User, 'name' | 'avatar' | 'userCity' | 'birthday' | 'bio'>>) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...patch } : u))
  }, [])

  const completeOnboarding = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, onboarded: true } : u))
  }, [])

  const resetOnboarding = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, onboarded: false } : u))
  }, [])

  // ---- Bind partner (invite-code pairing) ----
  const bindPartner = useCallback((userId: string, partnerId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) return { ...u, partnerId, onboarded: false }
      if (u.id === partnerId) return { ...u, partnerId: userId, onboarded: false }
      return u
    }))
    setSpace(prev => ({
      ...prev,
      userIds: [userId, partnerId] as [string, string],
      createdAt: Date.now(),
      petState: { ...prev.petState, interactionDate: getTodayDateString() },
    }))
    showToast('配对成功！', 'success')
  }, [showToast])

  // ---- Dissolve relationship ----
  const dissolveRelationship = useCallback(async () => {
    if (apiMode) {
      const result = await spaceApi.dissolveRelationship()
      if (!result.ok) return
    }
    setUsers((prev) => prev.map((u) => ({ ...u, partnerId: '' })))
    setSpace({ ...INITIAL_SPACE, anniversaries: [] })
    setRelayMessages([])
    // Clear localStorage as relationship is intentionally dissolved
    storage.clearAll()
    showToast('关系已解除', 'info')
  }, [apiMode, showToast])

  // ---- Pet interaction ----
  const petInteraction = useCallback((type: PetInteractionType) => {
    if (apiMode) {
      spaceApi.petInteract(type).then((result) => {
        if (result.ok && result.data) {
          setSpace((prev) => ({ ...prev, petState: result.data! }))
        }
      })
    } else {
      setSpace((prev) => {
        const today = getTodayDateString()
        const isNewDay = prev.petState.interactionDate !== today
        const currentInteractions = isNewDay ? 0 : prev.petState.todayInteractions
        const newPetState: PetState = {
          ...prev.petState,
          lastFed: type === 'feed' ? Date.now() : prev.petState.lastFed,
          lastPetted: type === 'pet' ? Date.now() : prev.petState.lastPetted,
          todayInteractions: currentInteractions + 1,
          interactionDate: today,
        }
        return { ...prev, petState: newPetState }
      })
    }
  }, [apiMode])

  // ---- Anniversary CRUD ----
  const addAnniversary = useCallback((a: Omit<Anniversary, 'id'>) => {
    const clearPrimary = (annivs: Anniversary[]) =>
      a.isPrimary ? annivs.map((x) => ({ ...x, isPrimary: false })) : annivs
    if (apiMode) {
      spaceApi.addAnniversary(a).then((result) => {
        if (result.ok && result.data) {
          setSpace((prev) => ({ ...prev, anniversaries: [...clearPrimary(prev.anniversaries), result.data!] }))
        }
      })
    } else {
      const newA: Anniversary = { ...a, id: uid() }
      setSpace((prev) => ({ ...prev, anniversaries: [...clearPrimary(prev.anniversaries), newA] }))
    }
  }, [apiMode])

  const removeAnniversary = useCallback((id: string) => {
    if (apiMode) {
      spaceApi.deleteAnniversary(id).then((result) => {
        if (result.ok) {
          setSpace((prev) => ({
            ...prev,
            anniversaries: prev.anniversaries.filter((a) => a.id !== id),
          }))
        }
      })
    } else {
      setSpace((prev) => ({
        ...prev,
        anniversaries: prev.anniversaries.filter((a) => a.id !== id),
      }))
    }
  }, [apiMode])

  const updateAnniversary = useCallback((id: string, patch: Partial<Omit<Anniversary, 'id'>>) => {
    const applyPatch = (annivs: Anniversary[]) =>
      annivs.map((a) => {
        if (a.id === id) return { ...a, ...patch }
        if (patch.isPrimary) return { ...a, isPrimary: false }
        return a
      })
    if (apiMode) {
      spaceApi.updateAnniversary(id, patch).then((result) => {
        if (result.ok && result.data) {
          setSpace((prev) => ({ ...prev, anniversaries: applyPatch(prev.anniversaries) }))
        }
      })
    } else {
      setSpace((prev) => ({ ...prev, anniversaries: applyPatch(prev.anniversaries) }))
    }
  }, [apiMode])

  // ---- Derived data ----
  const deferred = instances.filter((i) => i.status === 'deferred')
  const awaiting = instances.filter((i) => i.status === 'awaiting')
  const pending = instances.filter((i) => i.status === 'pending')
  const todayDone = instances.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired'
  )

  // Pet-related derived data
  const todayStr = getTodayDateString()
  const todayInstances = instances.filter((inst) => {
    const d = new Date(inst.scheduledTime)
    const instDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return instDate === todayStr
  })
  const todayCompletedCount = todayInstances.filter((i) => i.status === 'completed').length
  const todaySkippedCount = todayInstances.filter((i) => i.status === 'skipped').length
  const todayTotalCount = todayInstances.length
  const getTodayReceivedStats = useCallback(
    (userId: string, selfOnly?: boolean) => {
      const userToday = todayInstances.filter((inst) => {
        const tpl = templates.find((t) => t.id === inst.templateId)
        if (!tpl || tpl.receiverId !== userId) return false
        if (selfOnly && tpl.creatorId !== tpl.receiverId) return false
        return true
      })
      return {
        completed: userToday.filter((i) => i.status === 'completed').length,
        total: userToday.length,
      }
    },
    [todayInstances, templates]
  )
  const todayCareCount = todayInstances.filter((i) => {
    const tpl = templates.find((t) => t.id === i.templateId)
    return tpl?.itemType === 'care' && i.status === 'completed'
  }).length

  // Derived pet mood & energy (always in sync with current instance data)
  const derivedPetMood = calculateMood(todayCompletedCount, todayTotalCount, todaySkippedCount)
  const isNewDay = space.petState.interactionDate !== todayStr
  const currentInteractions = isNewDay ? 0 : space.petState.todayInteractions
  const derivedPetEnergy = calculateEnergy(
    50,
    todayCompletedCount,
    currentInteractions,
    space.petState.lastFed || space.petState.lastPetted,
  )
  const currentPetState: PetState = {
    ...space.petState,
    mood: derivedPetMood,
    energy: derivedPetEnergy,
    todayInteractions: currentInteractions,
    interactionDate: todayStr,
  }

  // Relationship derived data — prefer primary anniversary date over space.createdAt
  const togetherAnniversary = space.anniversaries.find((a) => a.isPrimary)
  let relationDays: number
  if (togetherAnniversary?.year) {
    const [mm, dd] = togetherAnniversary.date.split('-').map(Number)
    const togetherDate = new Date(togetherAnniversary.year, mm - 1, dd)
    relationDays = Math.max(1, Math.floor((Date.now() - togetherDate.getTime()) / 86_400_000))
  } else {
    relationDays = Math.max(1, Math.floor((Date.now() - space.createdAt) / 86_400_000))
  }
  const todayAnniversaries = space.anniversaries.filter(isTodayAnniversary)

  // Upcoming anniversaries for AI context (within 30 days)
  const upcomingAnniversaries = space.anniversaries
    .map((a) => ({ title: a.title, emoji: a.emoji, daysUntil: daysUntilNext(a), isToday: isTodayAnniversary(a) }))
    .filter((a) => a.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5)

  // Task summary for AI context (per-user filtered)
  const getAiTaskSummary = useCallback((userId: string) => {
    const userInstances = instances.filter((i) => {
      const tpl = templates.find((t) => t.id === i.templateId)
      return tpl && tpl.receiverId === userId
    })
    const userTodayInstances = userInstances.filter((inst) => {
      const d = new Date(inst.scheduledTime)
      const instDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return instDate === todayStr
    })
    return {
      pendingTasks: userInstances
        .filter((i) => i.status === 'pending' || i.status === 'awaiting' || i.status === 'deferred')
        .slice(0, 5)
        .map((i) => {
          const tpl = templates.find((t) => t.id === i.templateId)
          return tpl
            ? { name: tpl.name, category: tpl.category, itemType: tpl.itemType, forPartner: tpl.receiverId !== tpl.creatorId }
            : null
        })
        .filter((t): t is NonNullable<typeof t> => t !== null),
      todayCompleted: userTodayInstances.filter((i) => i.status === 'completed').length,
      todayTotal: userTodayInstances.length,
      overdueCount: userInstances.filter(
        (i) => (i.status === 'pending' || i.status === 'deferred') && i.scheduledTime < Date.now(),
      ).length,
    }
  }, [instances, templates, todayStr])

  // Draft & feelings derived data
  const getDraftItems = useCallback(
    (userId: string) => {
      return instances.filter((inst) => {
        const tpl = templates.find((t) => t.id === inst.templateId)
        return tpl && tpl.creatorId === userId && inst.relationStatus === 'draft'
      })
    },
    [instances, templates]
  )

  const getFeelings = useCallback(
    (userId: string, options?: { aboutPartner?: boolean; entryType?: FeelingEntry['entryType']; includeHidden?: boolean }) => {
      return feelings.filter((f) => {
        if (f.userId !== userId) return false
        if (!options?.includeHidden && f.isHidden) return false
        if (options?.aboutPartner) return !!f.aboutPartnerId
        if (options?.entryType) return f.entryType === options.entryType
        return true
      })
    },
    [feelings]
  )

  const addComment = useCallback((entryId: string, content: string, author: 'user' | 'ai', userId?: string) => {
    const newComment: Comment = { id: uid(), entryId, content, author, userId, createdAt: Date.now() }
    setComments((prev) => [...prev, newComment])
  }, [])

  const getComments = useCallback((entryId: string) => {
    return comments.filter((c) => c.entryId === entryId).sort((a, b) => a.createdAt - b.createdAt)
  }, [comments])

  const deleteFeeling = useCallback((feelingId: string) => {
    setFeelings((prev) => prev.filter((f) => f.id !== feelingId))
    setComments((prev) => prev.filter((c) => c.entryId !== feelingId))
    showToast('已删除', 'info')
  }, [showToast])

  const toggleHideFeeling = useCallback((feelingId: string) => {
    setFeelings((prev) =>
      prev.map((f) => {
        if (f.id !== feelingId) return f
        const newHidden = !f.isHidden
        return { ...f, isHidden: newHidden }
      })
    )
    const entry = feelings.find((f) => f.id === feelingId)
    showToast(entry?.isHidden ? '已取消隐藏' : '已隐藏', 'info')
  }, [showToast, feelings])

  const toggleLikeFeeling = useCallback((feelingId: string, userId: string) => {
    setFeelings((prev) =>
      prev.map((f) => {
        if (f.id !== feelingId) return f
        const likedBy = f.likedBy ?? []
        const already = likedBy.includes(userId)
        return {
          ...f,
          likedBy: already
            ? likedBy.filter((id) => id !== userId)
            : [...likedBy, userId],
        }
      })
    )
  }, [])

  const toggleHidePhoto = useCallback((feelingId: string, photoIndex: number) => {
    setFeelings((prev) =>
      prev.map((f) => {
        if (f.id !== feelingId) return f
        const indices = f.hiddenPhotoIndices ?? []
        const isHidden = indices.includes(photoIndex)
        const newIndices = isHidden
          ? indices.filter((i) => i !== photoIndex)
          : [...indices, photoIndex]
        return { ...f, hiddenPhotoIndices: newIndices.length > 0 ? newIndices : undefined }
      })
    )
    const entry = feelings.find((f) => f.id === feelingId)
    const wasHidden = entry?.hiddenPhotoIndices?.includes(photoIndex)
    showToast(wasHidden ? '已取消隐藏该照片' : '已隐藏该照片', 'info')
  }, [showToast, feelings])

  const updateFeeling = useCallback((feelingId: string, patch: Partial<Pick<FeelingEntry, 'content' | 'mood' | 'location' | 'photoUrls' | 'mediaTypes'>>) => {
    setFeelings((prev) =>
      prev.map((f) => {
        if (f.id !== feelingId) return f
        const updated = { ...f, ...patch }
        if (patch.photoUrls !== undefined) {
          updated.photoUrl = patch.photoUrls[0]
        }
        return updated
      })
    )
    showToast('已更新', 'success')
  }, [showToast])

  // ---- Pet comment for feeling entry ----
  const getPetComment = useCallback((feelingId: string): string | null => {
    const feeling = feelings.find((f) => f.id === feelingId)
    if (!feeling) return null
    if (feeling.entryType === 'reminder') return null
    const companion = COMPANION_CHARACTERS[space.companion]
    const isDual = space.relationType !== 'self'
    const hasPhotos = !!(feeling.photoUrls && feeling.photoUrls.length > 0)
    return generatePetComment(feeling.content, feeling.mood, hasPhotos, companion.name, companion.avatar, isDual)
  }, [feelings, space.companion, space.relationType])

  // ---- Narrative generation ----
  const generateNarrativeEntry = useCallback(async (feelingIds?: string[]) => {
    const userId = users[0].id
    const targetFeelings = feelingIds
      ? feelings.filter((f) => feelingIds.includes(f.id))
      : feelings.filter((f) => f.userId === userId)
    if (targetFeelings.length === 0) return null

    const photoUrls = targetFeelings.flatMap((f) => f.photoUrls || [])
    const companion = COMPANION_CHARACTERS[space.companion]
    const isDual = space.relationType !== 'self'

    // Try real AI API first, fall back to vision, then template
    try {
      const apiResult = await narrativeApi.generateNarrative({
        scope: isDual ? 'relationship' : 'self',
        taskIds: targetFeelings.map((f) => f.id),
        feelings: targetFeelings.map((f) => ({
          content: f.content,
          mood: f.mood,
          photoCount: (f.photoUrls || []).length,
        })),
        photoUrls: photoUrls.slice(0, 6),
      })
      if (apiResult.ok && apiResult.data) {
        const entry: NarrativeEntry = {
          id: apiResult.data.id,
          userId,
          title: apiResult.data.content.split('\n')[0] || '今天的故事',
          bodyText: apiResult.data.content,
          petSummary: '陪你们记录了这一天',
          photoUrls: photoUrls.slice(0, 3),
          feelingIds: targetFeelings.map((f) => f.id),
          createdAt: Date.now(),
        }
        setNarratives((prev) => [...prev, entry])
        return entry
      }
    } catch {
      // Fall through to vision/template generation
    }

    // Try direct vision model if photos exist and API key configured
    if (photoUrls.length > 0 && isVisionAvailable()) {
      try {
        const visionResult = await generateVisionNarrative(
          targetFeelings, photoUrls, companion.name, companion.avatar, isDual,
        )
        if (visionResult) {
          const entry: NarrativeEntry = {
            id: `narrative-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            userId,
            title: visionResult.title,
            bodyText: visionResult.bodyText,
            petSummary: visionResult.petSummary,
            photoUrls: photoUrls.slice(0, 3),
            feelingIds: targetFeelings.map((f) => f.id),
            createdAt: Date.now(),
          }
          setNarratives((prev) => [...prev, entry])
          return entry
        }
      } catch {
        // Fall through to template
      }
    }

    // Template fallback
    const entry = generateDemoNarrativeEntry(
      targetFeelings, photoUrls, companion.name, companion.avatar,
      relationDays, isDual ? 'dual' : 'single', userId,
    )
    setNarratives((prev) => [...prev, entry])
    return entry
  }, [users, feelings, space.companion, space.relationType, relationDays])

  const getNarrative = useCallback((id: string) => {
    return narratives.find((n) => n.id === id) || null
  }, [narratives])

  const getNarratives = useCallback((userId: string) => {
    return narratives.filter((n) => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt)
  }, [narratives])

  // ---- Additional derived data ----
  const todayFeelingCount = feelings.filter((f) => {
    const d = new Date(f.createdAt)
    const fDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return fDate === todayStr
  }).length

  const recentPhotos = feelings
    .filter((f) => f.photoUrls && f.photoUrls.length > 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .flatMap((f) => f.photoUrls || [])
    .slice(0, 6)

  // ---- Relay message methods ----
  const sendRelay = useCallback((
    senderId: string,
    receiverId: string,
    originalText: string,
    selectedVersion: RelayVersionType,
    relayText: string,
  ) => {
    const relay: RelayMessage = {
      id: `relay-${Date.now()}-${uid()}`,
      senderId,
      receiverId,
      originalText,
      selectedVersion,
      relayText,
      status: 'sent',
      createdAt: Date.now(),
      readAt: null,
    }
    setRelayMessages(prev => [...prev, relay])
    const senderName = users.find(u => u.id === senderId)?.name || '对方'
    addNotification(receiverId, `${senderName} 通过小橘给你传了一句话~`, undefined)
    showToast('小橘已经帮你传达了~', 'success')
  }, [users, addNotification, showToast])

  const getUnreadRelays = useCallback((userId: string) => {
    return relayMessages
      .filter(m => m.receiverId === userId && m.status !== 'read')
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [relayMessages])

  const markRelayRead = useCallback((relayId: string) => {
    setRelayMessages(prev => prev.map(m =>
      m.id === relayId ? { ...m, status: 'read' as const, readAt: Date.now() } : m
    ))
  }, [])

  return {
    templates,
    instances,
    notifications,
    users,
    space,
    feelings,
    comments,
    deferred,
    awaiting,
    pending,
    todayDone,
    toast,
    isApiLoading,
    // Pet & space derived
    currentPetState,
    todayCompletedCount,
    todayTotalCount,
    todayCareCount,
    getTodayReceivedStats,
    relationDays,
    todayAnniversaries,
    upcomingAnniversaries,
    getAiTaskSummary,
    // Getters
    getTemplate,
    getReceivedItems,
    getSentItems,
    getDraftItems,
    getFeelings,
    getComments,
    addComment,
    deleteFeeling,
    toggleHideFeeling,
    toggleLikeFeeling,
    toggleHidePhoto,
    updateFeeling,
    getUserNotifications,
    getUserProfile,
    // Space actions
    updateSpaceCompanion,
    updateSpaceRelationType,
    setUserCity,
    updateUserProfile,
    petInteraction,
    addAnniversary,
    removeAnniversary,
    updateAnniversary,
    // User actions
    completeOnboarding,
    resetOnboarding,
    bindPartner,
    dissolveRelationship,
    // Instance actions
    completeInstance,
    deferInstance,
    skipInstance,
    cantDoInstance,
    respondWithFeedback,
    markSeen,
    createTask,
    deleteTemplate,
    updateTemplate,
    updateInstanceDate,
    saveDraftTask,
    promoteDraftToSent,
    saveFeeling,
    convertFeelingToTask,
    dismissNotification,
    addNotification,
    // Narrative & pet comment
    narratives,
    todayFeelingCount,
    recentPhotos,
    getPetComment,
    generateNarrativeEntry,
    getNarrative,
    getNarratives,
    // Relay messages
    relayMessages,
    sendRelay,
    getUnreadRelays,
    markRelayRead,
  }
}

export type Store = ReturnType<typeof useStore>
