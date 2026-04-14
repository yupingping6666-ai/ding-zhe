import type { RelayGenerateResult } from '@/types'
import type { RelaySmartResult } from '@/api/emotion-relay'

// ---- Keyword-based emotion relay template system ----
// Templates use {name} for companion name and {message} for user's original text.
// The goal is to OPTIMIZE/REPHRASE the user's expression, not just notify.
// - gentle: warm, empathetic rephrasing with emotional depth
// - casual: fun, light-hearted rephrasing that reduces pressure
// - direct: the user's original words (the most honest version)

interface RelayTemplateSet {
  keywords: string[]
  templates: RelayGenerateResult[]
}

const MISSING_TEMPLATES: RelayTemplateSet = {
  keywords: ['想你', '想念', '好久没见', '好想', '念你', '想TA', '想他', '想她'],
  templates: [
    { gentle: '窗外的风都在替TA说——好想见你。{name}把这份思念轻轻放在你手心~', casual: '警报！有人想你想到手机都快捏碎了，{name}紧急出动灭火！', direct: '{message}' },
    { gentle: '有个人满脑子都是你的影子，想藏都藏不住。{name}偷偷告诉你~', casual: '{name}查了下，有人的"想你浓度"已经超标300%，建议你立刻出现！', direct: '{message}' },
    { gentle: '月亮替TA收集了所有的想念，今晚一起送到你枕边~', casual: '有人对着{name}念叨你念了整整一天，{name}的耳朵都要起茧了！', direct: '{message}' },
    { gentle: '这世上有种病叫"想你"，TA已经病入膏肓，唯一的药方就是你~', casual: '叮！你有一条来自"思念快递公司"的加急件，发件人匿名但{name}知道是谁~', direct: '{message}' },
  ],
}

const LOVE_TEMPLATES: RelayTemplateSet = {
  keywords: ['爱你', '爱', '喜欢', '好爱', '超爱', '爱死', '心动', '着迷', '钟意', '中意'],
  templates: [
    { gentle: '有颗心正在为你砰砰跳，TA说不出口的那三个字，{name}替TA说了~', casual: '有人对你的喜欢已经溢出屏幕了，{name}拖地拖了半天还没拖完！', direct: '{message}' },
    { gentle: '全世界都知道了，只差告诉你——有人爱你爱得不得了~', casual: '{name}做了个统计：有人今天提到你的名字87次，请问这正常吗？', direct: '{message}' },
    { gentle: '如果喜欢有重量，TA对你的这份心意大概能压塌整个地球~', casual: '紧急报告！有人的少女心正在疯狂发射爱心弹幕，目标：你！', direct: '{message}' },
    { gentle: '{name}见证了一份滚烫的真心——TA对你的爱，温柔且坚定~', casual: '有人的恋爱脑已经无药可救了，症状就是满脑子都是你，{name}也救不了！', direct: '{message}' },
  ],
}

const CARE_TEMPLATES: RelayTemplateSet = {
  keywords: ['注意', '小心', '别忘', '记得', '照顾', '多喝', '早睡', '吃饭', '别熬夜', '保重'],
  templates: [
    { gentle: '有人虽然嘴上不说，心里却一直记挂着你。TA托{name}轻轻提醒你~', casual: '你的私人唠叨机器人上线！不听话的话，{name}要代替TA揍你了哦~', direct: '{message}' },
    { gentle: '世界很大，但TA最担心的只有你。请好好照顾自己，好吗？', casual: '{name}收到一条"碎碎念"任务：盯着你好好吃饭！完不成TA要扣{name}工资的！', direct: '{message}' },
    { gentle: '远方有个人正默默为你祈祷平安，这份温暖{name}替TA送到~', casual: '有人雇了{name}当你的贴身保姆，第一条规矩：不许不好好吃饭！', direct: '{message}' },
  ],
}

const COQUETTISH_TEMPLATES: RelayTemplateSet = {
  keywords: ['哼', '不理你', '讨厌', '坏蛋', '不开心', '生闷气', '委屈'],
  templates: [
    { gentle: '有人嘴上说"哼"，心里却在偷偷看你会不会来哄。{name}觉得你该行动了~', casual: '有人正在角落里生闷气，嘴巴嘟得能挂油壶，{name}建议你带着零食去救场！', direct: '{message}' },
    { gentle: '一颗小心脏正在闹别扭，不是真的生气，只是想被你多在乎一点~', casual: '小情绪警报！等级：嘟嘴。处理建议：一个拥抱+两句好话+无限哄哄~', direct: '{message}' },
    { gentle: 'TA说"讨厌"的时候，其实是在说"我需要你"。{name}懂，你也懂的对吧？', casual: '{name}紧急播报：有人的醋坛子已经打翻了，请相关人员速速前往收拾！', direct: '{message}' },
  ],
}

