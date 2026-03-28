import type { Category, RepeatRule, ParsedTask, CreateTaskInput } from '@/types'
import {
  CATEGORY_KEYWORDS,
  WEEKDAY_MAP,
  TIME_PERIOD_RANGES,
  NOISE_PARTICLES,
  FUZZY_TIME_MAP,
  COMBINED_DATETIME,
  cnNumToDigit,
} from '@/lib/nlp-dictionaries'

// ========== Normalize ==========

function normalize(input: string): string {
  let s = input.trim()
  // Full-width digits → half-width
  s = s.replace(/[\uff10-\uff19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfef0))
  // Full-width colon → half-width
  s = s.replace(/\uff1a/g, ':')
  // Synonyms
  s = s.replace(/礼拜/g, '周')
  s = s.replace(/星期/g, '周')
  return s
}

/** Convert Chinese number words embedded in time expressions to digits */
function cnTimeToDigit(input: string): string {
  let s = input
  // Convert patterns like "八点", "三点半", "十二点", "两点"
  // Chinese hours: 一~十二 → 1~12
  const cnHourRe = /([零一二两三四五六七八九十]+)([点时])/g
  s = s.replace(cnHourRe, (_match, numStr: string, suffix: string) => {
    const num = cnNumToDigit(numStr)
    return num !== null ? `${num}${suffix}` : `${numStr}${suffix}`
  })
  // Chinese minutes: 一~五十九 → 1~59
  const cnMinRe = /([点时])([零一二两三四五六七八九十]+)(分)/g
  s = s.replace(cnMinRe, (_match, prefix: string, numStr: string, suffix: string) => {
    const num = cnNumToDigit(numStr)
    return num !== null ? `${prefix}${num}${suffix}` : `${prefix}${numStr}${suffix}`
  })
  // Relative: "三小时后", "二十分钟后"
  const cnRelHourRe = /([零一二两三四五六七八九十]+)(小时后|个小时后)/g
  s = s.replace(cnRelHourRe, (_match, numStr: string, suffix: string) => {
    const num = cnNumToDigit(numStr)
    return num !== null ? `${num}${suffix}` : `${numStr}${suffix}`
  })
  const cnRelMinRe = /([零一二两三四五六七八九十]+)(分钟后)/g
  s = s.replace(cnRelMinRe, (_match, numStr: string, suffix: string) => {
    const num = cnNumToDigit(numStr)
    return num !== null ? `${num}${suffix}` : `${numStr}${suffix}`
  })
  return s
}

// ========== Extract Combined Date+Time ==========

interface CombinedResult {
  dateContext: ParsedTask['dateContext']
  fallbackTime: string | null // Only used if no explicit time found later
  periodHint: string | null   // e.g., '晚上', '早上' — used to disambiguate bare hours
  remaining: string
  foundDate: boolean
}

function extractCombined(input: string): CombinedResult {
  let remaining = input
  // Check combined patterns (longest first)
  const sorted = Object.entries(COMBINED_DATETIME).sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, cfg] of sorted) {
    if (remaining.includes(keyword)) {
      remaining = remaining.replace(keyword, '')
      const fallbackTime = `${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')}`
      // Derive period hint from the keyword
      let periodHint: string | null = null
      if (keyword.includes('晚')) periodHint = '晚上'
      else if (keyword.includes('早')) periodHint = '早上'
      return { dateContext: cfg.dateContext, fallbackTime, periodHint, remaining, foundDate: true }
    }
  }
  return { dateContext: null, fallbackTime: null, periodHint: null, remaining, foundDate: false }
}

// ========== Extract Repeat ==========

interface RepeatResult {
  repeatRule: RepeatRule | null
  weeklyDays: number[]
  remaining: string
  found: boolean
}

