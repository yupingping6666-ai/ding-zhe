import { useState, useCallback, useMemo, useEffect } from 'react'
import { TaskCard } from '@/components/TaskCard'
import { SentItemCard } from '@/components/SentItemCard'
import { ITEM_TYPE_CONFIG } from '@/types'
import type { PetExpression } from '@/types'
import { formatTime } from '@/lib/time'
import type { Store } from '@/store'
import { getUser } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS, getCompanionMessage } from '@/lib/companion'
import { canInteract, getInteractionCooldownRemaining, PET_COOLDOWNS } from '@/lib/pet-state'
import PetSvg from '@/components/pet/PetSvg'
import { getTimeOfDay } from '@/lib/time-of-day'
import { Bell, Camera, Mic, Heart, CheckCircle2, Calendar, BarChart3, Sparkles, ChevronRight, UtensilsCrossed, HandHeart } from 'lucide-react'

interface Props {
  store: Store
  userMode: 'single' | 'dual'
  onOpenDetail: (templateId: string) => void
  onOpenFeelingDetail: (feelingId: string) => void
  onTriggerReminder: (instanceId: string) => void
  onVoiceCreate: () => void
  onOpenPetPanel: () => void
  onOpenCreate: () => void
  onOpenNotifications: () => void
}

type HomeTab = 'received' | 'sent'

