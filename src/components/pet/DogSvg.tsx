import type { PetExpression } from '@/types'

interface DogSvgProps {
  expression: PetExpression
  className?: string
}

const EYES: Record<PetExpression, React.ReactNode> = {
  idle: (
    <>
      <circle cx="37" cy="42" r="3.5" fill="#333" />
      <circle cx="63" cy="42" r="3.5" fill="#333" />
      <circle cx="38" cy="41" r="1.2" fill="white" />
      <circle cx="64" cy="41" r="1.2" fill="white" />
    </>
  ),
  happy: (
    <>
      <path d="M33 43 Q37 37 41 43" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M59 43 Q63 37 67 43" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  sleeping: (
    <>
      <path d="M33 43 H41" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M59 43 H67" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      <text x="70" y="34" fontSize="8" fill="#999">z</text>
      <text x="76" y="28" fontSize="6" fill="#bbb">z</text>
    </>
  ),
  love: (
    <>
      <path d="M34 40 L37 44 L40 40 Q37 36 34 40Z" fill="#e74c6f" />
      <path d="M60 40 L63 44 L66 40 Q63 36 60 40Z" fill="#e74c6f" />
    </>
  ),
  eating: (
    <>
      <circle cx="37" cy="42" r="3" fill="#333" />
      <circle cx="63" cy="42" r="3" fill="#333" />
      <circle cx="37.5" cy="41" r="1" fill="white" />
      <circle cx="63.5" cy="41" r="1" fill="white" />
    </>
  ),
  thinking: (
    <>
      <circle cx="37" cy="42" r="3.5" fill="#333" />
      <circle cx="63" cy="43" r="3" fill="#333" />
    </>
  ),
}

const MOUTHS: Record<PetExpression, React.ReactNode> = {
  idle: <path d="M45 54 Q50 57 55 54" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  happy: (
    <>
      <path d="M42 53 Q50 62 58 53" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="57" rx="5" ry="3" fill="#FF8080" opacity="0.5" />
    </>
  ),
  sleeping: <path d="M46 55 Q50 57 54 55" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  love: <path d="M42 53 Q50 62 58 53" stroke="#e74c6f" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  eating: <ellipse cx="50" cy="56" rx="5" ry="4" fill="#333" />,
  thinking: (
    <>
      <circle cx="48" cy="55" r="1.5" fill="#333" />
      <circle cx="76" cy="34" r="2" fill="#eee" stroke="#ccc" strokeWidth="0.5" />
      <circle cx="80" cy="28" r="3" fill="#eee" stroke="#ccc" strokeWidth="0.5" />
    </>
  ),
}

export default function DogSvg({ expression, className }: DogSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Floppy ears */}
      <ellipse cx="24" cy="40" rx="10" ry="18" fill="#C08040" transform="rotate(-15 24 40)" />
      <ellipse cx="76" cy="40" rx="10" ry="18" fill="#C08040" transform="rotate(15 76 40)" />

      {/* Head */}
      <ellipse cx="50" cy="46" rx="28" ry="25" fill="#D4944A" />

      {/* Forehead patch */}
      <ellipse cx="50" cy="36" rx="10" ry="8" fill="#E8B878" />

      {/* Muzzle */}
      <ellipse cx="50" cy="52" rx="12" ry="10" fill="#E8C99A" />

      {/* Nose */}
      <ellipse cx="50" cy="49" rx="4" ry="3" fill="#333" />
      <ellipse cx="49" cy="48.5" rx="1.2" ry="0.8" fill="#555" />

      {/* Eyes */}
      {EYES[expression]}

      {/* Mouth */}
      {MOUTHS[expression]}

      {/* Tail */}
      <path
        d="M78 72 Q90 60 85 45"
        stroke="#D4944A"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        className={expression === 'happy' ? 'origin-bottom-left animate-tail-wag' : 'origin-bottom-left animate-tail-sway'}
      />

      {/* Body hint */}
      <ellipse cx="50" cy="80" rx="24" ry="14" fill="#D4944A" />
      <ellipse cx="50" cy="80" rx="18" ry="10" fill="#E8C99A" />
    </svg>
  )
}
