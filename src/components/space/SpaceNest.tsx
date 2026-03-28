import type { TimeOfDay } from '@/types'
import { getAmbientGradientClass } from '@/lib/time-of-day'

interface SpaceNestProps {
  size: 'mini' | 'full'
  timeOfDay: TimeOfDay
  hasAnniversary?: boolean
  children: React.ReactNode
}

export function SpaceNest({ size, timeOfDay, hasAnniversary, children }: SpaceNestProps) {
  const isMini = size === 'mini'
  const gradientClass = hasAnniversary ? 'gradient-anniversary' : getAmbientGradientClass(timeOfDay)

  return (
    <div
      className={`
        relative overflow-hidden
        ${gradientClass}
        ${isMini ? 'h-40 rounded-b-[2rem]' : 'h-64 rounded-[2rem]'}
        transition-all duration-700
      `}
    >
      {/* Arch dome shape */}
      <div
        className={`
          absolute inset-x-0 bottom-0
          ${isMini ? 'h-24' : 'h-36'}
        `}
        style={{
          background: 'hsl(var(--nest-bg))',
          borderRadius: isMini ? '50% 50% 0 0 / 60% 60% 0 0' : '50% 50% 0 0 / 50% 50% 0 0',
        }}
      />

      {/* Floor */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: isMini ? '2rem' : '3rem',
          background: 'hsl(var(--nest-floor))',
          borderRadius: '0.5rem 0.5rem 0 0',
        }}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {!isMini && (
          <>
            <span className="absolute left-[12%] bottom-[3rem] text-sm opacity-40 animate-float">🌿</span>
            <span className="absolute right-[10%] bottom-[3.5rem] text-xs opacity-30 animate-float" style={{ animationDelay: '1s' }}>🌸</span>
            <span className="absolute left-[8%] top-[20%] text-xs opacity-20 animate-shimmer">✨</span>
            <span className="absolute right-[15%] top-[15%] text-xs opacity-20 animate-shimmer" style={{ animationDelay: '0.8s' }}>✨</span>
          </>
        )}
        {isMini && (
          <>
            <span className="absolute left-[10%] bottom-[1.8rem] text-xs opacity-30 animate-float">🌿</span>
            <span className="absolute right-[12%] top-[15%] text-xs opacity-20 animate-shimmer">✨</span>
          </>
        )}
      </div>

      {/* Nest glow */}
      {!isMini && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full animate-nest-glow opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(var(--nest-accent)) 0%, transparent 70%)' }}
        />
      )}

      {/* Content (pet + narrative) */}
      <div className={`relative z-10 flex flex-col items-center justify-end h-full ${isMini ? 'pb-4' : 'pb-6'}`}>
        {children}
      </div>
    </div>
  )
}
