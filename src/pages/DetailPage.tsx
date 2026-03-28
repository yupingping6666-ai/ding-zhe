import { Button } from '@/components/ui/button'
import {
  CATEGORY_CONFIG,
  INTENSITY_CONFIG,
  REPEAT_CONFIG,
  WEEKDAY_LABELS,
  ITEM_TYPE_CONFIG,
} from '@/types'
import { formatDelay, formatTime } from '@/lib/time'
import type { Store } from '@/store'
import { getUser } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS, getTimelineCompanionNote } from '@/lib/companion'
import { ArrowLeft, Circle, CheckCircle2, Clock, SkipForward, XCircle, AlertCircle, MessageCircle } from 'lucide-react'

interface Props {
  templateId: string
  store: Store
  onBack: () => void
}

export function DetailPage({ templateId, store, onBack }: Props) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]
  const template = store.getTemplate(templateId)

  if (!template) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <span className="text-4xl block mb-3 animate-float">{character.expressions.thinking}</span>
        <p>找不到这个任务</p>
        <button onClick={onBack} className="text-primary mt-2 text-sm">返回</button>
      </div>
    )
  }

  const typeConf = ITEM_TYPE_CONFIG[template.itemType]
  const intensity = INTENSITY_CONFIG[template.followUpIntensity]
  const isCreator = template.creatorId === currentUserId
  const isReceiver = template.receiverId === currentUserId
  const isSelf = template.creatorId === template.receiverId
  const otherUser = isCreator ? getUser(template.receiverId) : getUser(template.creatorId)

  // Current instance (deferred or awaiting)
  const currentInstance = store.instances.find(
    (i) => i.templateId === templateId && (i.status === 'deferred' || i.status === 'awaiting')
  )

  // Recent history
  const history = store.instances
    .filter(
      (i) => i.templateId === templateId && (i.status === 'completed' || i.status === 'skipped' || i.status === 'expired')
    )
    .sort((a, b) => b.scheduledTime - a.scheduledTime)
    .slice(0, 5)

  const actionIcons: Record<string, React.ReactNode> = {
    reminded: <AlertCircle className="w-3.5 h-3.5 text-awaiting" />,
    user_completed: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
    user_deferred: <Clock className="w-3.5 h-3.5 text-deferred" />,
    user_skipped: <SkipForward className="w-3.5 h-3.5 text-skip" />,
    auto_deferred: <Clock className="w-3.5 h-3.5 text-deferred" />,
    follow_up_sent: <AlertCircle className="w-3.5 h-3.5 text-deferred" />,
    expired: <XCircle className="w-3.5 h-3.5 text-expired" />,
    acknowledged: <CheckCircle2 className="w-3.5 h-3.5 text-care" />,
    feedback_sent: <MessageCircle className="w-3.5 h-3.5 text-confirm" />,
    cant_do: <XCircle className="w-3.5 h-3.5 text-muted-foreground" />,
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">事项详情</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Task info header */}
        <div className="bg-card rounded-3xl border border-border/40 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{typeConf.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{template.name}</h2>
                <span className={`sticker sticker-${template.itemType}`}>
                  {typeConf.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{CATEGORY_CONFIG[template.category].label}</span>
            </div>
          </div>

          {/* Relationship info with companions */}
          {!isSelf && (
            <div className="flex items-center gap-3 mb-3 px-3 py-2.5 bg-secondary/60 rounded-2xl">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{character.avatar}</span>
                <span className="text-xs font-semibold text-foreground">{user.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {isCreator ? '→' : '←'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{character.avatar}</span>
                <span className="text-xs font-semibold text-foreground">{otherUser.name}</span>
              </div>
              <span className="text-2xs text-muted-foreground ml-auto">
                {isCreator ? '你发起的' : '发给你的'}
              </span>
            </div>
          )}

          {/* Creator note */}
          {template.note && (
            <div className="mb-3 px-3.5 py-2 rounded-2xl rounded-tl-md bg-care-surface/50 border border-care/10">
              <p className="text-xs text-foreground leading-relaxed">"{template.note}"</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">提醒时间</span>
              <span className="font-medium text-foreground">
                {REPEAT_CONFIG[template.repeatRule].label} {template.remindTime}
              </span>
              {template.repeatRule === 'weekly' && (
                <span className="text-xs text-muted-foreground block mt-0.5">
                  每周{template.weeklyDays.map((d) => WEEKDAY_LABELS[d]).join('、')}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">跟进强度</span>
              <span className="font-medium text-foreground">{intensity.label}</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {intensity.interval}分钟/最多{intensity.maxFollowUps}次
              </span>
            </div>
          </div>
        </div>

        {/* Current instance status */}
        {currentInstance && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">当前这次</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">状态</span>
                <span className={`font-medium ${currentInstance.status === 'deferred' ? 'text-deferred-foreground' : 'text-awaiting-foreground'}`}>
                  {currentInstance.status === 'deferred' ? '还没完成' : '等待处理'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">关系状态</span>
                <span className="text-foreground">{currentInstance.relationStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">原定时间</span>
                <span className="text-foreground">{formatTime(currentInstance.scheduledTime)}</span>
              </div>
              {currentInstance.deferredSince && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">已延迟</span>
                  <span className="text-deferred-foreground font-medium">
                    {formatDelay(currentInstance.deferredSince)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">已跟进</span>
                <span className="text-foreground">
                  {currentInstance.followUpCount} / {currentInstance.maxFollowUps} 次
                </span>
              </div>
            </div>

            {/* Actions: only for receiver */}
            {isReceiver && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant={template.itemType === 'care' ? 'care' : 'success'}
                  size="sm"
                  className="flex-1"
                  onClick={() => store.completeInstance(currentInstance.id)}
                >
                  {template.itemType === 'care' ? '收到啦~ 🧡' : '搞定啦! 🍀'}
                </Button>
                <Button
                  variant="defer"
                  size="sm"
                  className="flex-1"
                  onClick={() => store.deferInstance(currentInstance.id, 10)}
                >
                  稍后
                </Button>
                <Button
                  variant="skip"
                  size="sm"
                  className="flex-1 border border-input"
                  onClick={() => store.skipInstance(currentInstance.id)}
                >
                  跳过
                </Button>
              </div>
            )}

            {/* Creator view: companion waiting message */}
            {isCreator && !isReceiver && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-lg">{character.expressions.waiting}</span>
                <p className="text-xs text-muted-foreground">{character.name}说：等{otherUser.name}处理中~</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback display */}
        {history.some(i => i.feedback) && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">反馈记录</h3>
            {history.filter(i => i.feedback).map(inst => (
              <div key={inst.id} className="flex items-start gap-2 mb-2">
                <MessageCircle className="w-3.5 h-3.5 text-confirm mt-0.5" />
                <p className="text-sm text-foreground">{inst.feedback}</p>
              </div>
            ))}
          </div>
        )}

        {/* Timeline with companion notes */}
        {currentInstance && currentInstance.actionLog.length > 0 && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">这次的时间线</h3>
              <span className="text-sm">{character.avatar}</span>
            </div>
            <div className="space-y-0">
              {currentInstance.actionLog.map((log, i) => {
                const companionNote = getTimelineCompanionNote(character, log.action)
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    {i < currentInstance.actionLog.length - 1 && (
                      <div className="absolute left-[6.5px] top-5 w-px h-full bg-border" />
                    )}
                    <div className="mt-0.5 relative z-10">
                      {actionIcons[log.action] || <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{log.note}</p>
                      {companionNote && (
                        <p className="text-2xs text-muted-foreground/70 mt-0.5 italic">{companionNote}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {currentInstance.status === 'deferred' && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/40 animate-pulse-soft" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground italic">等待中...</p>
                    <p className="text-2xs text-muted-foreground/60 italic">{character.name}在耐心等待~</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">最近记录</h3>
            <div className="space-y-2.5">
              {history.map((inst) => {
                const statusIcon = inst.status === 'completed'
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : inst.status === 'skipped'
                    ? <SkipForward className="w-4 h-4 text-skip" />
                    : <XCircle className="w-4 h-4 text-expired" />
                const label = inst.status === 'completed'
                  ? `完成于 ${formatTime(inst.completedAt!)}`
                  : inst.status === 'skipped'
                    ? '跳过'
                    : '没来得及'
                return (
                  <div key={inst.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatTime(inst.scheduledTime)}</span>
                    <div className="flex items-center gap-1.5">
                      {statusIcon}
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Management (only for creator) */}
        {isCreator && (
          <div className="bg-card rounded-3xl border border-border/40 divide-y divide-border/40 overflow-hidden">
            <button className="w-full px-5 py-3.5 text-sm text-left text-foreground hover:bg-accent/30 transition-colors rounded-t-3xl">
              编辑提醒规则
            </button>
            <button className="w-full px-5 py-3.5 text-sm text-left text-foreground hover:bg-accent/30 transition-colors">
              暂停这个提醒
            </button>
            <button className="w-full px-5 py-3.5 text-sm text-left text-destructive hover:bg-accent/30 transition-colors rounded-b-3xl">
              删除这个提醒
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
