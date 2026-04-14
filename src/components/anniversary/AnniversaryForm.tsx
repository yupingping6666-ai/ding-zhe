import { useState, useMemo, useEffect } from 'react'
import type { Anniversary } from '@/types'
import { ANNIVERSARY_EMOJIS, ANNIVERSARY_PRESETS } from '@/lib/anniversary'
import { WheelPicker } from '@/components/ui/WheelPicker'

interface AnniversaryFormProps {
  onSubmit: (data: Omit<Anniversary, 'id'>) => void
  onCancel: () => void
  existingHasPrimary?: boolean
}

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_DAY = new Date().getDate()

// Generate year options: "不选" + 1970..currentYear (descending)
const YEAR_OPTIONS = ['不选', ...Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => String(CURRENT_YEAR - i))]

function getDaysInMonth(month: number, year?: number): number {
  if (!month) return 31
  const y = year || 2024 // Use leap year as default for Feb
  return new Date(y, month, 0).getDate()
}

export function AnniversaryForm({ onSubmit, onCancel, existingHasPrimary }: AnniversaryFormProps) {
  const [title, setTitle] = useState('')
  const [month, setMonth] = useState('1')
  const [day, setDay] = useState('1')
  const [year, setYear] = useState('不选')
  const [emoji, setEmoji] = useState(ANNIVERSARY_EMOJIS[0])
  const [isRecurring, setIsRecurring] = useState(true)
  const [isPrimary, setIsPrimary] = useState(false)

  const isCurrentYear = year === String(CURRENT_YEAR)

  // Month options: limit to 1..currentMonth when year is current year
  const monthOptions = useMemo(() => {
    const max = isCurrentYear ? CURRENT_MONTH : 12
    return Array.from({ length: max }, (_, i) => String(i + 1))
  }, [isCurrentYear])

  // Clamp month when year changes to current year
  const effectiveMonth = useMemo(() => {
    if (isCurrentYear && Number(month) > CURRENT_MONTH) return String(CURRENT_MONTH)
    return month
  }, [month, isCurrentYear])

  const isCurrentYearMonth = isCurrentYear && Number(effectiveMonth) === CURRENT_MONTH

  // Dynamic day options based on selected month/year, limited by today when applicable
  const dayOptions = useMemo(() => {
    const m = Number(effectiveMonth) || 1
    const y = year !== '不选' ? Number(year) : undefined
    let maxDay = getDaysInMonth(m, y)
    // If current year + current month, limit to today
    if (isCurrentYearMonth) maxDay = Math.min(maxDay, CURRENT_DAY)
    return Array.from({ length: maxDay }, (_, i) => String(i + 1))
  }, [effectiveMonth, year, isCurrentYearMonth])

  // Clamp day when month/year changes
  const effectiveDay = useMemo(() => {
    const maxDay = dayOptions.length
    const d = Number(day)
    if (d > maxDay) return String(maxDay)
    return day
  }, [day, dayOptions])

  // Sync back clamped month when year changes
  useEffect(() => {
    if (isCurrentYear && Number(month) > CURRENT_MONTH) {
      setMonth(String(CURRENT_MONTH))
    }
  }, [year, isCurrentYear, month])

  // Which preset is currently active (by title match)
  const activePreset = ANNIVERSARY_PRESETS.find((p) => p.title === title.trim())

  function selectPreset(preset: typeof ANNIVERSARY_PRESETS[number]) {
    setTitle(preset.title)
    setEmoji(preset.emoji)
    if (preset.suggestPrimary && !existingHasPrimary) {
      setIsPrimary(true)
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    const mm = String(Number(effectiveMonth)).padStart(2, '0')
    const dd = String(Number(effectiveDay)).padStart(2, '0')
    const validYear = year !== '不选' ? Number(year) : null
    onSubmit({
      title: title.trim(),
      date: `${mm}-${dd}`,
      year: validYear,
      emoji,
      isRecurring,
      isPrimary,
    })
  }

  const isValid = title.trim().length > 0

  return (
    <div className="animate-slide-up bg-card rounded-2xl p-4 shadow-overlay space-y-4">
      <h3 className="text-sm font-semibold text-foreground text-center">添加纪念日</h3>

      {/* Preset tags */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {ANNIVERSARY_PRESETS.map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => selectPreset(preset)}
            className={`
              shrink-0 px-2.5 py-1 rounded-full text-xs font-medium
              transition-all duration-200 whitespace-nowrap
              ${activePreset?.title === preset.title
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
              }
            `}
          >
            {preset.emoji} {preset.title}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="纪念日名称，如「在一起」"
        maxLength={20}
        className="w-full px-3 py-2 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Date Wheel Picker */}
      <div>
        <p className="text-2xs text-muted-foreground mb-2">选择日期</p>
        <div className="flex items-stretch gap-1 bg-muted/30 rounded-xl p-2">
          {/* Year */}
          <div className="flex-1 flex flex-col items-stretch">
            <span className="text-2xs text-muted-foreground mb-1 text-center">年</span>
            <WheelPicker
              items={YEAR_OPTIONS}
              value={year}
              onChange={setYear}
            />
          </div>
          {/* Month */}
          <div className="w-16 flex flex-col items-stretch">
            <span className="text-2xs text-muted-foreground mb-1 text-center">月</span>
            <WheelPicker
              items={monthOptions}
              value={effectiveMonth}
              onChange={setMonth}
            />
          </div>
          {/* Day */}
          <div className="w-16 flex flex-col items-stretch">
            <span className="text-2xs text-muted-foreground mb-1 text-center">日</span>
            <WheelPicker
              items={dayOptions}
              value={effectiveDay}
              onChange={setDay}
            />
          </div>
        </div>
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

      {/* Primary toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="rounded"
        />
        <span className="text-xs text-muted-foreground">
          设为主纪念日
          <span className="text-2xs ml-1 opacity-60">用于计算在一起天数</span>
        </span>
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
