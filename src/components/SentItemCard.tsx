import { ITEM_TYPE_CONFIG } from '@/types'
import { formatTime } from '@/lib/time'
import type { TaskInstance, TaskTemplate, RelationStatus } from '@/types'
import { getUser } from '@/store'
import { CheckCircle2, Clock, MessageCircle, Eye, Send, Hourglass } from 'lucide-react'

interface Props {
  instance: TaskInstance
  template: TaskTemplate
  onTapName?: () => void
}

const STATUS_STEPS: { key: RelationStatus; label: string; emoji: string }[] = [
  { key: 'sent', label: '已发', emoji: '📤' },
  { key: 'delivered', label: '已达', emoji: '📬' },
  { key: 'seen', label: '已看', emoji: '👀' },
  { key: 'responded', label: '已应', emoji: '💬' },
  { key: 'resolved', label: '完结', emoji: '🎉' },
]

function getStepIndex(status: RelationStatus): number {
  const idx = STATUS_STEPS.findIndex(s => s.key === status)
  return idx >= 0 ? idx : 0
}

export function SentItemCard({ instance, template, onTapName }: Props) {
  const typeConf = ITEM_TYPE_CONFIG[template.itemType]
  const receiver = getUser(template.receiverId)

  const isActive = instance.status === 'pending' || instance.status === 'awaiting' || instance.status === 'deferred'
  const isDone = instance.status === 'completed'
  const isSkipped = instance.status === 'skipped'
  const stepIdx = getStepIndex(instance.relationStatus)

  const stripeClass = template.itemType === 'care' ? 'stripe-care' :
    template.itemType === 'confirm' ? 'stripe-confirm' : 'stripe-todo'

  const statusIcon = isDone
    ? <CheckCircle2 className="w-4 h-4 text-success" />
    : isSkipped
      ? <Clock className="w-4 h-4 text-skip" />
      : instance.status === 'deferred'
        ? <Hourglass className="w-4 h-4 text-deferred animate-pulse-soft" />
        : instance.relationStatus === 'seen'
          ? <Eye className="w-4 h-4 text-awaiting" />
          : <Send className="w-4 h-4 text-muted-foreground" />

  const statusText = isDone
    ? '已完成'
    : isSkipped
      ? (instance.actionLog.some(a => a.action === 'cant_do') ? '做不了' : '已跳过')
      : instance.status === 'deferred'
        ? '处理中...'
        : instance.relationStatus === 'seen'
          ? '已查看'
          : '等待回应'

  return (
    <div
      className={`rounded-3xl border border-border/40 p-4 transition-all duration-200 cursor-pointer ${stripeClass} ${
        isActive ? 'bg-card shadow-card-default' : 'bg-card/60'
      }`}
      onClick={onTapName}
    >
      <div className="flex items-start gap-3">
        {/* Left: type emoji in colored circle */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          template.itemType === 'care' ? 'bg-care-surface' :
          template.itemType === 'confirm' ? 'bg-confirm-surface' :
          'bg-todo-surface'
        }`}>
          <span className="text-xl">{typeConf.emoji}</span>
        </div>

        {/* Middle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold truncate ${isDone || isSkipped ? 'text-muted-foreground' : 'text-foreground'}`}>
              {template.name}
            </h3>
            <span className={`sticker sticker-${template.itemType}`}>{typeConf.label}</span>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">
            给 {receiver.avatar} {receiver.name} &middot; {formatTime(instance.scheduledTime)}
          </p>

          {/* Mini progress dots */}
          {isActive && (
            <div className="flex items-center gap-1 mt-2">
              {STATUS_STEPS.slice(0, 4).map((step, i) => (
                <div key={step.key} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    i <= stepIdx
                      ? template.itemType === 'care' ? 'bg-care' :
                        template.itemType === 'confirm' ? 'bg-confirm' : 'bg-todo'
                      : 'bg-border'
                  }`} />
                  {i < 3 && (
                    <div className={`w-3 h-0.5 ${
                      i < stepIdx
                        ? template.itemType === 'care' ? 'bg-care/40' :
                          template.itemType === 'confirm' ? 'bg-confirm/40' : 'bg-todo/40'
                        : 'bg-border'
                    }`} />
                  )}
                </div>
              ))}
              <span className="text-2xs text-muted-foreground ml-1">
                {STATUS_STEPS[stepIdx]?.label}
              </span>
            </div>
          )}

          {/* Feedback */}
          {instance.feedback && (
            <div className="mt-2 flex items-start gap-1.5 bg-confirm-surface/50 rounded-xl px-2.5 py-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-confirm mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground">{instance.feedback}</p>
            </div>
          )}
        </div>

        {/* Right: status */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {statusIcon}
          <span className={`text-2xs font-semibold ${
            isDone ? 'text-success' :
            isSkipped ? 'text-skip' :
            instance.status === 'deferred' ? 'text-deferred' :
            'text-muted-foreground'
          }`}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  )
}
