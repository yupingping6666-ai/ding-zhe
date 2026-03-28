import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ITEM_TYPE_CONFIG } from '@/types'
import { formatDelay, formatTime } from '@/lib/time'
import type { TaskInstance, TaskTemplate } from '@/types'
import { getUser } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import type { Store } from '@/store'
import { X, Send } from 'lucide-react'

interface Props {
  instance: TaskInstance
  template: TaskTemplate | undefined
  store: Store
  onComplete: (id: string) => void
  onDefer: (id: string, mins: number) => void
  onSkip: (id: string) => void
  onCantDo: (id: string) => void
  onFeedback: (id: string, text: string) => void
  onClose: () => void
}

const DEFER_OPTIONS = [
  { label: '10 分钟', mins: 10, emoji: '☕' },
  { label: '30 分钟', mins: 30, emoji: '🍵' },
  { label: '1 小时', mins: 60, emoji: '🌙' },
]

export function ReminderOverlay({ instance, template, store, onComplete, onDefer, onSkip, onCantDo, onFeedback, onClose }: Props) {
  const [showDefer, setShowDefer] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  if (!template) return null

  const typeConf = ITEM_TYPE_CONFIG[template.itemType]
  const isFollowUp = instance.followUpCount > 0
  const delayText = formatDelay(instance.deferredSince)
  const isSelf = template.creatorId === template.receiverId
  const sender = !isSelf ? getUser(template.creatorId) : null

  const bgClass = template.itemType === 'care' ? 'gradient-care' :
    template.itemType === 'confirm' ? 'gradient-confirm' : 'gradient-todo'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/25 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-[2rem] shadow-overlay animate-slide-up safe-bottom">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-2 pb-8">
          {/* Colored badge area with companion */}
          <div className={`rounded-3xl p-5 mb-5 text-center relative ${bgClass}`}>
            {/* Companion floating in corner */}
            <div className="absolute -top-3 -right-1 text-2xl animate-float">
              {isFollowUp ? character.expressions.remind : character.expressions.idle}
            </div>

            <span className="text-5xl mb-3 block">{typeConf.emoji}</span>
            <h2 className="text-xl font-extrabold text-foreground mb-1">
              {template.name}
            </h2>
            <span className={`sticker sticker-${template.itemType} text-xs`}>
              {typeConf.label}
            </span>
            {sender && (
              <p className="text-sm text-muted-foreground mt-2">
                {sender.avatar} {sender.name}{typeConf.senderVerb}
              </p>
            )}
            {isFollowUp ? (
              <p className="text-xs text-muted-foreground mt-1">
                {character.name}说：这件事还在等你哦~
                {delayText && <span className="text-deferred font-semibold ml-1">已过 {delayText}</span>}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(instance.scheduledTime)} 的提醒到啦
              </p>
            )}
          </div>

          {/* Creator note */}
          {template.note && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-secondary/80 text-center">
              <p className="text-sm text-foreground leading-relaxed">"{template.note}"</p>
            </div>
          )}

          {/* Confirm: feedback input */}
          {template.itemType === 'confirm' && (
            <div className="mb-5 flex items-center gap-2">
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="回复TA..."
                className="flex-1 h-11 px-4 rounded-full bg-secondary border-none text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-confirm/30"
              />
              <Button
                variant="confirm"
                size="default"
                disabled={!feedbackText.trim()}
                onClick={() => {
                  onFeedback(instance.id, feedbackText.trim())
                  onClose()
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Primary action */}
          <div className="space-y-3">
            {template.itemType === 'care' && (
              <Button
                variant="care"
                size="xl"
                className="w-full text-base"
                onClick={() => { onComplete(instance.id); onClose() }}
              >
                收到啦~ 🧡
              </Button>
            )}
            {template.itemType === 'todo' && (
              <Button
                variant="todo"
                size="xl"
                className="w-full text-base"
                onClick={() => { onComplete(instance.id); onClose() }}
              >
                搞定啦! 🍀
              </Button>
            )}

            {/* Secondary actions */}
            <div className="flex gap-3">
              <Button
                variant="defer"
                size="lg"
                className="flex-1"
                onClick={() => setShowDefer(!showDefer)}
              >
                ⏰ 稍后提醒
              </Button>
              {template.itemType === 'todo' && !isSelf ? (
                <Button
                  variant="cant-do"
                  size="lg"
                  className="flex-1 border border-input"
                  onClick={() => { onCantDo(instance.id); onClose() }}
                >
                  做不了 😅
                </Button>
              ) : (
                <Button
                  variant="skip"
                  size="lg"
                  className="flex-1 border border-input"
                  onClick={() => { onSkip(instance.id); onClose() }}
                >
                  跳过
                </Button>
              )}
            </div>

            {/* Defer picker */}
            {showDefer && (
              <div className="bg-secondary/80 rounded-2xl p-2 animate-fade-in">
                <p className="text-xs text-muted-foreground text-center mb-2 mt-1">
                  {character.name}说：要不我晚点再提醒你?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEFER_OPTIONS.map((opt) => (
                    <button
                      key={opt.mins}
                      className="py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-card transition-colors flex flex-col items-center gap-1"
                      onClick={() => { onDefer(instance.id, opt.mins); onClose() }}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
