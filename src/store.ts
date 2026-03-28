import { useState, useCallback } from 'react'
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
} from '@/types'
import { INTENSITY_CONFIG, ITEM_TYPE_CONFIG } from '@/types'
import type { CompanionAnimal, RelationType } from '@/lib/companion'
import { calculateMood, calculateEnergy, getTodayDateString } from '@/lib/pet-state'
import { isTodayAnniversary } from '@/lib/anniversary'

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

// ---- shared relationship space ----
const INITIAL_SPACE: RelationshipSpace = {
  id: 'space-1',
  userIds: ['user-1', 'user-2'],
  relationType: 'couple',
  companion: 'cat',
  createdAt: Date.now() - 30 * 86400000,
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
  return USERS.find((u) => u.id === id) || USERS[0]
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
export function useStore() {
  const seed = createSeedData()
  const [templates, setTemplates] = useState<TaskTemplate[]>(seed.templates)
  const [instances, setInstances] = useState<TaskInstance[]>(seed.instances)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'skip' } | null>(null)
  const [users, setUsers] = useState<User[]>(USERS)
  const [space, setSpace] = useState<RelationshipSpace>(INITIAL_SPACE)

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
  const completeInstance = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id !== instanceId) return inst
        const tpl = templates.find((t) => t.id === inst.templateId)
        const itemType = tpl?.itemType || 'todo'
        const actionNote = itemType === 'care' ? '好的💛' : '做好了'
        const action = itemType === 'care' ? 'acknowledged' as const : 'user_completed' as const
        return {
          ...inst,
          status: 'completed' as InstanceStatus,
          completedAt: Date.now(),
          nextFollowUpAt: null,
          relationStatus: 'responded' as RelationStatus,
          actionLog: [
            ...inst.actionLog,
            { timestamp: Date.now(), action, note: actionNote },
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

  const createTask = useCallback(
    (data: CreateTaskInput) => {
      const templateId = uid()
      const intensity = INTENSITY_CONFIG[data.followUpIntensity]
      const [h, m] = data.remindTime.split(':').map(Number)

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
      }

      const newInstance: TaskInstance = {
        id: uid(),
        templateId,
        scheduledTime: todayAt(h, m),
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

  // ---- User profile management ----
  const getUserProfile = useCallback(
    (userId: string) => users.find((u) => u.id === userId) || users[0],
    [users]
  )

  // ---- Shared space management ----
  const updateSpaceCompanion = useCallback((companion: CompanionAnimal) => {
    setSpace((prev) => ({ ...prev, companion }))
  }, [])

  const updateSpaceRelationType = useCallback((relationType: RelationType) => {
    setSpace((prev) => ({ ...prev, relationType }))
  }, [])

  const completeOnboarding = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, onboarded: true } : u))
  }, [])

  const resetOnboarding = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, onboarded: false } : u))
  }, [])

  // ---- Pet interaction ----
  const petInteraction = useCallback((type: PetInteractionType) => {
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
  }, [])

  // ---- Anniversary CRUD ----
  const addAnniversary = useCallback((a: Omit<Anniversary, 'id'>) => {
    const newA: Anniversary = { ...a, id: uid() }
    setSpace((prev) => ({ ...prev, anniversaries: [...prev.anniversaries, newA] }))
  }, [])

  const removeAnniversary = useCallback((id: string) => {
    setSpace((prev) => ({
      ...prev,
      anniversaries: prev.anniversaries.filter((a) => a.id !== id),
    }))
  }, [])

  const updateAnniversary = useCallback((id: string, patch: Partial<Omit<Anniversary, 'id'>>) => {
    setSpace((prev) => ({
      ...prev,
      anniversaries: prev.anniversaries.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    }))
  }, [])

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

  // Relationship derived data
  const relationDays = Math.max(1, Math.floor((Date.now() - space.createdAt) / 86_400_000))
  const todayAnniversaries = space.anniversaries.filter(isTodayAnniversary)

  return {
    templates,
    instances,
    notifications,
    users,
    space,
    deferred,
    awaiting,
    pending,
    todayDone,
    toast,
    // Pet & space derived
    currentPetState,
    todayCompletedCount,
    todayTotalCount,
    todayCareCount,
    relationDays,
    todayAnniversaries,
    // Getters
    getTemplate,
    getReceivedItems,
    getSentItems,
    getUserNotifications,
    getUserProfile,
    // Space actions
    updateSpaceCompanion,
    updateSpaceRelationType,
    petInteraction,
    addAnniversary,
    removeAnniversary,
    updateAnniversary,
    // User actions
    completeOnboarding,
    resetOnboarding,
    // Instance actions
    completeInstance,
    deferInstance,
    skipInstance,
    cantDoInstance,
    respondWithFeedback,
    markSeen,
    createTask,
    dismissNotification,
    addNotification,
  }
}

export type Store = ReturnType<typeof useStore>
