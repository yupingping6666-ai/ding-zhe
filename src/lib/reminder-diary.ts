import type { RepeatRule } from '@/types'
import { WEEKDAY_LABELS } from '@/types'

/**
 * 将 "HH:mm" 格式化为中文时段表示
 * "06:30" → "早上 6:30"
 * "12:00" → "中午 12:00"
 * "14:30" → "下午 2:30"
 * "22:00" → "晚上 10:00"
 */
function formatTimeOfDay(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const mm = String(m).padStart(2, '0')
  if (h < 6) return `凌晨 ${h}:${mm}`
  if (h < 12) return `上午 ${h}:${mm}`
  if (h === 12) return `中午 12:${mm}`
  if (h < 18) return `下午 ${h - 12}:${mm}`
  return `晚上 ${h - 12}:${mm}`
}

/**
 * 格式化重复规则为中文
 */
function formatRepeat(repeatRule: RepeatRule, weeklyDays: number[]): string {
  if (repeatRule === 'once') return '仅一次'
  if (repeatRule === 'daily') return '每天'
  if (repeatRule === 'weekly' && weeklyDays.length > 0) {
    const dayLabels = weeklyDays
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_LABELS[d])
      .join('')
    return `每周${dayLabels}`
  }
  return '每周'
}

/**
 * 格式化提醒日记内容
 */
export function formatReminderDiaryContent(params: {
  mode: 'sent' | 'received' | 'self'
  taskName: string
  remindTime: string
  repeatRule: RepeatRule
  weeklyDays: number[]
  otherUserName?: string
}): string {
  const { mode, taskName, remindTime, repeatRule, weeklyDays, otherUserName } = params
  const time = formatTimeOfDay(remindTime)
  const repeat = formatRepeat(repeatRule, weeklyDays)

  switch (mode) {
    case 'sent':
      return `提醒${otherUserName}「${taskName}」· ${time} · ${repeat}`
    case 'received':
      return `收到${otherUserName}的提醒「${taskName}」· ${time} · ${repeat}`
    case 'self':
      return `设了提醒「${taskName}」· ${time} · ${repeat}`
  }
}
