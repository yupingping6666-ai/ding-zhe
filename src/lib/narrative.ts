import type { PetMood, TimeOfDay, Anniversary } from '@/types'
import { getTimeGreeting } from '@/lib/time-of-day'

export interface NarrativeContext {
  companionName: string
  petMood: PetMood
  todayCompleted: number
  todayTotal: number
  todayCareCount: number
  relationDays: number
  todayAnniversaries: Anniversary[]
  timeOfDay: TimeOfDay
}

export function getSpaceNarrative(ctx: NarrativeContext): string {
  const { companionName, petMood, todayCompleted, todayTotal, todayCareCount, relationDays, todayAnniversaries, timeOfDay } = ctx

  // Priority 1: Anniversary
  if (todayAnniversaries.length > 0) {
    const a = todayAnniversaries[0]
    if (a.year) {
      const years = new Date().getFullYear() - a.year
      if (years > 0) return `今天是${a.title}${years}周年！${companionName}也在庆祝 ${a.emoji}`
    }
    return `今天是${a.title}！${companionName}为你们感到开心 ${a.emoji}`
  }

  // Priority 2: Special day milestones
  if (relationDays === 100 || relationDays === 365 || relationDays === 200 || relationDays === 500 || relationDays % 365 === 0) {
    return `今天是你们在一起的第 ${relationDays} 天！${companionName}在庆祝呢`
  }

  // Priority 3: Completion feedback
  if (todayCompleted > 0 && todayCompleted >= todayTotal && todayTotal > 0) {
    return `${companionName}很开心，今天的事都处理完啦~`
  }
  if (todayCompleted > 0) {
    return `今天${companionName}很${petMood === 'happy' ? '开心' : '满足'}，你们已经接住了 ${todayCompleted} 件小事~`
  }
  if (todayCareCount > 0) {
    return `你们今天传递了 ${todayCareCount} 次关心，${companionName}觉得很温暖`
  }

  // Priority 4: Mood based
  if (petMood === 'sleepy') {
    return `${companionName}打了个哈欠，今天还没有事情要处理呢`
  }
  if (petMood === 'lonely') {
    return `${companionName}有点想你们了，来互动一下吧~`
  }

  // Priority 5: Time greeting
  return `${getTimeGreeting(timeOfDay)}~ ${companionName}已经准备好陪你们啦`
}

export function humanizeStats(stats: {
  total: number
  completed: number
  careCount: number
}): { totalText: string; completedText: string; careText: string } {
  return {
    totalText: stats.total > 0
      ? `你们已经一起接住了 ${stats.total} 件小事`
      : '还没有小事发生，期待你们的第一次~',
    completedText: stats.completed > 0
      ? `今天一起完成了 ${stats.completed} 件温柔回应`
      : '今天还没有完成的事~',
    careText: stats.careCount > 0
      ? `你们之间已经传递了 ${stats.careCount} 次关心`
      : '还没有关心记录，给TA发一个吧~',
  }
}

export function getRelationDurationText(days: number): string {
  if (days < 1) return '今天刚开始'
  if (days < 30) return `在一起第 ${days} 天`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `在一起第 ${months} 个月`
  }
  const years = Math.floor(days / 365)
  const remainDays = days % 365
  if (remainDays === 0) return `在一起第 ${years} 年`
  return `在一起 ${years} 年 ${remainDays} 天`
}

export function getWeeklyAchievement(weeklyCompleted: number): string | null {
  if (weeklyCompleted >= 20) return `这周已经一起完成了 ${weeklyCompleted} 件事，太厉害了！`
  if (weeklyCompleted >= 10) return `这周一起完成了 ${weeklyCompleted} 件事，继续加油~`
  if (weeklyCompleted >= 5) return `这周已经一起完成了 ${weeklyCompleted} 件事`
  return null
}
