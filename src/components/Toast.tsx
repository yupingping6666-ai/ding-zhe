import { cn } from '@/lib/utils'
import type { Store } from '@/store'
import { CheckCircle, Info, SkipForward } from 'lucide-react'

export function Toast({ toast }: { toast: Store['toast'] }) {
  if (!toast) return null

  const iconMap = {
    success: <CheckCircle className="w-4.5 h-4.5 text-success" />,
    info: <Info className="w-4.5 h-4.5 text-awaiting" />,
    skip: <SkipForward className="w-4.5 h-4.5 text-skip" />,
  }

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border',
          'bg-card text-foreground text-sm font-medium'
        )}
      >
        {iconMap[toast.type]}
        {toast.message}
      </div>
    </div>
  )
}