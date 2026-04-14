import type { Anniversary } from '@/types'
import { formatAnniversaryLabel, daysUntilNext, isTodayAnniversary } from '@/lib/anniversary'

interface AnniversaryBadgeProps {
  anniversary: Anniversary
  isSelected?: boolean
  onClick?: () => void
}

export function AnniversaryBadge({ anniversary, isSelected, onClick }: AnniversaryBadgeProps) {
  const isToday = isTodayAnniversary(anniversary)
  const days = daysUntilNext(anniversary)
  const label = formatAnniversaryLabel(anniversary)

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl
        transition-all duration-300 cursor-pointer active:scale-[0.98]
        ${isToday
          ? 'bg-[hsl(var(--anniversary-surface))] border border-[hsl(var(--anniversary)/0.3)] shadow-sm'
          : isSelected
            ? 'bg-primary/5 border border-primary/20'
            : 'bg-card/60 hover:bg-card/80'
        }
      `}
    >
      <span className={`text-base ${isToday ? 'animate-pet-bounce' : ''}`}>
        {anniversary.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isToday ? 'text-[hsl(var(--anniversary))]' : 'text-foreground'}`}>
          {anniversary.title}
          {anniversary.isPrimary && <span className="ml-1 text-xs text-amber-500">⭐</span>}
        </p>
        <p className="text-2xs text-muted-foreground">
          {label}
        </p>
      </div>
      {isToday && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--anniversary)/0.15)] text-[hsl(var(--anniversary))] font-medium">
          今天!
        </span>
      )}
      {!isToday && days <= 7 && (
        <span className="text-2xs text-muted-foreground whitespace-nowrap">
          {days}天后
        </span>
      )}
    </div>
  )
}
