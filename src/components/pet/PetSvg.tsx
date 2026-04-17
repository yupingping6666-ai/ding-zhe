import type { CompanionAnimal } from '@/lib/companion'
import type { PetExpression } from '@/types'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { PetEmoji, isImageExpression } from '@/components/PetEmoji'
import CatPng from './CatPng'
import DogSvg from './DogSvg'
import BearSvg from './BearSvg'

interface PetSvgProps {
  animal: CompanionAnimal
  expression: PetExpression
  className?: string
  blink?: boolean
}

const SVG_ANIMALS: Record<string, React.ComponentType<{ expression: PetExpression; className?: string; blink?: boolean }>> = {
  cat: CatPng,
  dog: DogSvg,
  bear: BearSvg,
}

/** Maps PetExpression → CompanionMood key for emoji fallback */
function expressionToMoodKey(expr: PetExpression): string {
  const map: Record<PetExpression, string> = {
    idle: 'idle',
    happy: 'happy',
    sleeping: 'sleeping',
    love: 'love',
    eating: 'happy',
    thinking: 'thinking',
    curious: 'idle',
    angry: 'idle',
    playing: 'happy',
    sitting: 'idle',
    lying: 'sleeping',
    standing: 'idle',
    error: 'idle',
    achievement: 'happy',
    notification: 'idle',
    empty: 'idle',
  }
  return map[expr]
}

export default function PetSvg({ animal, expression, className, blink }: PetSvgProps) {
  const SvgComponent = SVG_ANIMALS[animal]

  if (SvgComponent) {
    return <SvgComponent expression={expression} className={className} blink={blink} />
  }

  // Emoji fallback for other animals
  const character = COMPANION_CHARACTERS[animal]
  const moodKey = expressionToMoodKey(expression) as keyof typeof character.expressions
  const emoji = character.expressions[moodKey] || character.avatar

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      {isImageExpression(emoji) ? (
        <PetEmoji value={emoji} size="w-16 h-16" className="animate-pet-breathe" />
      ) : (
        <span className="animate-pet-breathe" style={{ fontSize: '4rem' }}>{emoji}</span>
      )}
    </div>
  )
}
