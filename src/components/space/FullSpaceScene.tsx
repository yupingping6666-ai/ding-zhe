import { useState } from 'react'
import type { PetState, PetInteractionType, Anniversary } from '@/types'
import type { CompanionCharacter } from '@/lib/companion'
import { getPetMoodExpression, getInteractionResponse } from '@/lib/companion'
import { PetEmoji } from '@/components/PetEmoji'
import { canInteract, PET_COOLDOWNS } from '@/lib/pet-state'
import { getTimeOfDay } from '@/lib/time-of-day'
import { getSpaceNarrative } from '@/lib/narrative'
import { SpaceNest } from './SpaceNest'
import { PetDisplay } from './PetDisplay'
import { PetInteraction } from './PetInteraction'
import { PetStatusPanel } from './PetStatusPanel'
import { NarrativeText } from './NarrativeText'

interface FullSpaceSceneProps {
  character: CompanionCharacter
  petState: PetState
  todayCompleted: number
  todayTotal: number
  todayCareCount: number
  relationDays: number
  todayAnniversaries: Anniversary[]
  onInteract: (type: PetInteractionType) => void
}

export function FullSpaceScene({
  character,
  petState,
  todayCompleted,
  todayTotal,
  todayCareCount,
  relationDays,
  todayAnniversaries,
  onInteract,
}: FullSpaceSceneProps) {
  const timeOfDay = getTimeOfDay()
  const [feedback, setFeedback] = useState<{ emoji: string; text: string } | null>(null)

  const expression = getPetMoodExpression(character, petState.mood)
  const narrative = getSpaceNarrative({
    companionName: character.name,
    petMood: petState.mood,
    todayCompleted,
    todayTotal,
    todayCareCount,
    relationDays,
    todayAnniversaries,
    timeOfDay,
  })

  const handleInteract = (type: PetInteractionType) => {
    const cooldownActive = !canInteract(
      type === 'pet' ? petState.lastPetted : petState.lastFed,
      PET_COOLDOWNS[type],
    )
    const response = getInteractionResponse(character, type, cooldownActive)
    setFeedback(response)
    onInteract(type)
    setTimeout(() => setFeedback(null), 2500)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <SpaceNest
        size="full"
        timeOfDay={timeOfDay}
        hasAnniversary={todayAnniversaries.length > 0}
      >
        <PetDisplay expression={expression} mood={petState.mood} size="lg" />

        {/* Floating heart on interaction */}
        {feedback && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-heart-pop">
            <PetEmoji value={feedback.emoji} size="w-6 h-6" />
          </div>
        )}

        <div className="mt-2">
          <NarrativeText text={feedback?.text ?? narrative} />
        </div>
      </SpaceNest>

      <PetStatusPanel petState={petState} companionName={character.name} />

      <PetInteraction
        lastPetted={petState.lastPetted}
        lastFed={petState.lastFed}
        onInteract={handleInteract}
      />
    </div>
  )
}