function extractRepeat(input: string): RepeatResult {
  let remaining = input

  // "每个工作日" / "工作日"
  const workdayRe = /每个?工作日/
  if (workdayRe.test(remaining)) {
    remaining = remaining.replace(workdayRe, '')
    return { repeatRule: 'weekly', weeklyDays: [1, 2, 3, 4, 5], remaining, found: true }
  }

  // "每周一三五" / "每周一、三、五" / "每周一和三和五"
  const weeklyMultiRe = /每周([一二三四五六日天](?:[、,，和与]?[一二三四五六日天])*)/
  const weeklyMultiMatch = remaining.match(weeklyMultiRe)
  if (weeklyMultiMatch) {
    const dayChars = weeklyMultiMatch[1].match(/[一二三四五六日天]/g) || []
    const days = dayChars.map((c) => WEEKDAY_MAP[c]).filter((d) => d !== undefined)
    remaining = remaining.replace(weeklyMultiRe, '')
    return { repeatRule: 'weekly', weeklyDays: days, remaining, found: true }
  }

  // "每天" / "每日"
  const dailyRe = /每天|每日/
  if (dailyRe.test(remaining)) {
    remaining = remaining.replace(dailyRe, '')
    return { repeatRule: 'daily', weeklyDays: [], remaining, found: true }
  }

  return { repeatRule: null, weeklyDays: [], remaining, found: false }
}

// ========== Extract Date ==========

interface DateResult {
  dateContext: ParsedTask['dateContext']
  specificDate: string | null
  remaining: string
  found: boolean
}

function extractDate(input: string): DateResult {
  let remaining = input

  // 今天/明天/后天
  const relativeDayRe = /今天|今日/
  if (relativeDayRe.test(remaining)) {
    remaining = remaining.replace(relativeDayRe, '')
    return { dateContext: 'today', specificDate: null, remaining, found: true }
  }
  const tomorrowRe = /明天|明日/
  if (tomorrowRe.test(remaining)) {
    remaining = remaining.replace(tomorrowRe, '')
    return { dateContext: 'tomorrow', specificDate: null, remaining, found: true }
  }
  const dayAfterRe = /后天/
  if (dayAfterRe.test(remaining)) {
    remaining = remaining.replace(dayAfterRe, '')
    return { dateContext: 'day-after', specificDate: null, remaining, found: true }
  }

  // X月X日 / X月X号
  const dateRe = /(\d{1,2})月(\d{1,2})[日号]/
  const dateMatch = remaining.match(dateRe)
  if (dateMatch) {
    const month = String(Number(dateMatch[1])).padStart(2, '0')
    const day = String(Number(dateMatch[2])).padStart(2, '0')
    remaining = remaining.replace(dateRe, '')
    return { dateContext: 'specific', specificDate: `${month}-${day}`, remaining, found: true }
  }

  // 下周X (without 每)
  const nextWeekRe = /下周([一二三四五六日天])/
  const nextWeekMatch = remaining.match(nextWeekRe)
  if (nextWeekMatch) {
    const dayNum = WEEKDAY_MAP[nextWeekMatch[1]]
    if (dayNum !== undefined) {
      const now = new Date()
      const currentDay = now.getDay()
      let diff = dayNum - currentDay
      if (diff <= 0) diff += 7
      diff += 7
      const target = new Date(now.getTime() + diff * 86400000)
      const month = String(target.getMonth() + 1).padStart(2, '0')
      const day = String(target.getDate()).padStart(2, '0')
      remaining = remaining.replace(nextWeekRe, '')
      return { dateContext: 'specific', specificDate: `${month}-${day}`, remaining, found: true }
    }
  }

  // 周X (without 每, single occurrence this week or next)
  const thisWeekRe = /周([一二三四五六日天])/
  const thisWeekMatch = remaining.match(thisWeekRe)
  if (thisWeekMatch) {
    const dayNum = WEEKDAY_MAP[thisWeekMatch[1]]
    if (dayNum !== undefined) {
      const now = new Date()
      const currentDay = now.getDay()
      let diff = dayNum - currentDay
      if (diff <= 0) diff += 7
      const target = new Date(now.getTime() + diff * 86400000)
      const month = String(target.getMonth() + 1).padStart(2, '0')
      const day = String(target.getDate()).padStart(2, '0')
      remaining = remaining.replace(thisWeekRe, '')
      return { dateContext: 'specific', specificDate: `${month}-${day}`, remaining, found: true }
    }
  }

  return { dateContext: null, specificDate: null, remaining, found: false }
}

