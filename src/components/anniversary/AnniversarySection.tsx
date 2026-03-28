import { useState } from 'react'
import type { Anniversary } from '@/types'
import { daysUntilNext } from '@/lib/anniversary'
import { AnniversaryBadge } from './AnniversaryBadge'
import { AnniversaryForm } from './AnniversaryForm'

interface AnniversarySectionProps {
  anniversaries: Anniversary[]
  onAdd: (data: Omit<Anniversary, 'id'>) => void
  onRemove: (id: string) => void
}

export function AnniversarySection({ anniversaries, onAdd, onRemove }: AnniversarySectionProps) {
  const [showForm, setShowForm] = useState(false)

  // Sort: today first, then by days until next
  const sorted = [...anniversaries].sort((a, b) => daysUntilNext(a) - daysUntilNext(b))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">我们的纪念日</h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs text-primary font-medium hover:underline"
          >
            + 添加
          </button>
        )}
      </div>

      {showForm && (
        <AnniversaryForm
          onSubmit={(data) => {
            onAdd(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {sorted.length === 0 && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-6 rounded-2xl border-2 border-dashed border-muted text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">💕</span>
            <span className="text-xs">记录你们的重要日子</span>
          </div>
        </button>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((a) => (
            <div key={a.id} className="group relative">
              <AnniversaryBadge anniversary={a} />
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-destructive/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`删除 ${a.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