const APOLOGY_TEMPLATES: RelayTemplateSet = {
  keywords: ['对不起', '抱歉', '是我不好', '我错了', '原谅', '不该'],
  templates: [
    { gentle: '有人在心里排练了一万遍道歉的话，最后还是请{name}来帮忙。TA是真的在乎你~', casual: '{name}被派来举白旗了！有人说如果你不原谅TA，TA就要在门口罚站到天亮~', direct: '{message}' },
    { gentle: '犯了错的人比谁都难过，因为TA最怕的就是失去你~', casual: '有人正在墙角画圈圈反省中，{name}看着都心疼了，要不你去捞一下？', direct: '{message}' },
    { gentle: '这句"对不起"虽然迟到了，但每一个字都是TA的真心。{name}替TA诚恳转达~', casual: '投降投降！有人已经自觉面壁了，{name}代为申请"减刑"，望批准！', direct: '{message}' },
  ],
}

const THANKS_TEMPLATES: RelayTemplateSet = {
  keywords: ['谢谢', '感谢', '辛苦了', '多亏', '感激', '太好了'],
  templates: [
    { gentle: '有人说不出太多华丽的话，但你的每一份好，TA都记在心底最柔软的地方~', casual: '{name}隆重宣布：你荣获本年度"最佳宝贝"大奖！奖品是有人一辈子的爱~', direct: '{message}' },
    { gentle: '遇见你是TA这辈子最幸运的事，这份感谢{name}替TA珍重送达~', casual: '有人想给你颁发一面锦旗，上书四个大字："全世界最好"！{name}负责快递~', direct: '{message}' },
    { gentle: '谢谢你一直在，这几个字虽然简单，却是TA最想说的话~', casual: '好评+五星+置顶！有人对你的满意度已经爆表，{name}的评分系统都崩了~', direct: '{message}' },
  ],
}

const ANGRY_TEMPLATES: RelayTemplateSet = {
  keywords: ['生气', '烦', '受不了', '火大', '崩溃', '忍不了'],
  templates: [
    { gentle: '有人心里有些话堵着说不出，不是不爱了，恰恰是因为太在乎才会难过~', casual: '暴风雨预警！有人目前情绪等级：小火山。{name}建议你带上防具和甜食前往~', direct: '{message}' },
    { gentle: '生气的背后，是一颗渴望被理解的心。TA只是希望你能认真听一听~', casual: '{name}新闻联播：有人的怒气值已经充满，请当事人立刻上线进行安抚操作！', direct: '{message}' },
    { gentle: '吵架不是为了赢，是因为不想失去你。TA的难过比生气更多~', casual: '有人让{name}传话：气死了！但又舍不得真的不理你。哎，人类真复杂~', direct: '{message}' },
  ],
}

const DEFAULT_TEMPLATES: RelayGenerateResult[] = [
  { gentle: '有人把最真的心意藏在这句话里，{name}替TA轻轻说给你听~', casual: '{name}被抓来当了传话筒——有人有话不好意思自己说，让{name}代劳了！', direct: '{message}' },
  { gentle: '这些文字里藏着一颗真心，{name}用最温柔的方式把它送到你面前~', casual: '叮咚！你有一条来自"不好意思开口星人"的消息，{name}负责快递上门！', direct: '{message}' },
  { gentle: '有人想了很久该怎么对你说，最后决定让{name}帮忙。请认真听好~', casual: '{name}接了个大活：帮人传话！报酬是——看你们甜甜蜜蜜的样子~', direct: '{message}' },
]

