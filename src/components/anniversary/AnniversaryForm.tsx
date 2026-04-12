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
    const y = year ? Number(year) : null
    const currentYear = new Date().getFullYear()
    const validYear = y && y >= 1900 && y <= currentYear ? y : null
    onSubmit({
      title: title.trim(),
      date: `${mm}-${dd}`,
      year: validYear,
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
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          value={month}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
            const n = parseInt(v, 10)
            setMonth(v && n > 12 ? '12' : v)
          }}
          placeholder="月"
          className="w-12 px-1.5 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-muted-foreground text-xs shrink-0">月</span>
        <input
          type="text"
          inputMode="numeric"
          value={day}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
            const n = parseInt(v, 10)
            setDay(v && n > 31 ? '31' : v)
          }}
          placeholder="日"
          className="w-12 px-1.5 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-muted-foreground text-xs shrink-0">日</span>
        <input
          type="text"
          inputMode="numeric"
          value={year}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            const n = parseInt(v, 10)
            const max = new Date().getFullYear()
            setYear(v.length === 4 && n > max ? String(max) : v)
          }}
          placeholder="年(可选)"
          className="flex-1 min-w-0 px-1.5 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
