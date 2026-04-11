import { useState, useCallback, useEffect } from 'react'
import { X, Heart, UtensilsCrossed, MessageCircle, BookOpen } from 'lucide-react'
import type { Store } from '@/store'
import type { PetExpression } from '@/types'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import PetSvg from './pet/PetSvg'

interface PetPanelProps {
  store: Store
  onClose: () => void
  onTodayStory: () => void
}

type PanelAction = 'pet' | 'feed' | 'talk' | 'story'

export default function PetPanel({ store, onClose, onTodayStory }: PetPanelProps) {
  const companion = COMPANION_CHARACTERS[store.space.companion]
  const [expression, setExpression] = useState<PetExpression>('idle')
  const [floatingText, setFloatingText] = useState<string | null>(null)
  const [foodVisible, setFoodVisible] = useState(false)

  // Check cooldowns
  const now = Date.now()
  const petCooldown = store.currentPetState.lastPetted
    ? Math.max(0, 30_000 - (now - store.currentPetState.lastPetted))
    : 0
  const feedCooldown = store.currentPetState.lastFed
    ? Math.max(0, 300_000 - (now - store.currentPetState.lastFed))
    : 0

  const showFloat = useCallback((text: string) => {
    setFloatingText(text)
    setTimeout(() => setFloatingText(null), 2000)
  }, [])

  const handleAction = useCallback((action: PanelAction) => {
    switch (action) {
      case 'pet':
        if (petCooldown > 0) return
        store.petInteraction('pet')
        setExpression('happy')
        showFloat('开心！')
        setTimeout(() => setExpression('idle'), 3000)
        break
      case 'feed':
        if (feedCooldown > 0) return
        store.petInteraction('feed')
        setExpression('eating')
        setFoodVisible(true)
        showFloat('好吃！')
        setTimeout(() => { setFoodVisible(false); setExpression('idle') }, 3000)
        break
      case 'talk':
        setExpression('love')
        showFloat('喜欢你！')
        setTimeout(() => setExpression('idle'), 3000)
        break
      case 'story':
        onTodayStory()
        break
    }
  }, [petCooldown, feedCooldown, store, showFloat, onTodayStory])

  // Derive expression from pet mood
  useEffect(() => {
    const mood = store.currentPetState.mood
    if (mood === 'sleepy') setExpression('sleeping')
    else if (mood === 'happy') setExpression('happy')
    else setExpression('idle')
  }, [store.currentPetState.mood])

  const actions: { key: PanelAction; icon: React.ReactNode; label: string; disabled: boolean; disabledText?: string }[] = [
    {
      key: 'pet', icon: <Heart className="w-5 h-5" />, label: '摸摸',
      disabled: petCooldown > 0,
      disabledText: petCooldown > 0 ? `${Math.ceil(petCooldown / 1000)}s` : undefined,
    },
    {
      key: 'feed', icon: <UtensilsCrossed className="w-5 h-5" />, label: '喂食',
      disabled: feedCooldown > 0,
      disabledText: feedCooldown > 0 ? `${Math.ceil(feedCooldown / 60000)}min` : undefined,
    },
    { key: 'talk', icon: <MessageCircle className="w-5 h-5" />, label: '和TA说一句', disabled: false },
    { key: 'story', icon: <BookOpen className="w-5 h-5" />, label: '今日故事', disabled: false },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[375px] bg-white rounded-t-3xl overflow-hidden animate-completion-pop"
           style={{ height: '70%' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800">{companion.name}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Pet area */}
        <div className="relative flex items-center justify-center py-6">
          <div className="relative w-40 h-40 animate-pet-breathe">
            <PetSvg animal={store.space.companion} expression={expression} className="w-full h-full" />

            {/* Floating text */}
            {floatingText && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-medium text-pink-500 animate-text-float-fade">
                {floatingText}
              </div>
            )}

            {/* Food animation */}
            {foodVisible && (
              <div className="absolute top-0 right-4 text-2xl animate-food-fall">🍖</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pb-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2 text-center">
              <div className="text-xs text-amber-600">心情</div>
              <div className="text-sm font-medium text-amber-700">{store.currentPetState.mood === 'happy' ? '开心' : store.currentPetState.mood === 'content' ? '满足' : '一般'}</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2 text-center">
              <div className="text-xs text-blue-600">活力</div>
              <div className="text-sm font-medium text-blue-700">{store.currentPetState.energy}%</div>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 text-center">
              <div className="text-xs text-green-600">互动</div>
              <div className="text-sm font-medium text-green-700">{store.currentPetState.todayInteractions}次</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-6">
          <div className="grid grid-cols-4 gap-3">
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={() => handleAction(a.key)}
                disabled={a.disabled}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${
                  a.disabled
                    ? 'bg-gray-100 text-gray-300'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95'
                }`}
              >
                {a.icon}
                <span className="text-xs">{a.disabledText || a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
