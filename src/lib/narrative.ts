import type { PetMood, TimeOfDay, Anniversary, FeelingEntry, NarrativeEntry } from '@/types'
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

// ---- Single mode narrative ----

export interface SingleNarrativeContext {
  companionName: string
  petMood: PetMood
  todayRecordCount: number
  totalRecordDays: number
  timeOfDay: TimeOfDay
}

export function getSingleModeNarrative(ctx: SingleNarrativeContext): string {
  const { companionName, petMood, todayRecordCount, totalRecordDays, timeOfDay } = ctx

  // Priority 1: Today has records
  if (todayRecordCount > 0) {
    return `今天记录了 ${todayRecordCount} 条感受，${companionName}觉得你越来越了解自己了`
  }

  // Priority 2: Multi-day streak
  if (totalRecordDays >= 7) {
    return `你已经坚持记录 ${totalRecordDays} 天了，${companionName}为你骄傲`
  }
  if (totalRecordDays >= 3) {
    return `你已经记录了 ${totalRecordDays} 天，${companionName}陪着你`
  }

  // Priority 3: Pet mood
  if (petMood === 'sleepy') {
    return `${companionName}打了个哈欠，今天还没有记录呢`
  }
  if (petMood === 'lonely') {
    return `${companionName}有点想你了，来记录一下今天的感受吧~`
  }

  // Priority 4: Time greeting
  return `${getTimeGreeting(timeOfDay)}~ ${companionName}陪着你`
}

// ---- Demo narrative generation (template-based) ----

const NARRATIVE_TITLES_RELATIONSHIP = [
  '一个普通但温暖的晚上',
  '你们的小确幸日记',
  '今天，TA在你身边',
  '平淡日子里的闪光',
  '属于你们的小时光',
  '一起走过的又一天',
  '简单的陪伴最珍贵',
  '被温柔包围的一天',
  '日常里的甜蜜碎片',
  '两个人的小宇宙',
]

const NARRATIVE_TITLES_SOLO = [
  '今天的你，辛苦了',
  '一个人的小确幸',
  '属于自己的安静时刻',
  '平凡日子里的光',
  '和自己相处的一天',
  '记录此刻的自己',
  '生活正在慢慢变好',
  '给自己一个微笑',
  '今日份的小美好',
  '你值得被温柔对待',
]

const NARRATIVE_BODIES_RELATIONSHIP = [
  '你们没有做特别的事情，但一起吃饭、聊天，已经是一种很稳定的陪伴。',
  '有些日子不需要惊喜，只要知道对方在身边就够了。',
  '今天的互动虽然简单，却让这段关系多了一份踏实的感觉。',
  '不知不觉中，你们已经建立了一种只属于彼此的默契。',
  '生活里的大部分时间都是平淡的，但和对的人在一起，平淡也有味道。',
  '回头看看今天的点滴，才发现最珍贵的不是做了什么，而是和谁在一起。',
  '你们正在用日常编织一段温暖的故事，每一天都是新的篇章。',
  '有人说爱情是激情，但我觉得是你们这样——安静地陪着，就很好。',
  '今天的关心和回应，都在说一件事：你们很在意彼此。',
  '这段关系最美的地方，是你们都在努力让对方感到被重视。',
]

const NARRATIVE_BODIES_SOLO = [
  '今天你花时间和自己对话了，这本身就很了不起。',
  '不需要每天都精彩，能好好感受当下已经很棒了。',
  '你正在学会关注自己的内心，这是最重要的成长。',
  '记录生活不是为了给谁看，而是为了以后的自己能回忆这些温柔。',
  '一个人的日子也可以很丰盛，你正在证明这一点。',
  '今天的你比昨天更了解自己一点了，这就是进步。',
  '生活的节奏是你自己的，不需要和任何人比较。',
  '你做的每一个选择，都在塑造更好的明天。',
  '在忙碌中停下来感受，说明你在认真地生活。',
  '给自己一个拥抱吧，你今天也很努力。',
]

const PET_SUMMARIES_RELATIONSHIP = [
  '你们最近更像是日常陪伴型关系',
  '感觉你们的默契值又提高了一点',
  '你们的关系在往更稳定的方向走',
  '这种互相在意的感觉，很好',
  '你们已经找到了属于自己的节奏',
  '继续这样陪伴彼此吧，我在看着',
  '今天的你们让我觉得很温暖',
  '这就是爱情最好的样子',
  '你们的关系正在慢慢生长',
  '我觉得你们之间有一种很舒服的信任',
]

const PET_SUMMARIES_SOLO = [
  '你正在成为更了解自己的人',
  '你的自我关怀意识越来越强了',
  '一个人也可以活得很精彩',
  '你对生活的观察力让我佩服',
  '继续记录吧，未来的你会感谢现在',
  '你的情绪管理能力在提升',
  '我觉得你最近变得更从容了',
  '独立的你，同样很有魅力',
  '你正在学会和自己好好相处',
  '保持这份敏感和温柔吧',
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function generateDemoNarrativeEntry(
  feelings: FeelingEntry[],
  photoUrls: string[],
  companionName: string,
  companionAvatar: string,
  relationDays: number,
  userMode: 'single' | 'dual',
  userId: string,
): NarrativeEntry {
  const isDual = userMode === 'dual'
  const seed = feelings.map(f => f.id).join('') + userId
  const h = hashString(seed)

  const titles = isDual ? NARRATIVE_TITLES_RELATIONSHIP : NARRATIVE_TITLES_SOLO
  const bodies = isDual ? NARRATIVE_BODIES_RELATIONSHIP : NARRATIVE_BODIES_SOLO
  const summaries = isDual ? PET_SUMMARIES_RELATIONSHIP : PET_SUMMARIES_SOLO

  const title = titles[h % titles.length]
  const bodyText = bodies[(h + 3) % bodies.length]
  const petSummary = `${companionAvatar} ${companionName}："${summaries[(h + 7) % summaries.length]}"`

  return {
    id: `narrative-${Date.now()}-${h % 1000}`,
    userId,
    title,
    bodyText,
    petSummary,
    photoUrls: photoUrls.slice(0, 3),
    feelingIds: feelings.map(f => f.id),
    createdAt: Date.now(),
  }
}
