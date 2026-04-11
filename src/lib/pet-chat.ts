import type { PetExpression, PetMood, ChatQuickAction } from '@/types'

interface CatReplyContext {
  companionName: string
  petMood: PetMood
  energy: number
  todayInteractions: number
  canPet: boolean
  petCooldown: number
  canFeed: boolean
  feedCooldown: number
  relationDays: number
}

interface CatReply {
  text: string
  expression: PetExpression
}

// ---- Keyword rule system ----

interface KeywordRule {
  keywords: string[]
  replies: string[]
  expression: PetExpression
}

const GREETING_RULES: KeywordRule = {
  keywords: ['你好', '嗨', 'hi', 'hello', '早', '早上好', '晚安', '下午好', '嘿'],
  replies: [
    '喵~ 你来啦！{name}好开心！',
    '嗨嗨~ {name}一直在等你哦！',
    '喵呜~ 终于等到你了！',
    '你好呀~ {name}今天也元气满满！',
    '嘿嘿~ 见到你{name}就很开心！',
    '喵~ 你来陪{name}啦，太好了！',
    '哇，你来了！{name}刚在想你呢~',
    '喵喵~ 今天也要一起度过哦！',
  ],
  expression: 'happy',
}

const POSITIVE_RULES: KeywordRule = {
  keywords: ['开心', '高兴', '好', '棒', '喜欢', '谢谢', '感谢', '爱', '幸福', '快乐', '不错', '厉害'],
  replies: [
    '喵~ 你开心{name}也开心！',
    '嘿嘿，听到你这么说{name}好高兴~',
    '喵呜~ 继续保持好心情哦！',
    '{name}感受到了你的快乐，真好~',
    '太棒了！{name}为你感到骄傲！',
    '喵~ 快乐的日子最珍贵了~',
    '你的笑容让{name}也暖暖的~',
    '嗯嗯！好事情要好好记住哦！',
  ],
  expression: 'love',
}

const NEGATIVE_RULES: KeywordRule = {
  keywords: ['难过', '伤心', '累', '压力', '焦虑', '烦', '生气', '不开心', '不好', '失落', '孤独', '担心', '害怕', '疲惫'],
  replies: [
    '喵... {name}在这里陪着你',
    '摸摸~ 不开心的时候就跟{name}说说',
    '喵呜... 没关系的，{name}一直在你身边',
    '累了就休息一下吧，{name}帮你守着~',
    '{name}虽然是只猫，但是会一直听你说的',
    '抱抱~ 不好的事情总会过去的',
    '喵... 你不是一个人，{name}在呢',
    '深呼吸~ {name}陪你一起放松一下',
  ],
  expression: 'curious',
}

const ABOUT_CAT_RULES: KeywordRule = {
  keywords: ['你是谁', '名字', '几岁', '喜欢吃', '你喜欢', '你是什么', '介绍', '关于你'],
  replies: [
    '喵？我是{name}呀！一只温暖的小橘猫~',
    '{name}最喜欢被摸头和晒太阳了！',
    '我是{name}！每天最开心的事就是陪你~',
    '喵~ {name}喜欢小鱼干和你的陪伴！',
    '我呀，就是你最可爱的小伙伴{name}！',
    '{name}的爱好是打盹和听你说话~',
    '嘿嘿，我是{name}，专职陪伴小能手！',
    '喵呜~ {name}的世界里最重要的就是你啦！',
  ],
  expression: 'curious',
}

const ACTIVITY_RULES: KeywordRule = {
  keywords: ['吃饭', '睡觉', '工作', '学习', '运动', '跑步', '做饭', '逛街', '出门', '回家', '加班'],
  replies: [
    '喵~ 好好{action}哦，{name}为你加油！',
    '{name}在家等你，你去忙吧~',
    '记得照顾好自己！{name}会乖乖等你的',
    '喵呜~ 不管做什么都要开开心心的！',
    '好的好的！{name}支持你！',
    '加油加油！{name}永远是你的啦啦队~',
    '去吧去吧~ 回来要跟{name}分享哦！',
    '嗯嗯，注意休息！{name}在这里守着~',
  ],
  expression: 'happy',
}

const DEFAULT_REPLIES: string[] = [
  '喵~ {name}在听呢，继续说吧~',
  '嗯嗯，{name}觉得很有意思！',
  '喵呜~ 然后呢然后呢？',
  '{name}歪头思考中... 喵？',
  '喵~ 跟你聊天好开心！',
  '嗯！{name}记住啦~',
  '喵喵~ 你说的{name}都会认真听的！',
  '哇~ 原来是这样呀！',
  '喵~ {name}最喜欢听你说话了！',
  '嘿嘿~ 继续继续！',
]

