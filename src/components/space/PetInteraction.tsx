import { useState, useEffect, useCallback } from 'react'
import type { PetInteractionType } from '@/types'
import { canInteract, getInteractionCooldownRemaining, PET_COOLDOWNS } from '@/lib/pet-state'

interface PetInteractionProps {
  lastPetted: number | null
  lastFed: number | null
  onInteract: (type: PetInteractionType) => void
}

export function PetInteraction({ lastPetted, lastFed, onInteract }: PetInteractionProps) {
  const [, setTick] = useState(0)

  const petReady = canInteract(lastPetted, PET_COOLDOWNS.pet)
  const feedReady = canInteract(lastFed, PET_COOLDOWNS.feed)
  const petCooldown = getInteractionCooldownRemaining(lastPetted, PET_COOLDOWNS.pet)
  const feedCooldown = getInteractionCooldownRemaining(lastFed, PET_COOLDOWNS.feed)

  // Tick every second while cooldowns are active
  useEffect(() => {
    if (petReady && feedReady) return
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [petReady, feedReady])

  const handlePet = useCallback(() => {
    if (petReady) onInteract('pet')
  }, [petReady, onInteract])

  const handleFeed = useCallback(() => {
    if (feedReady) onInteract('feed')
  }, [feedReady, onInteract])

  return (
    <div className="flex items-center gap-3 mt-2">
      <InteractionButton
        emoji="🤚"
        label="摸摸"
        ready={petReady}
        cooldown={petCooldown}
        onClick={handlePet}
      />
      <InteractionButton
        emoji="🍖"
        label="喂食"
        ready={feedReady}
        cooldown={feedCooldown}
        onClick={handleFeed}
      />
    </div>
  )
}

function InteractionButton({
  emoji,
  label,
  ready,
  cooldown,
  onClick,
}: {
  emoji: string
  label: string
  ready: boolean
  cooldown: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!ready}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-200
        ${ready
          ? 'bg-white/80 text-foreground shadow-sm hover:bg-white hover:shadow-md active:scale-95'
          : 'bg-white/40 text-muted-foreground cursor-not-allowed'
        }
      `}
    >
      <span className={ready ? 'animate-pet-bounce' : ''}>{emoji}</span>
      <span>{ready ? label : `${cooldown}s`}</span>
    </button>
  )
}
