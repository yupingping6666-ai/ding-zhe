import type { PetState, Anniversary } from '@/types'
import type { CompanionCharacter } from '@/lib/companion'
import { getPetMoodExpression } from '@/lib/companion'
import { getTimeOfDay } from '@/lib/time-of-day'
import { getSpaceNarrative } from '@/lib/narrative'
import { SpaceNest } from './SpaceNest'
import { PetDisplay } from './PetDisplay'
import { NarrativeText } from './NarrativeText'

interface MiniSpaceSceneProps {
  character: CompanionCharacter
  petState: PetState
  todayCompleted: number
  todayTotal: number
  todayCareCount: number
  relationDays: number
  todayAnniversaries: Anniversary[]
}

export function MiniSpaceScene({
  character,
  petState,
  todayCompleted,
  todayTotal,
  todayCareCount,
  relationDays,
  todayAnniversaries,
}: MiniSpaceSceneProps) {
  const timeOfDay = getTimeOfDay()
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

  return (
    <SpaceNest
      size="mini"
      timeOfDay={timeOfDay}
      hasAnniversary={todayAnniversaries.length > 0}
    >
      <PetDisplay expression={expression} mood={petState.mood} size="md" />
      <div className="mt-1">
        <NarrativeText text={narrative} />
      </div>
    </SpaceNest>
  )
}
