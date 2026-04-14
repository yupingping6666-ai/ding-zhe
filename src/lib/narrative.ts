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

// ---- Demo narrative generation (content-aware) ----

// Mood classification
const POSITIVE_MOODS = ['😊', '😄', '🥰', '😍', '🤗', '❤️', '💕', '✨', '🎉', '🥳', '😋', '🌟', '💪', '👍', '🙌', '😎', '🤩', '💖', '🫶', '☀️']
const NEGATIVE_MOODS = ['😢', '😭', '😞', '😔', '😩', '😤', '😠', '💔', '😰', '😥', '🥺', '😫', '😣', '😖', '🙁', '☹️', '😿', '💧', '🌧️']
const CALM_MOODS = ['😌', '🧘', '☕', '🍃', '🌸', '📖', '🎵', '🌙', '💤', '🫧']

type MoodTone = 'positive' | 'negative' | 'calm' | 'mixed'

function classifyMoodTone(moods: string[]): MoodTone {
  let pos = 0, neg = 0, calm = 0
  for (const m of moods) {
    if (POSITIVE_MOODS.includes(m)) pos++
    else if (NEGATIVE_MOODS.includes(m)) neg++
    else if (CALM_MOODS.includes(m)) calm++
  }
  const total = moods.length
  if (pos > total * 0.5) return 'positive'
  if (neg > total * 0.5) return 'negative'
  if (calm > total * 0.4) return 'calm'
  if (pos > 0 && neg > 0) return 'mixed'
  return 'calm'
}

function extractContentSnippet(content: string, maxLen = 15): string {
  const cleaned = content.replace(/[\n\r]+/g, ' ').trim()
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen) + '…'
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pickOne<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

// Title templates — {snippet} will be filled with actual content
const TITLE_TEMPLATES_DUAL: Record<MoodTone, string[]> = {
  positive: [
    '今天有一种叫幸福的东西在流动',
    '你们的快乐，被我记住了',
    '笑容是今天的主旋律',
    '这一天，阳光和你们都在',
    '一起开心的日子值得铭记',
  ],
  negative: [
    '有些情绪，说出来就好了一点',
    '低落的时刻，也是真实的你们',
    '不太容易的一天，但你们在一起',
    '今天有点沉重，但没关系',
    '即使心情不好，至少还有彼此',
  ],
  calm: [
    '安静陪伴的一天',
    '平平淡淡，就是日常',
    '没有波澜的一天，却很踏实',
    '生活本来的样子',
    '柔软而温和的一段时光',
  ],
  mixed: [
    '酸甜交织的一天',
    '情绪有起有落，这就是生活',
    '五味杂陈里有你们的故事',
    '今天的情绪有好多种颜色',
    '复杂的一天，简单的陪伴',
  ],
}

const TITLE_TEMPLATES_SOLO: Record<MoodTone, string[]> = {
  positive: [
    '今天的你，在发光',
    '这份好心情值得被记住',
    '你笑起来的样子，很好',
    '今天有属于你的小确幸',
    '快乐也是一种力量',
  ],
  negative: [
    '今天辛苦了，允许自己难过',
    '有些情绪需要一个出口',
    '不开心的时候，记录也是一种陪伴',
    '低谷也是路的一部分',
    '这一天不太容易，但你撑过来了',
  ],
  calm: [
    '安安静静的一天',
    '属于自己的平和时刻',
    '今天的节奏刚刚好',
    '不急不缓，你在好好生活',
    '一个人的从容',
  ],
  mixed: [
    '今天的情绪画了一条曲线',
    '有笑有泪，这才是真实',
    '复杂的一天也值得记录',
    '你经历了很多种感受',
    '情绪流过你，你在成长',
  ],
}

