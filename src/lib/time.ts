/** Format a timestamp delta as human-readable Chinese duration */
export function formatDelay(since: number | null): string {
  if (!since) return ''
  const diff = Date.now() - since
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  if (hours < 24) {
    return remainMins > 0 ? `${hours} 小时 ${remainMins} 分` : `${hours} 小时`
  }
  return `${Math.floor(hours / 24)} 天`
}

/** Format timestamp to HH:mm */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Format a date as relative label */
export function formatDateLabel(ts: number): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(ts)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === 2) return '后天'
  if (diffDays === -1) return '昨天'
  if (diffDays === -2) return '前天'
  if (diffDays > 0) return `${diffDays} 天后`
  return `${Math.abs(diffDays)} 天前`
}