export function HomePage({ store, userMode, onOpenDetail, onOpenFeelingDetail, onTriggerReminder, onVoiceCreate, onOpenPetPanel, onOpenCreate, onOpenNotifications }: Props) {
  const currentUserId = useCurrentUser()
  const [tab, setTab] = useState<HomeTab>('received')
  const [expandedUpcoming, setExpandedUpcoming] = useState<Set<string>>(new Set())
  const [petBounce, setPetBounce] = useState(false)
  const [floatingText, setFloatingText] = useState<string | null>(null)
  const [overrideExpression, setOverrideExpression] = useState<PetExpression | null>(null)
  const [, setTick] = useState(0)

  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  const { getTemplate, completeInstance, deferInstance, skipInstance, cantDoInstance, respondWithFeedback } = store
  const receivedItems = store.getReceivedItems(currentUserId)
  const sentItems = store.getSentItems(currentUserId)
  const notifications = store.getUserNotifications(currentUserId)

  // Pet interaction cooldowns
  const petReady = canInteract(store.currentPetState.lastPetted, PET_COOLDOWNS.pet)
  const feedReady = canInteract(store.currentPetState.lastFed, PET_COOLDOWNS.feed)
  const petCooldown = getInteractionCooldownRemaining(store.currentPetState.lastPetted, PET_COOLDOWNS.pet)
  const feedCooldown = getInteractionCooldownRemaining(store.currentPetState.lastFed, PET_COOLDOWNS.feed)

  // Tick to update cooldown display
  useEffect(() => {
    if (petReady && feedReady) return
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [petReady, feedReady])

  const showFloat = useCallback((text: string) => {
    setFloatingText(text)
    setTimeout(() => setFloatingText(null), 2000)
  }, [])

  const handlePetClick = useCallback(() => {
    setPetBounce(true)
    onOpenPetPanel()
    setTimeout(() => setPetBounce(false), 500)
  }, [onOpenPetPanel])

  const handlePetAction = useCallback(() => {
    if (!petReady) return
    store.petInteraction('pet')
    setOverrideExpression('happy')
    showFloat('开心！')
    setPetBounce(true)
    setTimeout(() => setPetBounce(false), 500)
    setTimeout(() => setOverrideExpression(null), 3000)
  }, [petReady, store, showFloat])

  const handleFeedAction = useCallback(() => {
    if (!feedReady) return
    store.petInteraction('feed')
    setOverrideExpression('eating')
    showFloat('好吃！')
    setTimeout(() => setOverrideExpression(null), 3000)
  }, [feedReady, store, showFloat])

  const handleHugAction = useCallback(() => {
    setOverrideExpression('love')
    showFloat('好温暖！')
    setTimeout(() => setOverrideExpression(null), 3000)
  }, [showFloat])

  // ---- Received tab sections ----
  const needResponse = receivedItems.filter((i) => i.status === 'deferred')
  const needAction = receivedItems.filter((i) => i.status === 'awaiting')
  const upcoming = receivedItems.filter((i) => i.status === 'pending')
  const handled = receivedItems.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired'
  )
  const doneCount = handled.filter((i) => i.status === 'completed').length
  const activeCount = needResponse.length + needAction.length

  // ---- Sent tab sections ----
  const sentWaiting = sentItems.filter((i) =>
    i.status === 'pending' || i.status === 'awaiting' ||
    (i.status === 'deferred' && i.relationStatus !== 'responded')
  )
  const sentProcessing = sentItems.filter((i) =>
    i.status === 'deferred' && i.relationStatus === 'responded'
  )
  const sentDone = sentItems.filter((i) => i.status === 'completed')
  const sentFailed = sentItems.filter((i) => i.status === 'skipped')

  // Single mode
  const selfItems = receivedItems.filter((i) => {
    const tpl = store.getTemplate(i.templateId)
    return tpl && tpl.creatorId === tpl.receiverId
  })
  const selfPending = selfItems.filter((i) => i.status === 'pending' || i.status === 'awaiting' || i.status === 'deferred')
  const selfDone = selfItems.filter((i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired')

  // Pet expression
  const isNight = getTimeOfDay() === 'night'
  const getPetExpression = (): PetExpression => {
    // Recent interaction still takes priority
    const now = Date.now()
    const lastInteraction = Math.max(store.currentPetState.lastPetted || 0, store.currentPetState.lastFed || 0)
    if (lastInteraction && (now - lastInteraction) < 5 * 60 * 1000) return 'happy'

    // Late night: default to sleeping
    if (isNight) return 'sleeping'

    const mood = store.currentPetState.mood
    let baseExpression: PetExpression = 'idle'
    switch (mood) {
      case 'happy': baseExpression = 'happy'; break
      case 'sleepy': baseExpression = 'sleeping'; break
      case 'lonely': baseExpression = 'love'; break
      case 'content': baseExpression = 'sitting'; break
      case 'neutral': baseExpression = 'thinking'; break
      default: baseExpression = 'idle'
    }
    if (store.currentPetState.energy < 30) return 'sleeping'
    if (store.currentPetState.energy > 70 && !lastInteraction) return 'playing'
    return baseExpression
  }

  const petExpression: PetExpression = overrideExpression || getPetExpression()

  // Pet status text - reflects actual displayed expression & interactions
  const getPetStatusText = () => {
    // Override expression takes priority (from recent interactions)
    if (overrideExpression) {
      switch (overrideExpression) {
        case 'happy': return '被摸摸了，好开心！'
        case 'eating': return '在吃好吃的~'
        case 'love': return '喜欢你！'
        default: break
      }
    }

    // Check recent interaction (within 5 min)
    const now = Date.now()
    const lastPetted = store.currentPetState.lastPetted || 0
    const lastFed = store.currentPetState.lastFed || 0
    const lastInteraction = Math.max(lastPetted, lastFed)
    if (lastInteraction && (now - lastInteraction) < 5 * 60 * 1000) {
      if (lastFed > lastPetted) return '刚吃饱，很满足~'
      return '刚被摸过，心情很好'
    }

    // Late night: sleeping
    if (isNight) return '已经睡着啦，晚安~'

    // Energy-based
    if (store.currentPetState.energy < 30) return '有点累了，想休息'
    if (store.currentPetState.energy > 70 && store.currentPetState.todayInteractions > 0) return '精力充沛，想玩！'

    // Mood-based fallback
    const mood = store.currentPetState.mood
    switch (mood) {
      case 'happy': return '心情很好'
      case 'sleepy': return '正在休息'
      case 'lonely': return '想你了，来互动吧'
      case 'content': return '很满足'
      case 'neutral': {
        // More varied text for neutral instead of always "正在发呆"
        const interactions = store.currentPetState.todayInteractions
        if (interactions === 0) return '等你来互动~'
        if (interactions >= 3) return '今天互动了好多次！'
        return '正在休息中'
      }
      default: return '正在休息中'
    }
  }

  // Interaction heatmap data (last 7 days)
  const heatmapData = useMemo(() => {
    const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']
    const now = new Date()

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (6 - i))
      // Align to midnight
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const dayEnd = dayStart + 86_400_000
      const label = weekdayLabels[date.getDay()]

      // Count feelings created
      const feelingCount = store.getFeelings(currentUserId).filter(f =>
        f.createdAt >= dayStart && f.createdAt < dayEnd
      ).length

      // Count task actions (complete, defer, skip, feedback, etc.)
      const taskActionCount = store.getReceivedItems(currentUserId).reduce((sum, inst) =>
        sum + inst.actionLog.filter(a => a.timestamp >= dayStart && a.timestamp < dayEnd).length
      , 0)

      // Count relay messages sent
      const relayCount = store.relayMessages.filter(r =>
        r.senderId === currentUserId && r.createdAt >= dayStart && r.createdAt < dayEnd
      ).length

      const count = feelingCount + taskActionCount + relayCount
      return { label, count, maxCount: 5 }
    })
  }, [store, currentUserId])

  // AI feedback based on today's activity
  const aiComment = useMemo(() => {
    const completed = store.todayCompletedCount
    const total = store.todayTotalCount
    const feelingCount = store.todayFeelingCount
    const name = character.name

    if (completed > 0 && completed >= total && total > 0) {
      return `${name}说：今天的任务都完成啦，你真棒！好好休息吧~`
    }
    if (feelingCount >= 3) {
      return `${name}说：今天记录了好多感受，继续保持这个习惯哦~`
    }
    if (completed > 0) {
      return `${name}说：已经完成了 ${completed} 件事，继续加油！`
    }
    if (feelingCount > 0) {
      return `${name}说：记录感受是了解自己的第一步，做得不错~`
    }
    return `${name}说：今天还没有动态哦，来记录一下心情吧~`
  }, [store.todayCompletedCount, store.todayTotalCount, store.todayFeelingCount, character.name])

  return (
    <div className="pb-6">
      {/* ===== Pet Hero Area ===== */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(32 70% 95%) 0%, hsl(30 55% 96%) 60%, hsl(32 60% 97%) 100%)' }}>

        {/* Top bar with greeting */}
        <div className="relative flex items-center justify-between px-5 pt-4 pb-1 z-10">
          <div>
            <p className="text-base font-bold text-foreground">{user?.name || '你'}，记录一下</p>
          </div>
          {userMode === 'dual' && notifications.length > 0 && (
            <div className="relative">
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-full bg-white/60 backdrop-blur-sm"
              >
                <Bell className="w-5 h-5 text-foreground/60" />
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">{notifications.length}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Subtle floating decorations matching design */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-8 left-8 animate-float" style={{ animationDelay: '0s' }}>
            <span className="text-sm opacity-20 block" style={{ color: 'hsl(14, 60%, 75%)' }}>💕</span>
          </div>
          <div className="absolute top-16 right-6 animate-float" style={{ animationDelay: '1.8s' }}>
            <span className="text-xs opacity-15 block">🍀</span>
          </div>
          <div className="absolute bottom-20 left-6 animate-float" style={{ animationDelay: '0.6s' }}>
            <span className="text-xs opacity-15 block">🍀</span>
          </div>
          <div className="absolute top-24 left-[20%] animate-float" style={{ animationDelay: '2.4s' }}>
            <span className="text-[10px] opacity-12 block" style={{ color: 'hsl(20, 70%, 80%)' }}>🌸</span>
          </div>
          <div className="absolute bottom-28 right-10 animate-float" style={{ animationDelay: '1.2s' }}>
            <span className="text-sm opacity-18 block" style={{ color: 'hsl(14, 55%, 78%)' }}>💕</span>
          </div>
          <div className="absolute top-12 right-[30%] animate-float" style={{ animationDelay: '3s' }}>
            <span className="text-[10px] opacity-10 block">🌿</span>
          </div>
        </div>

        {/* Pet display */}
        <div
          className={`relative flex items-center justify-center pt-2 pb-2 cursor-pointer z-10 ${petBounce ? 'animate-pet-bounce' : ''}`}
          onClick={handlePetClick}
        >
          <div className="relative w-40 h-40">
            <PetSvg
              animal={store.space.companion}
              expression={petExpression}
              className="w-full h-full drop-shadow-lg"
            />
            {/* Floating reaction text */}
            {floatingText && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-primary animate-text-float-fade pointer-events-none">
                {floatingText}
              </div>
            )}
          </div>
        </div>

        {/* Pet name + status */}
        <div className="relative text-center pb-2 z-10">
          <p className="text-lg font-bold text-foreground">{character.name}{getPetStatusText()}</p>
          <button
            onClick={onOpenPetPanel}
            className="inline-flex items-center gap-0.5 mt-1 text-xs text-primary/70 hover:text-primary transition-colors border border-primary/20 rounded-full px-3 py-1"
          >
            <span>点击查看详情</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick interaction icons row */}
        <div className="relative z-10 flex items-center justify-center gap-6 pb-4 pt-2">
          <button
            onClick={handlePetAction}
            disabled={!petReady}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
              petReady ? 'text-muted-foreground' : 'text-muted-foreground/40'
            }`}
          >
            <Heart className={`w-5 h-5 ${petReady ? 'text-primary/70' : ''}`} />
            <span className="text-2xs font-medium">{petReady ? '摸摸' : `${petCooldown}s`}</span>
          </button>
          <button
            onClick={handleFeedAction}
            disabled={!feedReady}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
              feedReady ? 'text-muted-foreground' : 'text-muted-foreground/40'
            }`}
          >
            <UtensilsCrossed className={`w-5 h-5 ${feedReady ? 'text-care/70' : ''}`} />
            <span className="text-2xs font-medium">{feedReady ? '喂食' : `${Math.ceil(feedCooldown / 60)}min`}</span>
          </button>
          <button
            onClick={handleHugAction}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-all active:scale-90"
          >
            <HandHeart className="w-5 h-5 text-confirm/70" />
            <span className="text-2xs font-medium">拥抱</span>
          </button>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="px-4 -mt-3 relative z-10">
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl px-3 py-3.5 text-center shadow-card-default border border-border/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Heart className="w-3.5 h-3.5 text-primary" />
              <p className="text-xl font-extrabold text-foreground">{store.todayFeelingCount}</p>
            </div>
            <p className="text-2xs text-muted-foreground font-medium">今日记录</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-3 py-3.5 text-center shadow-card-default border border-border/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <p className="text-xl font-extrabold text-foreground">{store.todayCompletedCount}/{store.todayTotalCount}</p>
            </div>
            <p className="text-2xs text-muted-foreground font-medium">任务完成</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-3 py-3.5 text-center shadow-card-default border border-border/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-care" />
              <p className="text-xl font-extrabold text-foreground">{store.relationDays}</p>
            </div>
            <p className="text-2xs text-muted-foreground font-medium">天</p>
          </div>
        </div>
      </div>

      {/* ===== Quick Action Buttons ===== */}
      <div className="px-4 pt-4 flex gap-3">
        <button
          onClick={onOpenCreate}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, hsl(14 70% 75%), hsl(20 65% 72%))', boxShadow: '0 4px 14px -4px hsl(14 70% 75% / 0.4)' }}
        >
          <Camera className="w-4 h-4" />
          记录瞬间
        </button>
        <button
          onClick={onVoiceCreate}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, hsl(220 50% 72%), hsl(215 45% 70%))', boxShadow: '0 4px 14px -4px hsl(220 50% 72% / 0.4)' }}
        >
          <Mic className="w-4 h-4" />
          提醒日记
        </button>
      </div>

      {/* ===== Interaction Heatmap (smooth curve) ===== */}
      <div className="px-4 pt-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-default border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">互动热度</h3>
            </div>
            <span className="text-2xs text-muted-foreground">近7天</span>
          </div>
          <HeatmapCurve data={heatmapData} />
          {/* Data summary */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-1">
              <span className="text-2xs text-muted-foreground">总互动</span>
              <span className="text-xs font-bold text-foreground">{heatmapData.reduce((s, d) => s + d.count, 0)}</span>
              <span className="text-2xs text-muted-foreground">次</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xs text-muted-foreground">日均</span>
              <span className="text-xs font-bold text-foreground">{(heatmapData.reduce((s, d) => s + d.count, 0) / 7).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xs text-muted-foreground">今日</span>
              <span className="text-xs font-bold text-primary">{heatmapData[heatmapData.length - 1]?.count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xs text-muted-foreground">峰值</span>
              <span className="text-xs font-bold text-foreground">{Math.max(...heatmapData.map(d => d.count))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Activity Feedback (动态反馈) ===== */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 shadow-card-default border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-care" />
              <h3 className="text-sm font-bold text-foreground">动态反馈</h3>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">{character.avatar}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{aiComment}</p>
          </div>
        </div>
      </div>

      {/* ===== Single mode content ===== */}
      {userMode === 'single' && (
        <div className="px-4 pt-5 space-y-5">
          {store.getFeelings(currentUserId, { aboutPartner: true }).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">最近的感受</h2>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {store.getFeelings(currentUserId, { aboutPartner: true })
                  .slice(0, 3)
                  .map((feeling) => (
                    <div
                      key={feeling.id}
                      onClick={() => onOpenFeelingDetail(feeling.id)}
                      className="bg-white rounded-2xl p-4 border border-border/30 flex items-start gap-3 cursor-pointer hover:bg-accent/30 active:bg-accent/50 transition-colors shadow-card-default"
                    >
                      <span className="text-lg">{feeling.mood}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">{feeling.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(feeling.createdAt).toLocaleDateString('zh-CN')}
                          {feeling.isDraft && <span className="ml-2 text-primary">草稿</span>}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {store.getDraftItems(currentUserId).length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">未发送</h2>
              <div className="space-y-2">
                {store.getDraftItems(currentUserId).map((inst) => {
                  const tpl = store.getTemplate(inst.templateId)!
                  return (
                    <div
                      key={inst.id}
                      className="bg-white rounded-2xl p-4 border border-dashed border-primary/30 flex items-center gap-3 shadow-card-default"
                    >
                      <span className="text-lg">{ITEM_TYPE_CONFIG[tpl.itemType].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tpl.name}</p>
                        {tpl.note && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tpl.note}</p>}
                      </div>
                      <button
                        onClick={() => store.promoteDraftToSent(tpl.id)}
                        className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        发送
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selfPending.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">我记录的</h2>
                <span className="text-xs text-muted-foreground">{selfPending.length} 件待处理</span>
              </div>
              <div className="space-y-2">
                {selfPending.map((inst) => {
                  const tpl = store.getTemplate(inst.templateId)!
                  return (
                    <TaskCard
                      key={inst.id}
                      instance={inst}
                      template={tpl}
                      onComplete={completeInstance}
                      onDefer={deferInstance}
                      onSkip={skipInstance}
                      onCantDo={cantDoInstance}
                      onTapName={() => onOpenDetail(inst.templateId)}
                      onDateChange={(instanceId, newDate) => store.updateInstanceDate(instanceId, newDate)}
                      variant={inst.status === 'deferred' ? 'deferred' : inst.status === 'awaiting' ? 'awaiting' : 'pending'}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {selfDone.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">已完成</h2>
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {selfDone.map((inst) => {
                  const tpl = store.getTemplate(inst.templateId)!
                  return (
                    <TaskCard
                      key={inst.id}
                      instance={inst}
                      template={tpl}
                      onComplete={completeInstance}
                      onDefer={deferInstance}
                      onSkip={skipInstance}
                      onCantDo={cantDoInstance}
                      onTapName={() => onOpenDetail(inst.templateId)}
                      variant={inst.status === 'completed' ? 'completed' : 'skipped'}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {selfItems.length === 0 &&
           store.getFeelings(currentUserId).length === 0 &&
           store.getDraftItems(currentUserId).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm">还没有记录</p>
              <p className="text-xs mt-1">点击 + 记录感受或创建提醒吧</p>
            </div>
          )}
        </div>
      )}

      {/* ===== Dual mode tabs ===== */}
      {userMode === 'dual' && (
      <>
      <div className="px-4 pt-5">
        <div className="flex bg-secondary/80 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'received' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            我收到的
            {activeCount > 0 && tab !== 'received' && (
              <span className="ml-1.5 text-xs bg-deferred/15 text-deferred px-2 py-0.5 rounded-full font-bold">{activeCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'sent' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            我发出的
            {sentItems.length > 0 && tab !== 'sent' && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{sentItems.length}</span>
            )}
          </button>
        </div>
      </div>

      {userMode === 'dual' && notifications.length > 0 && tab === 'received' && (
        <div className="px-4 mt-3">
          <div className="bg-care-surface/70 border border-care/15 rounded-2xl p-3.5 space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="flex items-center gap-2.5">
                <span className="text-sm">💌</span>
                <p className="text-xs text-foreground flex-1 truncate leading-relaxed">{n.message}</p>
                <button
                  onClick={() => store.dismissNotification(n.id)}
                  className="text-2xs text-care-foreground font-semibold hover:text-foreground px-2 py-0.5 rounded-full bg-care/10"
                >
                  知道了
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECEIVED TAB */}
      {tab === 'received' && (
        <>
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {doneCount > 0 && activeCount > 0
                ? `已温柔回应 ${doneCount} 件，还有 ${activeCount} 件等着你~`
                : doneCount > 0
                  ? `今天已温柔回应了 ${doneCount} 件小事`
                  : activeCount > 0
                    ? `有 ${activeCount} 件小事在等你回应~`
                    : ''}
            </p>
          </div>

          {needResponse.length > 0 && (
            <section className="px-4 mt-3 animate-fade-in">
              <SectionHeader emoji="💭" title="等你回应的" count={needResponse.length} color="deferred" />
              <div className="space-y-3">
                {needResponse.map((inst) => (
                  <TaskCard
                    key={inst.id}
                    instance={inst}
                    template={getTemplate(inst.templateId)}
                    onComplete={completeInstance}
                    onDefer={deferInstance}
                    onSkip={skipInstance}
                    onCantDo={cantDoInstance}
                    onFeedback={respondWithFeedback}
                    onTapName={() => onOpenDetail(inst.templateId)}
                    variant="deferred"
                  />
                ))}
              </div>
            </section>
          )}

          {needResponse.length === 0 && needAction.length === 0 && (
            <section className="px-4 mt-6">
              <div className="text-center py-10 bg-success-surface/50 rounded-2xl border border-success/10">
                <span className="text-4xl mb-2 block animate-float">{character.expressions.sleeping}</span>
                <p className="text-sm font-bold text-foreground">{getCompanionMessage(character, 'empty_all').text}</p>
                <p className="text-xs text-muted-foreground mt-1">保持这个节奏~</p>
              </div>
            </section>
          )}

          {needAction.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="📋" title="等你处理的" color="awaiting" />
              <div className="space-y-3">
                {needAction.map((inst) => (
                  <div key={inst.id} onClick={() => onTriggerReminder(inst.id)} className="cursor-pointer">
                    <TaskCard
                      instance={inst}
                      template={getTemplate(inst.templateId)}
                      onComplete={completeInstance}
                      onDefer={deferInstance}
                      onSkip={skipInstance}
                      onCantDo={cantDoInstance}
                      onFeedback={respondWithFeedback}
                      onTapName={() => onOpenDetail(inst.templateId)}
                      variant="awaiting"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="⏰" title="待会儿的事" count={upcoming.length} />
              <div className="space-y-3">
                {upcoming.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                  const isExpanded = expandedUpcoming.has(inst.id)
                  const sender = tpl.creatorId !== tpl.receiverId ? getUser(tpl.creatorId) : null

                  if (isExpanded) {
                    return (
                      <TaskCard
                        key={inst.id}
                        instance={inst}
                        template={tpl}
                        onComplete={completeInstance}
                        onDefer={deferInstance}
                        onSkip={skipInstance}
                        onCantDo={cantDoInstance}
                        onFeedback={respondWithFeedback}
                        onTapName={() => onOpenDetail(inst.templateId)}
                        variant="pending"
                      />
                    )
                  }

                  return (
                    <div
                      key={inst.id}
                      onClick={() => setExpandedUpcoming((prev) => new Set(prev).add(inst.id))}
                      className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-border/30 shadow-card-default hover:bg-accent/30 transition-colors cursor-pointer active:bg-accent/50"
                    >
                      <span className="text-lg">{typeConf.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate block">{tpl.name}</span>
                        {sender && <span className="text-2xs text-muted-foreground">{sender.name}{typeConf.senderVerb}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`sticker sticker-${tpl.itemType}`}>{typeConf.label}</span>
                        <span className="text-xs text-muted-foreground/70">{formatTime(inst.scheduledTime)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {handled.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="✨" title="你已处理的" />
              <div className="bg-white rounded-2xl border border-border/30 divide-y divide-border/30 overflow-hidden shadow-card-default">
                {handled.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                  const statusEmoji = inst.status === 'completed' ? '🌟' : inst.status === 'skipped' ? '⏭' : '⏰'
                  const statusText = inst.status === 'completed'
                    ? `${formatTime(inst.completedAt!)} 完成`
                    : inst.status === 'skipped'
                      ? (inst.actionLog.some(a => a.action === 'cant_do') ? '做不了' : '跳过了')
                      : '没来得及'

                  return (
                    <div
                      key={inst.id}
                      onClick={() => onOpenDetail(inst.templateId)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 active:bg-accent/50 transition-colors"
                    >
                      <span className="text-base opacity-50">{typeConf.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-muted-foreground truncate block">{tpl.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{statusEmoji}</span>
                        <span className="text-xs text-muted-foreground">{statusText}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <div className="flex justify-center pt-6 pb-2">
            <button
              onClick={onVoiceCreate}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-full gradient-float-btn text-primary-foreground shadow-float active:scale-95 transition-all hover:shadow-xl"
            >
              <Mic className="w-5 h-5" />
              <span className="text-sm font-bold">提醒日记</span>
            </button>
          </div>
        </>
      )}

      {/* SENT TAB */}
      {tab === 'sent' && (
        <>
          {sentItems.length === 0 ? (
            <section className="px-4 mt-8">
              <div className="text-center py-12">
                <span className="text-4xl mb-3 block animate-float">{character.expressions.idle}</span>
                <p className="text-sm font-bold text-foreground">{getCompanionMessage(character, 'empty_sent').text}</p>
                <p className="text-xs text-muted-foreground mt-1.5">给TA创建一个关心或小任务吧</p>
              </div>
            </section>
          ) : (
            <div className="px-4 mt-3 space-y-5">
              {sentWaiting.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="💌" title="等TA回应" count={sentWaiting.length} />
                  <div className="space-y-3">
                    {sentWaiting.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
              {sentProcessing.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="⏳" title="TA处理中" count={sentProcessing.length} />
                  <div className="space-y-3">
                    {sentProcessing.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
              {sentDone.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="🎉" title="已完成" count={sentDone.length} />
                  <div className="space-y-3">
                    {sentDone.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
              {sentFailed.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="😅" title="做不了" count={sentFailed.length} />
                  <div className="space-y-3">
                    {sentFailed.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
      </>
      )}
    </div>
  )
}

function SectionHeader({ emoji, title, count, color }: {
  emoji: string
  title: string
  count?: number
  color?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <h2 className={`text-sm font-bold ${
          color === 'deferred' ? 'text-deferred-foreground' :
          color === 'awaiting' ? 'text-awaiting-foreground' :
          'text-foreground'
        }`}>
          {title}
        </h2>
      </div>
      {count !== undefined && count > 0 && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          color === 'deferred' ? 'bg-deferred/10 text-deferred' :
          color === 'awaiting' ? 'bg-awaiting/10 text-awaiting' :
          'bg-secondary text-muted-foreground'
        }`}>
          {count} 件
        </span>
      )}
    </div>
  )
}

/** Smooth curve area chart for interaction heatmap */
function HeatmapCurve({ data }: { data: { label: string; count: number; maxCount: number }[] }) {
  const width = 280
  const height = 60
  const paddingX = 8
  const paddingTop = 4
  const paddingBottom = 2
  const chartW = width - paddingX * 2
  const chartH = height - paddingTop - paddingBottom

  const maxVal = Math.max(...data.map(d => d.count), 1)

  // Generate points
  const points = data.map((d, i) => ({
    x: paddingX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: paddingTop + chartH - (d.count / maxVal) * chartH * 0.85,
  }))

  // Create smooth bezier curve path
  const curvePath = (() => {
    if (points.length < 2) return ''
    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpx = (p0.x + p1.x) / 2
      d += ` C ${cpx},${p0.y} ${cpx},${p1.y} ${p1.x},${p1.y}`
    }
    return d
  })()

  // Area fill path (curve + bottom edge)
  const areaPath = curvePath
    ? `${curvePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
    : ''

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '60px' }}>
        <defs>
          <linearGradient id="heatmap-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(14, 90%, 65%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(24, 85%, 68%)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#heatmap-gradient)" />
        )}
        {/* Curve line */}
        {curvePath && (
          <path d={curvePath} fill="none" stroke="hsl(14, 90%, 65%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        )}
        {/* Data points */}
        {points.map((p, i) => (
          data[i].count > 0 && (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="hsl(14, 90%, 65%)" opacity="0.8" />
          )
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-2 mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-2xs text-muted-foreground">{d.label}</span>
        ))}
      </div>
    </div>
  )
}