// Body generation: builds from actual feeling content
function generateBody(feelings: FeelingEntry[], tone: MoodTone, isDual: boolean, photoUrls: string[]): string {
  const parts: string[] = []
  const photoCount = photoUrls.length

  // Part 1: Summarize what was recorded
  const count = feelings.length
  if (count === 1) {
    const f = feelings[0]
    const snippet = extractContentSnippet(f.content, 25)
    parts.push(`你${isDual ? '们' : ''}记录了一条感受：「${snippet}」`)
  } else {
    const snippets = feelings.slice(0, 3).map(f => extractContentSnippet(f.content, 12))
    parts.push(`今天共记录了 ${count} 条感受，包括「${snippets.join('」「')}」${count > 3 ? '等' : ''}。`)
  }

  // Part 2: Photo observation — reference photos taken today
  if (photoCount > 0) {
    const photoFeelings = feelings.filter(f => (f.photoUrls || []).length > 0)
    if (photoCount === 1) {
      const relatedContent = photoFeelings[0]
        ? extractContentSnippet(photoFeelings[0].content, 12)
        : ''
      parts.push(`用一张照片定格了${relatedContent ? `「${relatedContent}」的` : '这个'}瞬间，镜头里藏着今天的温度。`)
    } else if (photoCount <= 3) {
      parts.push(`${photoCount} 张照片记录了今天的片段，每一帧都是你${isDual ? '们' : ''}想留住的画面。`)
    } else {
      parts.push(`今天用 ${photoCount} 张照片捕捉生活，这些画面串起来就是属于你${isDual ? '们' : ''}的小电影。`)
    }
  }

  // Part 3: Mood observation
  const moods = feelings.map(f => f.mood).filter(Boolean)
  const uniqueMoods = [...new Set(moods)]
  if (uniqueMoods.length > 0) {
    if (tone === 'positive') {
      parts.push(`整体情绪偏向积极 ${uniqueMoods.slice(0, 3).join('')}，这样的状态很好。`)
    } else if (tone === 'negative') {
      parts.push(`今天的情绪有些低落 ${uniqueMoods.slice(0, 3).join('')}，这些感受都是真实的，不需要否定它们。`)
    } else if (tone === 'mixed') {
      parts.push(`情绪有起有伏 ${uniqueMoods.slice(0, 4).join('')}，说明你${isDual ? '们' : ''}在认真体验生活的每一面。`)
    } else {
      parts.push(`情绪平稳而温和 ${uniqueMoods.slice(0, 3).join('')}，这是一种很有力量的状态。`)
    }
  }

  // Part 3: Contextual closing based on tone
  const closings: Record<MoodTone, string[]> = {
    positive: [
      isDual ? '你们的快乐是互相给予的，继续保持这份默契吧。' : '保持这份好心情，你值得每一个开心的瞬间。',
      isDual ? '开心的日子因为分享而加倍，真好。' : '今天的快乐，明天回头看依然会嘴角上扬。',
    ],
    negative: [
      isDual ? '有人陪着一起面对，低谷也会过去的。' : '允许自己休息，明天是新的开始。',
      isDual ? '不开心的时候能说出来，本身就是一种信任。' : '写下这些，已经是在照顾自己了。',
    ],
    calm: [
      isDual ? '平淡的日子里，有一种叫安心的力量。' : '不需要每天都波澜壮阔，安静也是一种幸福。',
      isDual ? '没有惊喜的日子，反而最能感受到彼此的存在。' : '这种从容，是你给自己最好的礼物。',
    ],
    mixed: [
      isDual ? '情绪复杂的日子，能一起消化就是最好的治愈。' : '接纳每一种情绪，你在变得更完整。',
      isDual ? '酸甜苦辣都经历过，你们的故事才更有厚度。' : '丰富的一天，也意味着你在认真地活着。',
    ],
  }
  const closingSeed = hashString(feelings.map(f => f.content).join(''))
  parts.push(pickOne(closings[tone], closingSeed))

  return parts.join('\n\n')
}