// ---- Quick action responses ----

const PET_RESPONSES: string[] = [
  '喵~ 好舒服！{name}最喜欢被摸头了！',
  '呼噜呼噜~ 再摸摸嘛~',
  '喵呜~ 开心地蹭蹭你的手~',
  '嘿嘿~ {name}眯起了眼睛，好享受~',
  '喵~ 被你摸头的时候最幸福了！',
  '{name}转了个圈，开心地喵喵叫~',
  '呼噜呼噜... {name}快要融化了~',
  '喵~ 你的手好温暖呀！',
]

const PET_COOLDOWN_RESPONSES: string[] = [
  '喵~ 刚刚被摸过啦，{name}还在回味呢~',
  '嘿嘿~ 等一下下再摸嘛，{name}还在开心中~',
  '喵呜~ 太频繁了啦，{name}的头要秃了！',
  '稍等一下嘛~ {name}整理一下毛发~',
]

const PLAY_RESPONSES: string[] = [
  '喵！来玩来玩！{name}准备好了！',
  '耶！{name}最喜欢玩耍了！追追追~',
  '喵呜~ {name}叼来了小毛线球！一起玩吧！',
  '好耶！{name}跳来跳去超开心！',
  '喵~ 抓到了！嘿嘿~ 再来一次！',
  '{name}翻了个肚皮~ 来呀来呀！',
  '喵喵！{name}使出了猫猫拳！',
  '太好玩了！{name}的尾巴都摇起来了~',
]

const PLAY_COOLDOWN_RESPONSES: string[] = [
  '喵... {name}刚玩完有点累了，休息一下下~',
  '嘿嘿~ {name}需要充充电，等会儿再玩！',
  '喵呜~ {name}现在想躺着，等恢复体力~',
]

const ADVICE_RESPONSES: string[] = [
  '喵~ {name}觉得... 今天最重要的是好好爱自己！',
  '嗯... {name}想了想... 去做让你开心的事吧！',
  '喵呜~ {name}的建议是：累了就休息，不用勉强自己~',
  '{name}觉得呀~ 每天进步一点点就够了！',
  '喵~ 记得喝水！这是{name}最重要的建议！',
  '嗯嗯，{name}建议你今天对自己温柔一点~',
  '喵~ 不管怎样，{name}都觉得你很棒！',
  '{name}的秘诀是：开心最重要！其他的慢慢来~',
  '喵呜~ 试试深呼吸三次？{name}也会一起做的！',
  '听{name}说！偶尔发呆也是很好的休息方式哦~',
]

// ---- Welcome messages ----

const WELCOME_MORNING: string[] = [
  '喵~ 早上好！{name}已经醒啦，今天也要加油哦！',
  '早安~ {name}伸了个大懒腰！新的一天开始了！',
]

const WELCOME_AFTERNOON: string[] = [
  '喵~ 下午好！{name}刚打了个小盹~',
  '午好~ {name}在等你来聊天呢！',
]

const WELCOME_EVENING: string[] = [
  '喵~ 晚上好！今天过得怎么样？跟{name}说说吧~',
  '嘿~ 忙了一天辛苦了！{name}一直在等你~',
]

const WELCOME_NIGHT: string[] = [
  '喵~ 这么晚了还没睡呀？{name}陪你~',
  '夜深了~ {name}在这里陪你，想说什么都可以哦~',
]

// ---- Mood modulation ----

const MOOD_PREFIX: Partial<Record<PetMood, string[]>> = {
  lonely: ['终于来找{name}啦！', '等你好久了~', '{name}好想你！'],
  happy: ['嘿嘿~ {name}今天心情超好！', '{name}开心得转圈圈~'],
  sleepy: ['{name}打了个哈欠~ 喵...'],
}

// ---- Utility ----

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillName(text: string, name: string): string {
  return text.replace(/\{name\}/g, name).replace(/\{action\}/g, '')
}

