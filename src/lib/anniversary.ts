import type { Anniversary } from '@/types'

function getTodayMMDD(): string {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isTodayAnniversary(a: Anniversary): boolean {
  return a.date === getTodayMMDD()
}

export function getNextOccurrence(a: Anniversary): Date {
  const [mm, dd] = a.date.split('-').map(Number)
  const now = new Date()
  const thisYear = now.getFullYear()
  const candidate = new Date(thisYear, mm - 1, dd)
  if (candidate <= now) {
    candidate.setFullYear(thisYear + 1)
  }
  return candidate
}

export function daysUntilNext(a: Anniversary): number {
  if (isTodayAnniversary(a)) return 0
  const next = getNextOccurrence(a)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - now.getTime()) / 86_400_000)
}

export function formatAnniversaryLabel(a: Anniversary): string {
  if (isTodayAnniversary(a)) {
    if (a.year) {
      const years = new Date().getFullYear() - a.year
      if (years > 0) return `第 ${years} 年`
    }
    return '就是今天!'
  }
  const days = daysUntilNext(a)
  if (days <= 7) return `还有 ${days} 天`
  if (days <= 30) return `还有 ${days} 天`
  return `${a.date}`
}

export const ANNIVERSARY_EMOJIS = ['💕', '🎂', '🎉', '💍', '🏠', '🌹', '✈️', '📸', '🌸', '🎁']
