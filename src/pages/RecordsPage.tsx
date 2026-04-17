import { useState } from 'react'
import { ITEM_TYPE_CONFIG } from '@/types'
import { formatTime } from '@/lib/time'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { ArrowLeft, CheckCircle2, SkipForward, XCircle, TrendingUp, Clock } from 'lucide-react'

interface Props {
  store: Store
  onBack: () => void
}

type RecordsTab = 'received' | 'sent'

export function RecordsPage({ store, onBack }: Props) {
  const currentUserId = useCurrentUser()
  const [tab, setTab] = useState<RecordsTab>('received')
  const { getTemplate } = store

  const receivedInstances = store.getReceivedItems(currentUserId)
  const sentInstances = store.getSentItems(currentUserId)

  const activeInstances = tab === 'received' ? receivedInstances : sentInstances

  const completed = activeInstances.filter((i) => i.status === 'completed')
  const skipped = activeInstances.filter((i) => i.status === 'skipped')
  const expired = activeInstances.filter((i) => i.status === 'expired')
  const allDone = [...completed, ...skipped, ...expired].sort(
    (a, b) => (b.completedAt || b.skippedAt || b.expiredAt || 0) - (a.completedAt || a.skippedAt || a.expiredAt || 0)
  )

  // Simulated weekly data
  const weekDays = ['一', '二', '三', '四']
  const weekRates = [85, 100, 70, 50]

  // Most deferred tasks
  const deferredCounts: Record<string, { name: string; emoji: string; count: number; avgDelay: number }> = {}
  activeInstances
    .filter((i) => i.deferredSince)
    .forEach((i) => {
      const tpl = getTemplate(i.templateId)
      if (!tpl) return
      if (!deferredCounts[tpl.id]) {
        const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
        deferredCounts[tpl.id] = { name: tpl.name, emoji: typeConf.emoji, count: 0, avgDelay: 0 }
      }
      deferredCounts[tpl.id].count += 1
      const delay = i.deferredSince ? Math.floor((Date.now() - i.deferredSince) / 60000) : 0
      deferredCounts[tpl.id].avgDelay = Math.floor(
        (deferredCounts[tpl.id].avgDelay * (deferredCounts[tpl.id].count - 1) + delay) / deferredCounts[tpl.id].count
      )
    })
  const topDeferred = Object.values(deferredCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">记录</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Tab switch */}
        <div className="flex bg-secondary rounded-xl p-1">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'received' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            我收到的
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'sent' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            我发出的
          </button>
        </div>

        {/* Today overview */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2.5">今日概览</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-success-surface rounded-2xl p-4 text-center border border-success/10">
              <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1.5" />
              <span className="text-2xl font-bold text-foreground block">{completed.length}</span>
              <span className="text-xs text-muted-foreground">已完成</span>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center border">
              <SkipForward className="w-5 h-5 text-skip mx-auto mb-1.5" />
              <span className="text-2xl font-bold text-foreground block">{skipped.length}</span>
              <span className="text-xs text-muted-foreground">已跳过</span>
            </div>
            <div className="bg-expired-surface rounded-2xl p-4 text-center border border-expired/10">
              <XCircle className="w-5 h-5 text-expired mx-auto mb-1.5" />
              <span className="text-2xl font-bold text-foreground block">{expired.length}</span>
              <span className="text-xs text-muted-foreground">没来得及</span>
            </div>
          </div>
        </div>

        {/* Weekly rate */}
        <div className="bg-card rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">本周完成率</h2>
          </div>
          <div className="space-y-3">
            {weekDays.map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4 text-center">{day}</span>
                <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${weekRates[i]}%`,
                      background: weekRates[i] >= 80
                        ? 'hsl(var(--success))'
                        : weekRates[i] >= 60
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--deferred))',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-8 text-right">{weekRates[i]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most deferred */}
        {topDeferred.length > 0 && (
          <div className="bg-card rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-deferred" />
              <h2 className="text-sm font-semibold text-foreground">最常延迟的任务</h2>
            </div>
            <div className="space-y-3">
              {topDeferred.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{item.name}</span>
                  <span className="text-xs text-deferred-foreground">
                    平均延迟 {item.avgDelay} 分
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent records */}
        {allDone.length > 0 && (
          <div className="bg-card rounded-2xl border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">最近处理记录</h2>
            <div className="space-y-2.5">
              {allDone.map((inst) => {
                const tpl = getTemplate(inst.templateId)
                if (!tpl) return null
                const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                const otherUser = tab === 'received'
                  ? (tpl.creatorId !== tpl.receiverId ? store.getUserProfile(tpl.creatorId) : null)
                  : store.getUserProfile(tpl.receiverId)
                const icon = inst.status === 'completed'
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : inst.status === 'skipped'
                    ? <SkipForward className="w-4 h-4 text-skip" />
                    : <XCircle className="w-4 h-4 text-expired" />
                const label = inst.status === 'completed'
                  ? `完成于 ${formatTime(inst.completedAt!)}`
                  : inst.status === 'skipped'
                    ? '已跳过'
                    : '没来得及'

                return (
                  <div key={inst.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">{formatTime(inst.scheduledTime)}</span>
                    <span className="text-sm">{typeConf.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground truncate block">{tpl.name}</span>
                      {otherUser && (
                        <span className="text-2xs text-muted-foreground">
                          {tab === 'received' ? '来自' : '给'} {otherUser.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {icon}
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