// ========== Extract Time ==========

interface TimeResult {
  time: string | null // "HH:mm"
  remaining: string
  found: boolean
  isRelative: boolean
}

function extractTime(input: string, periodHint?: string | null): TimeResult {
  let remaining = input

  // Relative time: 一会儿/等下/等一下 → +15min
  const soonRe = /一会儿?|等下|等一下|过一会儿?|稍后/
  if (soonRe.test(remaining)) {
    const target = new Date(Date.now() + 15 * 60000)
    const mins = Math.round(target.getMinutes() / 5) * 5
    const hours = mins >= 60 ? target.getHours() + 1 : target.getHours()
    const time = `${String(hours % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    remaining = remaining.replace(soonRe, '')
    return { time, remaining, found: true, isRelative: true }
  }

  // Relative time: N小时后 / N分钟后 / 半小时后
  const halfHourRe = /半小时后|半个小时后/
  if (halfHourRe.test(remaining)) {
    const target = new Date(Date.now() + 30 * 60000)
    const mins = Math.round(target.getMinutes() / 5) * 5
    const hours = mins >= 60 ? target.getHours() + 1 : target.getHours()
    const time = `${String(hours % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    remaining = remaining.replace(halfHourRe, '')
    return { time, remaining, found: true, isRelative: true }
  }

  const relativeRe = /(\d+)\s*(小时|个小时|分钟|分)后/
  const relativeMatch = remaining.match(relativeRe)
  if (relativeMatch) {
    const amount = Number(relativeMatch[1])
    const unit = relativeMatch[2]
    const ms = (unit === '小时' || unit === '个小时') ? amount * 3600000 : amount * 60000
    const target = new Date(Date.now() + ms)
    const mins = Math.round(target.getMinutes() / 5) * 5
    const hours = mins >= 60 ? target.getHours() + 1 : target.getHours()
    const time = `${String(hours % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    remaining = remaining.replace(relativeRe, '')
    return { time, remaining, found: true, isRelative: true }
  }

  // Period + hour + optional minutes: 下午3点半, 早上8点15分, 晚上10点
  const periodNames = Object.keys(TIME_PERIOD_RANGES).join('|')
  const fullTimeRe = new RegExp(
    `(?:(${periodNames}))?(\\d{1,2})[点时:](\\d{1,2})分?|` +
    `(?:(${periodNames}))?(\\d{1,2})[点时:]半|` +
    `(?:(${periodNames}))?(\\d{1,2})[点时:]`
  )
  const fullMatch = remaining.match(fullTimeRe)
  if (fullMatch) {
    let period: string | undefined
    let hour: number
    let minute: number

    if (fullMatch[1] !== undefined && fullMatch[2] !== undefined && fullMatch[3] !== undefined) {
      period = fullMatch[1]
      hour = Number(fullMatch[2])
      minute = Number(fullMatch[3])
    } else if (fullMatch[4] !== undefined && fullMatch[5] !== undefined) {
      period = fullMatch[4]
      hour = Number(fullMatch[5])
      minute = 30
    } else if (fullMatch[6] !== undefined && fullMatch[7] !== undefined) {
      period = fullMatch[6]
      hour = Number(fullMatch[7])
      minute = 0
    } else if (fullMatch[2] !== undefined && fullMatch[3] !== undefined) {
      hour = Number(fullMatch[2])
      minute = Number(fullMatch[3])
      period = undefined
    } else if (fullMatch[5] !== undefined) {
      hour = Number(fullMatch[5])
      minute = 30
      period = undefined
    } else if (fullMatch[7] !== undefined) {
      hour = Number(fullMatch[7])
      minute = 0
      period = undefined
    } else {
      return { time: null, remaining, found: false, isRelative: false }
    }

    // Apply period offset
    if (period && TIME_PERIOD_RANGES[period]) {
      hour = TIME_PERIOD_RANGES[period](hour)
    } else if (!period && periodHint && TIME_PERIOD_RANGES[periodHint]) {
      // Use the hint from combined expression (e.g., "今晚八点" → hint='晚上')
      hour = TIME_PERIOD_RANGES[periodHint](hour)
    } else if (!period && hour >= 1 && hour <= 5) {
      // Heuristic: bare 1-5 likely means PM
      hour += 12
    }

    hour = Math.min(hour, 23)
    minute = Math.min(minute, 59)

    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    remaining = remaining.replace(fullMatch[0], '')
    return { time, remaining, found: true, isRelative: false }
  }

  // Bare HH:MM format (e.g., "15:00")
  const bareTimeRe = /(\d{1,2}):(\d{2})/
  const bareMatch = remaining.match(bareTimeRe)
  if (bareMatch) {
    const hour = Math.min(Number(bareMatch[1]), 23)
    const minute = Math.min(Number(bareMatch[2]), 59)
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    remaining = remaining.replace(bareTimeRe, '')
    return { time, remaining, found: true, isRelative: false }
  }

  // Fuzzy time-of-day (standalone period word without a number, e.g., "晚上提醒我喝水")
  // Only match if the period word is standalone (not followed by a digit)
  const fuzzyKeys = Object.keys(FUZZY_TIME_MAP).sort((a, b) => b.length - a.length)
  for (const key of fuzzyKeys) {
    const idx = remaining.indexOf(key)
    if (idx === -1) continue
    // Make sure it's not followed by a digit (which would be handled by fullTimeRe above)
    const afterIdx = idx + key.length
    if (afterIdx < remaining.length && /\d/.test(remaining[afterIdx])) continue
    const ft = FUZZY_TIME_MAP[key]
    const time = `${String(ft.hour).padStart(2, '0')}:${String(ft.minute).padStart(2, '0')}`
    remaining = remaining.replace(key, '')
    return { time, remaining, found: true, isRelative: false }
  }

  return { time: null, remaining, found: false, isRelative: false }
}

// ========== Extract Category ==========

function extractCategory(originalInput: string): Category | null {
  let bestCategory: Category | null = null
  let bestScore = 0

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'other') continue
    let score = 0
    for (const kw of keywords) {
      if (originalInput.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat as Category
    }
  }

  return bestCategory
}

// ========== Extract Task Name ==========

function extractName(residual: string, originalInput: string, category: Category | null): string {
  let name = residual

  // Strip noise particles
  for (const particle of NOISE_PARTICLES) {
    name = name.replace(new RegExp(particle, 'g'), '')
  }

  // Strip leftover punctuation and whitespace
  name = name.replace(/[，,。.、；;！!？?：:\s]+/g, ' ').trim()

  // If name is empty, try to find the category keyword from original input
  if (!name && category) {
    const keywords = CATEGORY_KEYWORDS[category]
    for (const kw of keywords) {
      if (originalInput.includes(kw)) {
        name = kw
        break
      }
    }
  }

  return name
}

// ========== Main Parser ==========

export function parseNaturalLanguage(input: string): ParsedTask {
  const empty: ParsedTask = {
    name: '',
    time: null,
    dateContext: null,
    specificDate: null,
    repeatRule: null,
    weeklyDays: [],
    category: null,
    confidence: { time: false, repeat: false, category: false },
    receiver: null,
    itemType: null,
  }

  const trimmed = input.trim()
  if (!trimmed) return empty

  let normalized = normalize(trimmed)
  // Convert Chinese numbers in time expressions to digits
  normalized = cnTimeToDigit(normalized)

  // Stage 0: Extract combined date+time (今晚, 明早, etc.)
  // Combined only sets dateContext; its time is a fallback used only if no explicit time is found
  const combinedResult = extractCombined(normalized)
  let currentRemaining = combinedResult.remaining
  let foundDate = combinedResult.foundDate
  let dateContext = combinedResult.dateContext
  let time: string | null = null
  let specificDate: string | null = null

  // Stage 1: Extract repeat
  const repeatResult = extractRepeat(currentRemaining)
  currentRemaining = repeatResult.remaining

  // Stage 2: Extract date (if not found by combined)
  if (!foundDate) {
    const dateResult = extractDate(currentRemaining)
    currentRemaining = dateResult.remaining
    foundDate = dateResult.found
    dateContext = dateResult.dateContext
    specificDate = dateResult.specificDate
  }

  // Stage 3: Always try to extract explicit time from remaining
  let isRelative = false
  let foundTime = false
  const timeResult = extractTime(currentRemaining, combinedResult.periodHint)
  if (timeResult.found) {
    currentRemaining = timeResult.remaining
    foundTime = true
    time = timeResult.time
    isRelative = timeResult.isRelative
  } else if (combinedResult.fallbackTime) {
    // No explicit time found — use the combined fallback (e.g., "今晚" → 21:00)
    foundTime = true
    time = combinedResult.fallbackTime
  }

  // If relative time and no date context, set to today
  if (isRelative && !dateContext) {
    dateContext = 'today'
    foundDate = true
  }

  // Stage 4: Extract category (from original normalized input, not stripped)
  const category = extractCategory(normalized)

  // Stage 5: Extract name (from residual after all extractions)
  const name = extractName(currentRemaining, normalized, category)

  return {
    name,
    time,
    dateContext,
    specificDate,
    repeatRule: repeatResult.repeatRule,
    weeklyDays: repeatResult.weeklyDays,
    category,
    confidence: {
      time: foundTime,
      repeat: repeatResult.found,
      category: category !== null,
    },
    receiver: null,
    itemType: null,
  }
}

// ========== Smart Defaults ==========

export function applySmartDefaults(parsed: ParsedTask): CreateTaskInput {
  // Time: default to next whole hour
  let remindTime = parsed.time
  if (!remindTime) {
    const now = new Date()
    let nextHour = now.getHours() + 1
    if (now.getMinutes() < 5) nextHour = now.getHours()
    nextHour = nextHour % 24
    remindTime = `${String(nextHour).padStart(2, '0')}:00`
  }

  // Repeat: if specific date → once, otherwise → daily
  let repeatRule = parsed.repeatRule
  if (!repeatRule) {
    repeatRule = parsed.dateContext ? 'once' : 'daily'
  }

  // Weekly days: default to workdays if weekly but no days specified
  let weeklyDays = parsed.weeklyDays
  if (repeatRule === 'weekly' && weeklyDays.length === 0) {
    weeklyDays = [1, 2, 3, 4, 5]
  }

  return {
    name: parsed.name,
    category: parsed.category || 'life',
    remindTime,
    repeatRule,
    weeklyDays,
    followUpIntensity: 'standard',
    itemType: 'todo',
    creatorId: '',   // will be set from UI context
    receiverId: '',  // will be set from UI context
    note: '',
  }
}

// ========== Follow-up Question Generator ==========

export interface FollowUpQuestion {
  field: 'name' | 'time'
  prompt: string
  placeholder: string
}

/**
 * Determine if we need to ask the user a follow-up question.
 * Strategy: only ask about truly critical missing info, and ask conversationally.
 */
export function getFollowUpQuestion(parsed: ParsedTask): FollowUpQuestion | null {
  // Missing task name is critical — we don't know what to remind about
  if (!parsed.name) {
    return {
      field: 'name',
      prompt: '做什么事呢？',
      placeholder: '比如：吃药、遛狗、开会...',
    }
  }

  // Time is not critical — we can default to next hour
  // But if we have no time AND no repeat, gently ask
  // Actually per product spec, be minimal. Don't ask about time.
  return null
}
