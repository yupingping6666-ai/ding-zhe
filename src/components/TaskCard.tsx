import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ITEM_TYPE_CONFIG } from '@/types'
import { formatDelay, formatTime } from '@/lib/time'
import type { TaskInstance, TaskTemplate } from '@/types'
import { getUser } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { Clock, ChevronDown, Send } from 'lucide-react'

interface Props {
  instance: TaskInstance
  template: TaskTemplate | undefined
  onComplete: (id: string) => void
  onDefer: (id: string, mins: number) => void
  onSkip: (id: string) => void
  onCantDo: (id: string) => void
  onFeedback: (id: string, text: string) => void
  onTapName?: (id: string) => void
  variant: 'deferred' | 'awaiting' | 'pending'
}

const DEFER_OPTIONS = [
  { label: '10 分钟后', mins: 10 },
  { label: '30 分钟后', mins: 30 },
  { label: '1 小时后', mins: 60 },
]

export function TaskCard({ instance, template, onComplete, onDefer, onSkip, onCantDo, onFeedback, onTapName, variant }: Props) {
  const [showDefer, setShowDefer] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const currentUserId = useCurrentUser()

  if (!template) return null

  const typeConf = ITEM_TYPE_CONFIG[template.itemType]
  const isDeferred = variant === 'deferred'
  const isPending = variant === 'pending'
  const delayText = formatDelay(instance.deferredSince)
  const isSelf = template.creatorId === template.receiverId
  const sender = !isSelf && template.creatorId !== currentUserId
    ? getUser(template.creatorId)
    : null

  // Relationship-oriented sender label
  const senderLabel = sender
    ? `${sender.avatar} ${sender.name}${typeConf.senderVerb}`
    : null

  // Card style per type
  const stripeClass = template.itemType === 'care' ? 'stripe-care' :
    template.itemType === 'confirm' ? 'stripe-confirm' : 'stripe-todo'

  const cardBg = isPending
    ? 'bg-card/80'
    : template.itemType === 'care'
      ? (isDeferred ? 'gradient-care' : 'bg-care-surface/60')
      : template.itemType === 'confirm'
        ? (isDeferred ? 'gradient-confirm' : 'bg-confirm-surface/60')
        : (isDeferred ? 'gradient-todo' : 'bg-todo-surface/60')

  const shadowClass = isPending ? 'shadow-sm' :
    template.itemType === 'care' ? 'shadow-card-care' :
    template.itemType === 'confirm' ? 'shadow-card-confirm' : 'shadow-card-todo'

  return (
    <div className={`rounded-3xl border border-border/40 p-4 transition-all duration-200 ${stripeClass} ${cardBg} ${shadowClass}`}>
      {/* Header: emoji + name + sticker */}
      <button
        className="flex items-start gap-3 w-full text-left mb-2"
        onClick={() => onTapName?.(instance.templateId)}
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">{typeConf.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground truncate">
              {template.name}
            </h3>
            <span className={`sticker sticker-${template.itemType}`}>
              {typeConf.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {senderLabel && (
              <span className="text-xs text-muted-foreground">{senderLabel}</span>
            )}
            <span className="text-xs text-muted-foreground/70">
              {formatTime(instance.scheduledTime)}
            </span>
            {isDeferred && delayText && (
              <span className="text-xs font-semibold text-deferred">
                +{delayText}
              </span>
            )}
          </div>
        </div>

        {/* Follow-up dots */}
        {isDeferred && (
          <div className="flex items-center gap-1 flex-shrink-0 mt-2">
            {Array.from({ length: instance.maxFollowUps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < instance.followUpCount ? 'bg-deferred' : 'bg-deferred-muted'
                }`}
              />
            ))}
          </div>
        )}
      </button>

      {/* Creator note — speech bubble style */}
      {template.note && (
        <div className="mb-3 ml-9 px-3.5 py-2 rounded-2xl rounded-tl-md bg-card/80 border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">"{template.note}"</p>
        </div>
      )}

      {/* Confirm type: feedback input */}
      {template.itemType === 'confirm' && (
        <div className="mb-3 ml-9 flex items-center gap-2">
          <input
            type="text"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="回复一下..."
            className="flex-1 h-9 px-3.5 rounded-full bg-card border border-input text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-confirm/30"
          />
          <Button
            variant="confirm"
            size="sm"
            disabled={!feedbackText.trim()}
            onClick={() => {
              onFeedback(instance.id, feedbackText.trim())
              setFeedbackText('')
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Action buttons — pill shaped, type-colored */}
      <div className="flex items-center gap-2 ml-9">
        {/* Primary action */}
        {template.itemType === 'care' && (
          <Button variant="care-soft" size="sm" className="flex-1" onClick={() => onComplete(instance.id)}>
            收到啦~ 🧡
          </Button>
        )}
        {template.itemType === 'todo' && (
          <Button variant="todo-soft" size="sm" className="flex-1" onClick={() => onComplete(instance.id)}>
            搞定啦! 🍀
          </Button>
        )}

        {/* Defer */}
        <div className="relative">
          <Button variant="defer" size="sm" className="gap-1" onClick={() => setShowDefer(!showDefer)}>
            <Clock className="w-3.5 h-3.5" />
            稍后
            <ChevronDown className={`w-3 h-3 transition-transform ${showDefer ? 'rotate-180' : ''}`} />
          </Button>
          {showDefer && (
            <div className="absolute top-full left-0 mt-1.5 bg-card border rounded-2xl shadow-lg z-20 overflow-hidden animate-fade-in min-w-[130px]">
              {DEFER_OPTIONS.map((opt) => (
                <button
                  key={opt.mins}
                  className="w-full px-3.5 py-2.5 text-sm text-left hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onDefer(instance.id, opt.mins); setShowDefer(false) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cant do / Skip */}
        {template.itemType === 'todo' && !isSelf && (
          <Button variant="cant-do" size="sm" onClick={() => onCantDo(instance.id)}>
            做不了
          </Button>
        )}
        {template.itemType === 'confirm' && (
          <Button variant="skip" size="sm" onClick={() => onSkip(instance.id)}>
            跳过
          </Button>
        )}
      </div>
    </div>
  )
}
