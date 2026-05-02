import { useState, useCallback, useMemo, useEffect } from 'react'
import type { PetExpression } from '@/types'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { PetEmoji } from '@/components/PetEmoji'
import { canInteract, getInteractionCooldownRemaining, PET_COOLDOWNS } from '@/lib/pet-state'
import PetSvg from '@/components/pet/PetSvg'
import { getTimeOfDay } from '@/lib/time-of-day'
import { Bell, Camera, Mic, Heart, CheckCircle2, Calendar, BarChart3, Sparkles, ChevronRight, UtensilsCrossed, HandHeart, ClipboardList } from 'lucide-react'

interface Props {
  store: Store
  userMode: 'single' | 'dual'
  onOpenPetPanel: () => void
  onOpenCreate: () => void
  onVoiceCreate: () => void
  onOpenNotifications: () => void
  onOpenTodo: () => void
}

export function HomePage({ store, userMode, onOpenPetPanel, onOpenCreate, onVoiceCreate, onOpenNotifications, onOpenTodo }: Props) {
  const currentUserId = useCurrentUser()
  const [petBounce, setPetBounce] = useState(false)
  const [floatingText, setFloatingText] = useState<string | null>(null)
  const [overrideExpression, setOverrideExpression] = useState<PetExpression | null>(null)
  const [, setTick] = useState(0)

  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]
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

  // Summary counts for the todo card
  const allReceivedItems = store.getReceivedItems(currentUserId)
  // In single mode, only count self-created items (matching TodoPage logic)
  const receivedItems = userMode === 'single'
    ? allReceivedItems.filter((i) => {
        const tpl = store.getTemplate(i.templateId)
        return tpl && tpl.creatorId === tpl.receiverId
      })
    : allReceivedItems
  const activeCount = receivedItems.filter((i) => i.status === 'deferred' || i.status === 'awaiting').length
  const upcomingCount = receivedItems.filter((i) => i.status === 'pending').length
  const completedCount = receivedItems.filter((i) => i.status === 'completed').length

  // Per-user today stats (for stats card)
  const todayUserStats = store.getTodayReceivedStats(currentUserId, userMode === 'single')

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
  }, [store.feelings, store.instances, store.relayMessages, currentUserId])

  // AI feedback based on today's activity
  const aiComment = useMemo(() => {
    const completed = todayUserStats.completed
    const total = todayUserStats.total
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
  }, [todayUserStats.completed, todayUserStats.total, store.todayFeelingCount, character.name])

  // Summary text for the todo card
  const summaryText = (() => {
    if (activeCount > 0 && upcomingCount > 0) {
      return `${activeCount} 件待处理，${upcomingCount} 件待会儿的`
    }
    if (activeCount > 0) {
      return `有 ${activeCount} 件事等你处理`
    }
    if (upcomingCount > 0) {
      return `${completedCount > 0 ? `已完成 ${completedCount} 件，` : ''}还有 ${upcomingCount} 件待会儿的`
    }
    if (completedCount > 0) {
      return `已搞定 ${completedCount} 件`
    }
    return '暂无待办事项'
  })()

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
              <p className="text-xl font-extrabold text-foreground">{todayUserStats.completed}/{todayUserStats.total}</p>
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

      {/* ===== Today Summary Card ===== */}
      <div className="px-4 pt-4">
        <button
          onClick={onOpenTodo}
          className="w-full bg-white rounded-2xl p-4 shadow-card-default border border-border/30 flex items-center gap-3.5 hover:bg-accent/30 active:bg-accent/50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">待办事项</p>
            <p className="text-xs text-muted-foreground mt-0.5">{summaryText}</p>
          </div>
          {activeCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
              {activeCount}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
              <PetEmoji value={character.avatar} size="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{aiComment}</p>
          </div>
        </div>
      </div>
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