// Pet summary: content-aware observations
function generatePetSummary(
  feelings: FeelingEntry[],
  tone: MoodTone,
  isDual: boolean,
  companionName: string,
  companionAvatar: string,
  seed: number,
  photoCount: number,
): string {
  const count = feelings.length
  const templates: string[] = []

  // Photo-aware templates get priority when photos exist
  if (photoCount > 0) {
    if (isDual) {
      templates.push(
        `今天拍了 ${photoCount} 张照片，你们在用画面留住幸福呢`,
        `镜头里的你们看起来很好，我都看到了`,
        `${photoCount} 张照片 + ${count} 条感受，今天的故事很完整`,
      )
    } else {
      templates.push(
        `你今天用照片记录了生活，这些画面以后会很珍贵的`,
        `${photoCount} 张照片里藏着今天的你，我觉得很美`,
        `用镜头捕捉生活的你，正在认真对待每一天`,
      )
    }
  }

  if (isDual) {
    switch (tone) {
      case 'positive':
        templates.push(
          `看到你们今天这么开心，我也跟着高兴`,
          `你们记录了 ${count} 条快乐，我全都记住了`,
          `这种互相带给对方好心情的感觉，真的很棒`,
        )
        break
      case 'negative':
        templates.push(
          `今天辛苦了，我陪着你们`,
          `不开心的时候记得还有我在，我一直在看着你们`,
          `低潮会过去的，你们一起面对就不会太难`,
        )
        break
      case 'calm':
        templates.push(
          `平静的一天也值得被记录，你们做得很好`,
          `安安静静地陪伴，这就是最舒服的关系`,
          `今天的 ${count} 条记录，都是你们日常的温度`,
        )
        break
      case 'mixed':
        templates.push(
          `今天你们经历了不少情绪变化，我都感受到了`,
          `有起有落才是真实的生活，你们处理得很好`,
          `丰富的一天，我觉得你们的关系又深了一点`,
        )
        break
    }
  } else {
    switch (tone) {
      case 'positive':
        templates.push(
          `看到你今天心情不错，我也开心`,
          `你的 ${count} 条记录里都是阳光，保持住`,
          `快乐的你让我觉得世界很美好`,
        )
        break
      case 'negative':
        templates.push(
          `今天不太容易吧，我在这里陪你`,
          `说出来就好了一点对吧，我一直在听`,
          `低落的时候记得，明天还有新的可能`,
        )
        break
      case 'calm':
        templates.push(
          `平和的你让我觉得很安心`,
          `今天的 ${count} 条记录很从容，你在好好生活`,
          `不急不躁的样子，是你最有力量的时候`,
        )
        break
      case 'mixed':
        templates.push(
          `今天你的情绪很丰富，我都看到了`,
          `这么多种感受，说明你在认真体验生活`,
          `复杂的一天也过来了，你比想象中更强大`,
        )
        break
    }
  }

  const summary = pickOne(templates, seed)
  return `${companionAvatar} ${companionName}："${summary}"`
}

export function generateDemoNarrativeEntry(
  feelings: FeelingEntry[],
  photoUrls: string[],
  companionName: string,
  companionAvatar: string,
  _relationDays: number,
  userMode: 'single' | 'dual',
  userId: string,
): NarrativeEntry {
  const isDual = userMode === 'dual'

  // Analyze actual mood data
  const moods = feelings.map(f => f.mood).filter(Boolean)
  const tone = classifyMoodTone(moods)

  // Use content + timestamp for seed to ensure variety across generations
  const contentSeed = feelings.map(f => f.content + f.mood).join('') + Date.now().toString(36)
  const h = hashString(contentSeed)

  // Generate personalized title
  const titleTemplates = isDual ? TITLE_TEMPLATES_DUAL[tone] : TITLE_TEMPLATES_SOLO[tone]
  const title = pickOne(titleTemplates, h)

  // Generate content-aware body
  const bodyText = generateBody(feelings, tone, isDual, photoUrls)

  // Generate contextual pet summary
  const petSummary = generatePetSummary(feelings, tone, isDual, companionName, companionAvatar, h + 5, photoUrls.length)

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
