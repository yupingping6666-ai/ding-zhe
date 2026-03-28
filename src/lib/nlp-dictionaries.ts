import type { Category } from '@/types'

/** Category keyword lists for auto-detection */
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  health: [
    '吃药', '喝水', '运动', '跑步', '锻炼', '体检', '维生素',
    '健身', '瑜伽', '散步', '早睡', '睡觉', '量血压', '测血糖',
    '吃早餐', '吃午餐', '吃晚餐', '吃饭', '护肤', '敷面膜',
    '泡脚', '吃维生素', '补钙', '拉伸',
  ],
  work: [
    '开会', '汇报', '邮件', '回复', '提交', '项目', '写报告',
    '上班', '下班', '打卡', '周报', '日报', '面试', '会议',
    '出差', '加班', '对接', '评审', '交方案', '发周报', '交报告',
  ],
  study: [
    '上课', '复习', '背单词', '作业', '考试', '学习', '阅读',
    '读书', '听课', '练习', '写论文', '培训', '看书', '英语',
    '刷题', '预习', '练琴', '写作业',
  ],
  life: [
    '遛狗', '买菜', '做饭', '洗衣', '打扫', '取快递', '出门',
    '带伞', '浇花', '喂猫', '喂鱼', '倒垃圾', '交租', '交水电',
    '接孩子', '买东西', '寄快递', '洗碗', '拖地', '洗澡',
    '给狗洗澡', '充话费', '交电费', '还信用卡',
  ],
  other: [],
}

/** Chinese weekday character → JS day number (0=Sun, 1=Mon, ..., 6=Sat) */
export const WEEKDAY_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '日': 0, '天': 0,
}

/** Chinese number character → digit */
export const CN_NUM_MAP: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
}

/** Convert Chinese number string to digit (e.g., "三" → 3, "十二" → 12, "二十" → 20) */
export function cnNumToDigit(s: string): number | null {
  // Single char
  if (CN_NUM_MAP[s] !== undefined) return CN_NUM_MAP[s]
  // "十X" → 10+X
  if (s.startsWith('十') && s.length === 2) {
    const ones = CN_NUM_MAP[s[1]]
    if (ones !== undefined) return 10 + ones
    return null
  }
  // "X十" → X*10
  if (s.endsWith('十') && s.length === 2) {
    const tens = CN_NUM_MAP[s[0]]
    if (tens !== undefined) return tens * 10
    return null
  }
  // "X十Y" → X*10+Y
  const tenIdx = s.indexOf('十')
  if (tenIdx > 0 && tenIdx < s.length - 1) {
    const tens = CN_NUM_MAP[s.substring(0, tenIdx)]
    const ones = CN_NUM_MAP[s.substring(tenIdx + 1)]
    if (tens !== undefined && ones !== undefined) return tens * 10 + ones
    return null
  }
  return null
}

/** Time-of-day period words → hour adjustment function */
export const TIME_PERIOD_RANGES: Record<string, (h: number) => number> = {
  '早上': (h) => h <= 12 ? h : h,
  '上午': (h) => h <= 12 ? h : h,
  '中午': (h) => h === 12 ? 12 : h <= 12 ? h + 12 : h,
  '下午': (h) => h <= 12 && h !== 12 ? h + 12 : h,
  '晚上': (h) => h <= 12 && h !== 12 ? h + 12 : h,
  '傍晚': (h) => h <= 12 && h !== 12 ? h + 12 : h,
  '凌晨': (h) => h,
}

/**
 * Fuzzy time expressions → default { hour, minute }
 * These are standalone time hints without specific numeric hours.
 */
export const FUZZY_TIME_MAP: Record<string, { hour: number; minute: number }> = {
  '早上': { hour: 8, minute: 0 },
  '上午': { hour: 9, minute: 0 },
  '中午': { hour: 12, minute: 0 },
  '下午': { hour: 14, minute: 0 },
  '傍晚': { hour: 18, minute: 0 },
  '晚上': { hour: 21, minute: 0 },
  '凌晨': { hour: 5, minute: 0 },
  '睡前': { hour: 22, minute: 30 },
  '出门前': { hour: 7, minute: 30 },
  '午饭后': { hour: 13, minute: 0 },
  '晚饭后': { hour: 19, minute: 30 },
  '饭后': { hour: 19, minute: 0 },
  '起床后': { hour: 7, minute: 0 },
  '下班后': { hour: 18, minute: 30 },
}

/**
 * Combined date+time shorthands: "今晚", "明早", etc.
 * Returns { dateContext, fuzzyTime }
 */
export const COMBINED_DATETIME: Record<string, {
  dateContext: 'today' | 'tomorrow'
  hour: number
  minute: number
}> = {
  '今早': { dateContext: 'today', hour: 8, minute: 0 },
  '今晚': { dateContext: 'today', hour: 21, minute: 0 },
  '今天晚上': { dateContext: 'today', hour: 21, minute: 0 },
  '明早': { dateContext: 'tomorrow', hour: 8, minute: 0 },
  '明天早上': { dateContext: 'tomorrow', hour: 8, minute: 0 },
  '明晚': { dateContext: 'tomorrow', hour: 21, minute: 0 },
  '明天晚上': { dateContext: 'tomorrow', hour: 21, minute: 0 },
}

/** Noise particles to strip from the residual to get the task name */
export const NOISE_PARTICLES = [
  '提醒我', '记得', '别忘了', '帮我', '要记得',
  '要', '去', '得', '的', '把', '让我', '该',
  '一下', '一定',
]