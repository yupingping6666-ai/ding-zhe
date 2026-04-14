import { useState } from 'react'
import { X, RefreshCw, Send } from 'lucide-react'
import type { Store } from '@/store'
import type { RelayVersionType } from '@/types'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import PetSvg from '@/components/pet/PetSvg'
import { generateSmartRelay, type RelaySmartResult } from '@/api/emotion-relay'
import { generateLocalSmartRelay } from '@/lib/emotion-relay'

interface Props {
  store: Store
  onClose: () => void
}

type Phase = 'input' | 'generating' | 'preview'

const TONE_LABELS: Record<RelayVersionType, { label: string; badge: string }> = {
  gentle: { label: '温柔', badge: '🌸' },
  casual: { label: '轻松', badge: '😊' },
  direct: { label: '直球', badge: '💘' },
}

export function EmotionRelayOverlay({ store, onClose }: Props) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const partner = store.getUserProfile(user.partnerId)
  const companion = COMPANION_CHARACTERS[store.space.companion]

  const [phase, setPhase] = useState<Phase>('input')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<RelaySmartResult | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleGenerate() {
    if (!inputText.trim()) return
    setPhase('generating')
    setResult(null)

    try {
      const smartResult = await generateSmartRelay(inputText.trim(), {
        senderName: user.name,
        receiverName: partner.name,
        companionName: companion.name,
        relationDays: store.relationDays,
        relationType: store.space.relationType,
      })

      if (smartResult.fallback || !smartResult.text) {
        const local = generateLocalSmartRelay(inputText.trim(), companion.name)
        setResult(local)
      } else {
        setResult(smartResult)
      }
    } catch {
      const local = generateLocalSmartRelay(inputText.trim(), companion.name)
      setResult(local)
    }

    setPhase('preview')
  }

  function handleSend() {
    if (!result || !result.text || isSending) return
    setIsSending(true)
    store.sendRelay(currentUserId, partner.id, inputText.trim(), result.tone, result.text)
    onClose()
  }

  function handleRegenerate() {
    setResult(null)
    handleGenerate()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full bg-card rounded-t-3xl shadow-chooser animate-slide-up max-h-[85%] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-5 pt-2 pb-6">
          {/* Phase 1: Input */}
          {phase === 'input' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/50 flex-shrink-0">
                  <PetSvg animal={store.space.companion} expression="love" className="w-full h-full" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">让{companion.name}帮你说</h2>
                  <p className="text-xs text-muted-foreground">小橘会帮您选择最适合的表达方式~</p>
                </div>
              </div>

              <div className="relative mb-4">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="想对TA说什么呢..."
                  maxLength={200}
                  rows={4}
                  className="w-full bg-secondary/40 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none border border-border/20 focus:border-primary/30 transition-colors"
                />
                <span className="absolute bottom-3 right-3 text-2xs text-muted-foreground/50">
                  {inputText.length}/200
                </span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all ${
                  inputText.trim()
                    ? 'bg-primary text-white active:scale-[0.98]'
                    : 'bg-secondary/60 text-muted-foreground/40'
                }`}
              >
                智能优化表达
              </button>
            </>
          )}

          {/* Phase 2: Generating */}
          {phase === 'generating' && (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary/50 mb-4">
                <PetSvg animal={store.space.companion} expression="thinking" className="w-full h-full" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{companion.name}正在帮你优化表达</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.4s' }} />
                </span>
              </div>
            </div>
          )}

          {/* Phase 3: Preview & Send */}
          {phase === 'preview' && result && (
            <>
              {/* Original text */}
              <div className="mb-3 mt-1 p-3 rounded-xl bg-secondary/40 border border-border/20">
                <p className="text-2xs text-muted-foreground/70 mb-1">你的原话</p>
                <p className="text-xs text-foreground leading-relaxed">{inputText}</p>
              </div>

              {/* AI optimized result */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{TONE_LABELS[result.tone].badge}</span>
                  <span className="text-xs font-semibold text-primary">
                    AI选择了{TONE_LABELS[result.tone].label}表达
                  </span>
                </div>
                <div className="p-4 rounded-2xl border-2 border-primary bg-primary/5">
                  <p className="text-sm text-foreground leading-relaxed">{result.text}</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    !isSending
                      ? 'bg-primary text-white active:scale-[0.98]'
                      : 'bg-secondary/60 text-muted-foreground/40'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>发送给TA</span>
                </button>

                <button
                  onClick={handleRegenerate}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-secondary/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>换一种表达</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
