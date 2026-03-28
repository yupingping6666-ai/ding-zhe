import { useState } from 'react'
import type { Anniversary } from '@/types'
import { ANNIVERSARY_EMOJIS } from '@/lib/anniversary'

interface AnniversaryFormProps {
  onSubmit: (data: Omit<Anniversary, 'id'>) => void
  onCancel: () => void
}

export function AnniversaryForm({ onSubmit, onCancel }: AnniversaryFormProps) {
  const [title, setTitle] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const [emoji, setEmoji] = useState(ANNIVERSARY_EMOJIS[0])
  const [isRecurring, setIsRecurring] = useState(true)

  const handleSubmit = () => {
    if (!title.trim() || !month || !day) return
    const mm = String(Number(month)).padStart(2, '0')
    const dd = String(Number(day)).padStart(2, '0')
    onSubmit({
      title: title.trim(),
      date: `${mm}-${dd}`,
      year: year ? Number(year) : null,
      emoji,
      isRecurring,
    })
  }

  const isValid = title.trim().length > 0 && month && day

  return (
    <div className="animate-slide-up bg-card rounded-2xl p-4 shadow-overlay space-y-4">
      <h3 className="text-sm font-semibold text-foreground text-center">添加纪念日</h3>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="纪念日名称，如「在一起」"
        maxLength={20}
        className="w-full px-3 py-2 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Date */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="月"
          min={1}
          max={12}
          className="w-16 px-2 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-muted-foreground text-sm">月</span>
        <input
          type="number"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="日"
          min={1}
          max={31}
          className="w-16 px-2 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-muted-foreground text-sm">日</span>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="年(可选)"
          min={1990}
          max={2099}
          className="flex-1 px-2 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Emoji picker */}
      <div>
        <p className="text-2xs text-muted-foreground mb-1.5">选择图标</p>
        <div className="flex flex-wrap gap-2">
          {ANNIVERSARY_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-base
                transition-all duration-200
                ${emoji === e
                  ? 'bg-primary/15 ring-2 ring-primary/40 scale-110'
                  : 'bg-muted/30 hover:bg-muted/60'
                }
              `}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="rounded"
        />
        <span className="text-xs text-muted-foreground">每年重复提醒</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted/60 transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`
            flex-1 py-2 rounded-xl text-xs font-medium transition-all
            ${isValid
              ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          保存
        </button>
      </div>
    </div>
  )
}
