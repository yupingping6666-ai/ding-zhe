import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ITEM_TYPE_CONFIG, TASK_ACTION_CONFIG } from '@/types'
import { formatDelay, formatTime } from '@/lib/time'
import type { TaskInstance, TaskTemplate } from '@/types'
import { UserAvatar } from '@/components/UserAvatar'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { PetEmoji } from '@/components/PetEmoji'
import type { Store } from '@/store'
import { X, Send, Camera } from 'lucide-react'
import { fileToDataUrl, compressImage } from '@/lib/image-utils'

interface Props {
  instance: TaskInstance
  template: TaskTemplate | undefined
  store: Store
  onComplete: (id: string, note?: string, photoUrl?: string) => void
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
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null)
  const pickupFileRef = useRef<HTMLInputElement>(null)
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  if (!template) return null

  const typeConf = ITEM_TYPE_CONFIG[template.itemType]
  const isFollowUp = instance.followUpCount > 0
  const delayText = formatDelay(instance.deferredSince)
  const isSelf = template.creatorId === template.receiverId
  const sender = !isSelf ? store.getUserProfile(template.creatorId) : null
  const isPickup = template.actionType === 'pickup'

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
            <div className="absolute -top-3 -right-1 animate-float">
              <PetEmoji value={isFollowUp ? character.expressions.remind : character.expressions.idle} size="w-8 h-8" />
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
                <span className="w-4 h-4 rounded-full overflow-hidden inline-flex items-center justify-center align-middle"><UserAvatar avatar={sender.avatar} imgClass="w-4 h-4" /></span> {sender.name}{typeConf.senderVerb}
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

          {/* Pickup: optional photo + confirm */}
          {isPickup && (
            <div className="mb-5 space-y-3">
              {pickupPhoto && (
                <div className="flex justify-center">
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-border/40">
                    <img src={pickupPhoto} alt="取件照片" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPickupPhoto(null)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/60 text-white flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              {!pickupPhoto && (
                <button
                  type="button"
                  onClick={() => pickupFileRef.current?.click()}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {TASK_ACTION_CONFIG.pickup.photoLabel}（可选）
                </button>
              )}
              <input
                ref={pickupFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const dataUrl = await fileToDataUrl(file)
                    const compressed = await compressImage(dataUrl)
                    setPickupPhoto(compressed)
                  } catch { /* ignore */ }
                  e.target.value = ''
                }}
              />
            </div>
          )}

          {/* Primary action */}
          <div className="space-y-3">
            {isPickup && (
              <Button
                variant="todo"
                size="xl"
                className="w-full text-base"
                onClick={() => { onComplete(instance.id, '已取件', pickupPhoto || undefined); onClose() }}
              >
                {TASK_ACTION_CONFIG.pickup.completeLabel}
              </Button>
            )}
            {!isPickup && template.itemType === 'care' && (
              <Button
                variant="care"
                size="xl"
                className="w-full text-base"
                onClick={() => { onComplete(instance.id); onClose() }}
              >
                收到啦~ 🧡
              </Button>
            )}
            {!isPickup && template.itemType === 'todo' && (
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
              {(isPickup || template.itemType === 'todo') && !isSelf ? (
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
