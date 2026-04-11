import type { PetExpression } from '@/types'

interface BearSvgProps {
  expression: PetExpression
  className?: string
}

const EYES: Record<PetExpression, React.ReactNode> = {
  idle: (
    <>
      <circle cx="37" cy="44" r="3" fill="#333" />
      <circle cx="63" cy="44" r="3" fill="#333" />
      <circle cx="37.8" cy="43" r="1" fill="white" />
      <circle cx="63.8" cy="43" r="1" fill="white" />
    </>
  ),
  happy: (
    <>
      <path d="M33 45 Q37 39 41 45" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M59 45 Q63 39 67 45" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  sleeping: (
    <>
      <path d="M33 45 H41" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M59 45 H67" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      <text x="68" y="36" fontSize="8" fill="#999">z</text>
      <text x="74" y="30" fontSize="6" fill="#bbb">z</text>
    </>
  ),
  love: (
    <>
      <path d="M34 42 L37 46 L40 42 Q37 38 34 42Z" fill="#e74c6f" />
      <path d="M60 42 L63 46 L66 42 Q63 38 60 42Z" fill="#e74c6f" />
    </>
  ),
  eating: (
    <>
      <circle cx="37" cy="44" r="2.5" fill="#333" />
      <circle cx="63" cy="44" r="2.5" fill="#333" />
    </>
  ),
  thinking: (
    <>
      <circle cx="37" cy="44" r="3" fill="#333" />
      <circle cx="63" cy="45" r="2.5" fill="#333" />
    </>
  ),
}

const MOUTHS: Record<PetExpression, React.ReactNode> = {
  idle: <path d="M46 55 Q50 58 54 55" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  happy: <path d="M44 55 Q50 61 56 55" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  sleeping: <path d="M47 56 Q50 57 53 56" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  love: <path d="M44 55 Q50 61 56 55" stroke="#e74c6f" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  eating: <ellipse cx="50" cy="57" rx="4" ry="3.5" fill="#333" />,
  thinking: (
    <>
      <path d="M47 56 Q50 57 53 56" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="76" cy="36" r="2" fill="#eee" stroke="#ccc" strokeWidth="0.5" />
      <circle cx="80" cy="30" r="3" fill="#eee" stroke="#ccc" strokeWidth="0.5" />
    </>
  ),
}

export default function BearSvg({ expression, className }: BearSvgProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Round ears */}
      <circle cx="26" cy="24" r="12" fill="#8B6343" />
      <circle cx="26" cy="24" r="7" fill="#C09060" />
      <circle cx="74" cy="24" r="12" fill="#8B6343" />
      <circle cx="74" cy="24" r="7" fill="#C09060" />

      {/* Head */}
      <circle cx="50" cy="48" r="28" fill="#8B6343" />

      {/* Face lighter area */}
      <ellipse cx="50" cy="52" rx="18" ry="16" fill="#C09060" />

      {/* Nose area */}
      <ellipse cx="50" cy="50" rx="8" ry="6" fill="#A07850" />
      <ellipse cx="50" cy="49" rx="3.5" ry="2.5" fill="#333" />

      {/* Eyes */}
      {EYES[expression]}

      {/* Mouth */}
      {MOUTHS[expression]}

      {/* Blush */}
      <circle cx="32" cy="52" r="4" fill="#E8A0A0" opacity="0.4" />
      <circle cx="68" cy="52" r="4" fill="#E8A0A0" opacity="0.4" />

      {/* Body hint */}
      <ellipse cx="50" cy="82" rx="26" ry="14" fill="#8B6343" />
      <ellipse cx="50" cy="82" rx="18" ry="10" fill="#C09060" />
    </svg>
  )
}