const ALL_TEMPLATE_SETS: RelayTemplateSet[] = [
  LOVE_TEMPLATES,
  MISSING_TEMPLATES,
  CARE_TEMPLATES,
  COQUETTISH_TEMPLATES,
  APOLOGY_TEMPLATES,
  THANKS_TEMPLATES,
  ANGRY_TEMPLATES,
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillTemplate(result: RelayGenerateResult, companionName: string, message: string): RelayGenerateResult {
  const replace = (s: string) => s.replace(/\{name\}/g, companionName).replace(/\{message\}/g, message)
  return {
    gentle: replace(result.gentle),
    casual: replace(result.casual),
    direct: replace(result.direct),
  }
}

/**
 * Generate 3 relay versions locally using keyword scoring + templates.
 * Scores each category by summing matched keyword lengths; highest wins.
 * Templates incorporate the user's original message to produce content-aware
 * optimized expressions rather than generic notifications.
 * Used as fallback when API is unavailable.
 */
export function generateLocalRelayVersions(
  message: string,
  companionName: string,
): RelayGenerateResult {
  const lower = message.toLowerCase()

  let bestSet: RelayTemplateSet | null = null
  let bestScore = 0

  for (const set of ALL_TEMPLATE_SETS) {
    let score = 0
    for (const k of set.keywords) {
      if (lower.includes(k)) {
        score += k.length
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestSet = set
    }
  }

  if (bestSet) {
    return fillTemplate(pick(bestSet.templates), companionName, message)
  }

  return fillTemplate(pick(DEFAULT_TEMPLATES), companionName, message)
}

/**
 * System prompt for LLM integration (exported for backend use).
 * Emphasizes CONTENT TRANSFORMATION: rewrite/optimize the user's expression,
 * not just generate a notification that someone wants to talk.
 */
export const RELAY_SYSTEM_PROMPT = `你是"表达优化助手"，帮助情侣更好地表达内心感受。你风趣幽默，同时也懂得温柔。

【核心目标】
你的任务是**用全新的方式重新表达**用户想说的话，而不是简单地把原话加引号转发。
温柔版要打动人心，轻松版要让人忍不住笑出来，直球版要真诚有力。

【内部流程（不输出）】
1. 理解用户原话的**核心含义和情感**（想说什么、为什么说）
2. 根据关系天数和亲密度推断合适的表达深度
3. 用3种不同风格**完全重写**，不要引用原文，用你自己的话重新表达

【三种风格】
- 温柔版：诗意、含蓄、温暖，像月光一样轻柔。可以用{companionName}的视角，用比喻和意象。不要用「」引号包原话
- 轻松版：搞笑、俏皮、夸张，像朋友在吐槽。用网络梗、有趣的比喻、反差萌。让人看了想笑。不要用「」引号包原话
- 直球版：坦诚直接，保留用户原意，用最真挚简洁的方式说出来。可以适度润色

【约束规则】
- 每版本不超过50字
- 必须忠实传达用户原话的**核心意思**，不能丢失关键信息
- 不要用「」引号直接引用原话——要用你自己的话重新说
- 禁止：情绪绑架、指责、"你必须/你怎么/你总是"、道德压迫
- 如果原话含有负面攻击，转化为建设性的表达

【输入】
发送者：{senderName}  接收者：{receiverName}
宠物名：{companionName}  在一起：{relationDays}天
原始表达："{message}"

【输出】严格JSON，无其他文字：
{"gentle":"","casual":"","direct":""}`

/**
 * Smart local fallback: automatically selects the best tone based on keywords.
 * Returns a single optimized version instead of three.
 */
export function generateLocalSmartRelay(
  message: string,
  companionName: string,
): RelaySmartResult {
  const lower = message.toLowerCase()

  // Determine best tone based on message content
  let tone: RelaySmartResult['tone'] = 'gentle'

  // Direct tone: apologies, serious declarations
  const directKeywords = ['对不起', '抱歉', '是我不好', '我错了', '原谅', '不该', '永远', '一辈子', '承诺', '发誓']
  // Casual tone: playful, teasing, light-hearted
  const casualKeywords = ['哼', '不理你', '讨厌', '坏蛋', '嘿嘿', '哈哈', '逗你', '想你想到', '笨蛋']
  // Gentle tone: deep love, missing, gratitude (default)

  const hasDirectMatch = directKeywords.some(k => lower.includes(k))
  const hasCasualMatch = casualKeywords.some(k => lower.includes(k))

  if (hasDirectMatch) {
    tone = 'direct'
  } else if (hasCasualMatch) {
    tone = 'casual'
  }

  // Generate text based on selected tone
  let bestSet: RelayTemplateSet | null = null
  let bestScore = 0

  for (const set of ALL_TEMPLATE_SETS) {
    let score = 0
    for (const k of set.keywords) {
      if (lower.includes(k)) {
        score += k.length
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestSet = set
    }
  }

  const templates = bestSet ? pick(bestSet.templates) : pick(DEFAULT_TEMPLATES)
  const text = fillTemplate(templates, companionName, message)[tone]

  return { text, tone, fallback: false }
}
