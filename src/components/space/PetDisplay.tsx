import type { PetMood } from '@/types'

interface PetDisplayProps {
  expression: string
  mood: PetMood
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const SIZE_CLASSES = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl',
}

function getMoodAnimation(mood: PetMood): string {
  switch (mood) {
    case 'happy': return 'animate-pet-happy'
    case 'content': return 'animate-float'
    case 'neutral': return ''
    case 'lonely': return 'animate-pulse-soft'
    case 'sleepy': return 'animate-pet-sleepy'
  }
}

export function PetDisplay({ expression, mood, size = 'md', onClick }: PetDisplayProps) {
  const sizeClass = SIZE_CLASSES[size]
  const animClass = getMoodAnimation(mood)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${sizeClass} ${animClass}
        leading-none cursor-pointer select-none
        transition-transform duration-200
        hover:scale-110 active:scale-95
        focus:outline-none
      `}
      aria-label="Pet companion"
    >
      {expression}
    </button>
  )
}
