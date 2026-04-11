import { useState } from 'react'
import { X, RefreshCw, Send } from 'lucide-react'
import type { Store } from '@/store'
import type { RelayGenerateResult, RelayVersionType } from '@/types'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import PetSvg from '@/components/pet/PetSvg'
import { generateRelayVersions } from '@/api/emotion-relay'
import { generateLocalRelayVersions } from '@/lib/emotion-relay'

interface Props {
  store: Store
  onClose: () => void
}

type Phase = 'input' | 'generating' | 'select'

const VERSION_META: Record<RelayVersionType, { label: string; badge: string }> = {
  gentle: { label: '温柔版', badge: '🌸' },
  casual: { label: '轻松版', badge: '😊' },
  direct: { label: '直球版', badge: '💘' },
}

export function EmotionRelayOverlay({ store, onClose }: Props) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const partner = store.getUserProfile(user.partnerId)
  const companion = COMPANION_CHARACTERS[store.space.companion]

  const [phase, setPhase] = useState<Phase>('input')
  const [inputText, setInputText] = useState('')
  const [versions, setVersions] = useState<RelayGenerateResult | null>(null)
  const [selected, setSelected] = useState<RelayVersionType | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleGenerate() {
    if (!inputText.trim()) return
    setPhase('generating')
    setSelected(null)

    try {
      const result = await generateRelayVersions(inputText.trim(), {
        senderName: user.name,
        receiverName: partner.name,
        companionName: companion.name,
        relationDays: store.relationDays,
        relationType: store.space.relationType,
      })

      if (result.fallback) {
        const local = generateLocalRelayVersions(inputText.trim(), companion.name)
        setVersions(local)
      } else {
        setVersions({ gentle: result.gentle, casual: result.casual, direct: result.direct })
      }
    } catch {
      const local = generateLocalRelayVersions(inputText.trim(), companion.name)
      setVersions(local)
    }

    setPhase('select')
  }

  function handleSend() {
    if (!selected || !versions || isSending) return
    setIsSending(true)
    const relayText = versions[selected]
    store.sendRelay(currentUserId, partner.id, inputText.trim(), selected, relayText)
    onClose()
  }

  function handleRegenerate() {
    setVersions(null)
    setSelected(null)
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
                  <p className="text-xs text-muted-foreground">把你的心意转化为温暖的话~</p>
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
                生成表达
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
                <span className="text-sm text-muted-foreground">{companion.name}正在帮你想</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.4s' }} />
                </span>
              </div>
            </div>
          )}

          {/* Phase 3: Version selection */}
          {phase === 'select' && versions && (
            <>
              {/* Original text reminder */}
              <div className="mb-3 mt-1 p-3 rounded-xl bg-secondary/40 border border-border/20">
                <p className="text-2xs text-muted-foreground/70 mb-1">你的原话</p>
                <p className="text-xs text-foreground leading-relaxed">{inputText}</p>
              </div>

              <h2 className="text-sm font-semibold text-foreground mb-3">选一个你喜欢的表达方式~</h2>

              <div className="space-y-2.5 mb-4">
                {(['gentle', 'casual', 'direct'] as RelayVersionType[]).map(type => {
                  const meta = VERSION_META[type]
                  const isSelected = selected === type
                  return (
                    <button
                      key={type}
                      onClick={() => setSelected(type)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 scale-[1.02]'
                          : 'border-border/30 bg-secondary/30 hover:border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">{meta.badge}</span>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{versions[type]}</p>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSend}
                  disabled={!selected || isSending}
                  className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    selected && !isSending
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
                  <span>换一批</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