function matchesKeywords(input: string, keywords: string[]): boolean {
  const lower = input.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

// ---- Public API ----

export function generateCatReply(
  input: { content: string; actionType?: ChatQuickAction },
  context: CatReplyContext,
): CatReply {
  const { companionName: name } = context

  // Quick action handling
  if (input.actionType) {
    return handleQuickAction(input.actionType, context)
  }

  const text = input.content

  // Keyword matching (priority order)
  if (matchesKeywords(text, GREETING_RULES.keywords)) {
    let reply = pick(GREETING_RULES.replies)
    // Add mood prefix for lonely
    if (context.petMood === 'lonely') {
      reply = pick(MOOD_PREFIX.lonely!) + ' ' + reply
    }
    return { text: fillName(reply, name), expression: GREETING_RULES.expression }
  }

  if (matchesKeywords(text, NEGATIVE_RULES.keywords)) {
    return { text: fillName(pick(NEGATIVE_RULES.replies), name), expression: NEGATIVE_RULES.expression }
  }

  if (matchesKeywords(text, POSITIVE_RULES.keywords)) {
    return { text: fillName(pick(POSITIVE_RULES.replies), name), expression: POSITIVE_RULES.expression }
  }

  if (matchesKeywords(text, ABOUT_CAT_RULES.keywords)) {
    return { text: fillName(pick(ABOUT_CAT_RULES.replies), name), expression: ABOUT_CAT_RULES.expression }
  }

  if (matchesKeywords(text, ACTIVITY_RULES.keywords)) {
    return { text: fillName(pick(ACTIVITY_RULES.replies), name), expression: ACTIVITY_RULES.expression }
  }

  // Default
  const defaultExpr: PetExpression = context.petMood === 'happy' ? 'happy' : context.petMood === 'sleepy' ? 'sitting' : 'idle'
  return { text: fillName(pick(DEFAULT_REPLIES), name), expression: defaultExpr }
}

function handleQuickAction(action: ChatQuickAction, ctx: CatReplyContext): CatReply {
  const name = ctx.companionName

  switch (action) {
    case 'pet':
      if (!ctx.canPet) {
        return {
          text: fillName(pick(PET_COOLDOWN_RESPONSES), name) + ` (${ctx.petCooldown}s)`,
          expression: 'happy',
        }
      }
      return { text: fillName(pick(PET_RESPONSES), name), expression: 'love' }

    case 'play':
      if (!ctx.canFeed) {
        return {
          text: fillName(pick(PLAY_COOLDOWN_RESPONSES), name),
          expression: 'sitting',
        }
      }
      return { text: fillName(pick(PLAY_RESPONSES), name), expression: 'playing' }

    case 'advice':
      return { text: fillName(pick(ADVICE_RESPONSES), name), expression: 'thinking' }
  }
}

export function getWelcomeMessage(companionName: string, petMood: PetMood): CatReply {
  const tod = getTimeOfDay()
  const pool = tod === 'morning' ? WELCOME_MORNING
    : tod === 'afternoon' ? WELCOME_AFTERNOON
    : tod === 'evening' ? WELCOME_EVENING
    : WELCOME_NIGHT

  let text = fillName(pick(pool), companionName)

  // Mood prefix
  const prefix = MOOD_PREFIX[petMood]
  if (prefix) {
    text = fillName(pick(prefix), companionName) + ' ' + text
  }

  const expression: PetExpression = petMood === 'sleepy' ? 'sitting' : 'happy'
  return { text, expression }
}

export function getQuickActionLabel(action: ChatQuickAction): { emoji: string; label: string } {
  switch (action) {
    case 'pet': return { emoji: '❤️', label: '摸摸头' }
    case 'play': return { emoji: '🎮', label: '陪玩耍' }
    case 'advice': return { emoji: '💡', label: '给建议' }
  }
}

export function getQuickActionUserText(action: ChatQuickAction, companionName: string): string {
  switch (action) {
    case 'pet': return `摸摸${companionName}的头~`
    case 'play': return `来！陪${companionName}玩耍！`
    case 'advice': return `${companionName}，给我个建议吧~`
  }
}

/** Infer pet expression from AI reply text (keyword-based) */
export function inferExpression(text: string): PetExpression {
  if (/开心|嘿嘿|太好了|耶|棒|哈哈|快乐/.test(text)) return 'happy'
  if (/爱|喜欢|最重要|暖暖|幸福/.test(text)) return 'love'
  if (/玩|追|跳|毛线|抓/.test(text)) return 'playing'
  if (/想.*了|安慰|抱抱|陪着你|没关系/.test(text)) return 'curious'
  if (/困|睡|哈欠|打盹/.test(text)) return 'sitting'
  if (/嗯|思考|想想|建议/.test(text)) return 'thinking'
  return 'happy'
}
