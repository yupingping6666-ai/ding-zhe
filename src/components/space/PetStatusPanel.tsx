import type { PetState } from '@/types'
import { PET_MOOD_CONFIG } from '@/types'
import { getEnergyLabel } from '@/lib/pet-state'

interface PetStatusPanelProps {
  petState: PetState
  companionName: string
}

export function PetStatusPanel({ petState, companionName }: PetStatusPanelProps) {
  const moodConfig = PET_MOOD_CONFIG[petState.mood]
  const energyInfo = getEnergyLabel(petState.energy)

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-sm">
      {/* Mood */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{moodConfig.emoji}</span>
        <div className="text-xs">
          <span className="text-muted-foreground">{companionName}</span>
          <span className="ml-1 font-medium text-foreground">{moodConfig.label}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-border/50" />

      {/* Energy */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{energyInfo.emoji}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${petState.energy}%`,
                background: petState.energy > 60
                  ? 'hsl(var(--care))'
                  : petState.energy > 30
                    ? 'hsl(var(--todo))'
                    : 'hsl(var(--destructive))',
              }}
            />
          </div>
          <span className="text-2xs text-muted-foreground">{energyInfo.text}</span>
        </div>
      </div>
    </div>
  )
}
