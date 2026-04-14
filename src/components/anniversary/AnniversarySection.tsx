import { useState } from 'react'
import type { Anniversary } from '@/types'
import { daysUntilNext, isTodayAnniversary, getNextOccurrence, ANNIVERSARY_EMOJIS } from '@/lib/anniversary'
import { AnniversaryBadge } from './AnniversaryBadge'
import { AnniversaryForm } from './AnniversaryForm'

interface AnniversarySectionProps {
  anniversaries: Anniversary[]
  onAdd: (data: Omit<Anniversary, 'id'>) => void
  onRemove: (id: string) => void
  onUpdate?: (id: string, patch: Partial<Omit<Anniversary, 'id'>>) => void
}

function formatFullDate(a: Anniversary): string {
  const [mm, dd] = a.date.split('-')
  if (a.year) return `${a.year}年${Number(mm)}月${Number(dd)}日`
  return `${Number(mm)}月${Number(dd)}日`
}

function getYearsText(a: Anniversary): string | null {
  if (!a.year) return null
  const years = new Date().getFullYear() - a.year
  if (years <= 0) return '今年开始'
  return `已经 ${years} 年了`
}

export function AnniversarySection({ anniversaries, onAdd, onRemove, onUpdate }: AnniversarySectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editMonth, setEditMonth] = useState('')
  const [editDay, setEditDay] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editRecurring, setEditRecurring] = useState(true)
  const [editIsPrimary, setEditIsPrimary] = useState(false)

  function startEdit(a: Anniversary) {
    const [mm, dd] = a.date.split('-')
    setEditTitle(a.title)
    setEditMonth(String(Number(mm)))
    setEditDay(String(Number(dd)))
    setEditYear(a.year ? String(a.year) : '')
    setEditEmoji(a.emoji)
    setEditRecurring(a.isRecurring)
    setEditIsPrimary(a.isPrimary)
    setEditingId(a.id)
  }

  function saveEdit(id: string) {
    if (!editTitle.trim() || !editMonth || !editDay) return
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentDay = new Date().getDate()
    const y = editYear ? Number(editYear) : null
    const validYear = y && y >= 1900 && y <= currentYear ? y : null
    let m = Number(editMonth)
    let d = Number(editDay)
    // Clamp month/day if year is current year
    if (validYear === currentYear) {
      if (m > currentMonth) m = currentMonth
      if (m === currentMonth && d > currentDay) d = currentDay
    }
    const mm = String(m).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    onUpdate?.(id, {
      title: editTitle.trim(),
      date: `${mm}-${dd}`,
      year: validYear,
      emoji: editEmoji,
      isRecurring: editRecurring,
      isPrimary: editIsPrimary,
    })
    setEditingId(null)
  }

  const editValid = editTitle.trim().length > 0 && editMonth && editDay

  // Reverse: newest added first
  const sorted = [...anniversaries].reverse()

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
          existingHasPrimary={anniversaries.some((a) => a.isPrimary)}
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
          {sorted.map((a) => {
            const isSelected = selectedId === a.id
            const days = daysUntilNext(a)
            const isToday = isTodayAnniversary(a)
            const yearsText = getYearsText(a)
            const nextDate = getNextOccurrence(a)
            const nextDateStr = `${nextDate.getFullYear()}年${nextDate.getMonth() + 1}月${nextDate.getDate()}日`

            return (
              <div key={a.id} className="group relative">
                <AnniversaryBadge
                  anniversary={a}
                  isSelected={isSelected}
                  onClick={() => { setSelectedId(isSelected ? null : a.id); setEditingId(null) }}
                />

                {/* 展开的详情/编辑面板 */}
                {isSelected && (
                  <div className="mt-1 mx-1 bg-card rounded-xl border border-border/40 p-4 space-y-3 animate-fade-in">
                    {editingId === a.id ? (
                      /* ---- 编辑模式 ---- */
                      <>
                        {/* 名称 */}
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="纪念日名称"
                          maxLength={20}
                          className="w-full px-3 py-2 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        {/* 日期 */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editMonth}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                              const n = parseInt(v, 10)
                              const isEditCurrentYear = editYear === String(new Date().getFullYear())
                              const maxMonth = isEditCurrentYear ? (new Date().getMonth() + 1) : 12
                              setEditMonth(v && n > maxMonth ? String(maxMonth) : v)
                            }}
                            placeholder="月"
                            className="w-12 px-1.5 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <span className="text-muted-foreground text-xs shrink-0">月</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editDay}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                              const n = parseInt(v, 10)
                              const now = new Date()
                              const isEditCurrentYear = editYear === String(now.getFullYear())
                              const isEditCurrentMonth = isEditCurrentYear && Number(editMonth) === (now.getMonth() + 1)
                              const maxDay = isEditCurrentMonth ? now.getDate() : 31
                              setEditDay(v && n > maxDay ? String(maxDay) : v)
                            }}
                            placeholder="日"
                            className="w-12 px-1.5 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <span className="text-muted-foreground text-xs shrink-0">日</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editYear}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                              const n = parseInt(v, 10)
                              const max = new Date().getFullYear()
                              setEditYear(v.length === 4 && n > max ? String(max) : v)
                            }}
                            placeholder="年(可选)"
                            className="flex-1 min-w-0 px-1.5 py-2 rounded-xl bg-muted/50 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>

                        {/* Emoji 选择 */}
                        <div>
                          <p className="text-2xs text-muted-foreground mb-1.5">选择图标</p>
                          <div className="flex flex-wrap gap-2">
                            {ANNIVERSARY_EMOJIS.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => setEditEmoji(e)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all duration-200 ${
                                  editEmoji === e
                                    ? 'bg-primary/15 ring-2 ring-primary/40 scale-110'
                                    : 'bg-muted/30 hover:bg-muted/60'
                                }`}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 重复 */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editRecurring}
                            onChange={(e) => setEditRecurring(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-muted-foreground">每年重复提醒</span>
                        </label>

                        {/* 主纪念日 */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsPrimary}
                            onChange={(e) => setEditIsPrimary(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-muted-foreground">
                            设为主纪念日
                            <span className="text-2xs ml-1 opacity-60">用于计算在一起天数</span>
                          </span>
                        </label>

                        {/* 编辑操作按钮 */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                            className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted/60 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); saveEdit(a.id) }}
                            disabled={!editValid}
                            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                              editValid
                                ? 'bg-primary text-white hover:opacity-90 active:scale-95'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            保存
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ---- 查看模式 ---- */
                      <>
                        {/* 标题行 */}
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{a.emoji}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-foreground">{a.title}</p>
                              {a.isPrimary && (
                                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">主纪念日</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatFullDate(a)}</p>
                          </div>
                        </div>

                        {/* 信息条 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-secondary/50 rounded-xl px-3 py-2 text-center">
                            <p className="text-lg font-bold text-foreground">
                              {isToday ? '🎉' : days}
                            </p>
                            <p className="text-2xs text-muted-foreground">
                              {isToday ? '就是今天!' : '天后到来'}
                            </p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl px-3 py-2 text-center">
                            <p className="text-lg font-bold text-foreground">
                              {yearsText ? (new Date().getFullYear() - a.year!) : '-'}
                            </p>
                            <p className="text-2xs text-muted-foreground">
                              {yearsText || '未设置年份'}
                            </p>
                          </div>
                        </div>

                        {/* 下次日期 & 重复信息 */}
                        <div className="space-y-1.5">
                          {!isToday && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>📅</span>
                              <span>下次: {nextDateStr}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{a.isRecurring ? '🔁' : '1️⃣'}</span>
                            <span>{a.isRecurring ? '每年重复提醒' : '仅一次'}</span>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedId(null) }}
                            className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted/60 transition-colors"
                          >
                            收起
                          </button>
                          {onUpdate && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); startEdit(a) }}
                              className="flex-1 py-2 rounded-xl text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                            >
                              编辑
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemove(a.id); setSelectedId(null) }}
                            className="flex-1 py-2 rounded-xl text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 悬停删除按钮（未展开时） */}
                {!isSelected && (
                  <button
                    type="button"
                    onClick={() => onRemove(a.id)}
                    className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-destructive/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`删除 ${a.title}`}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
