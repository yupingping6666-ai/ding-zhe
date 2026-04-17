import type { PetMood } from '@/types'
import { isImageExpression } from '@/components/PetEmoji'

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

const IMG_SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
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
  const animClass = getMoodAnimation(mood)
  const isImage = isImageExpression(expression)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${isImage ? '' : SIZE_CLASSES[size]} ${animClass}
        leading-none cursor-pointer select-none
        transition-transform duration-200
        hover:scale-110 active:scale-95
        focus:outline-none
      `}
      aria-label="Pet companion"
    >
      {isImage ? (
        <img src={expression} alt="" className={`${IMG_SIZE_CLASSES[size]} object-contain`} draggable={false} />
      ) : (
        expression
      )}
    </button>
  )
}
