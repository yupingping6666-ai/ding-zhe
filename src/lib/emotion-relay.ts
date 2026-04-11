import type { RelayGenerateResult } from '@/types'

// ---- Keyword-based emotion relay template system ----

interface RelayTemplateSet {
  keywords: string[]
  templates: RelayGenerateResult[]
}

const MISSING_TEMPLATES: RelayTemplateSet = {
  keywords: ['想你', '想念', '好久没见', '好想', '念你', '想TA', '想他', '想她'],
  templates: [
    { gentle: '{name}发现有人在悄悄想你呢 ~', casual: '报告！有人偷偷想你了', direct: '我很想你。' },
    { gentle: '{name}说，有个人的心里装满了你~', casual: '有只猫替人传话：想你啦~', direct: '想你了，很想很想。' },
    { gentle: '{name}轻轻碰了碰你：有人想见你~', casual: '叮~ 你有一条思念快递待签收', direct: '我忍不住想你了。' },
    { gentle: '{name}蹭了蹭你：有人好挂念你呀~', casual: '紧急通知：有人的脑子里全是你', direct: '每一刻都在想你。' },
  ],
}

const CARE_TEMPLATES: RelayTemplateSet = {
  keywords: ['注意', '小心', '别忘', '记得', '照顾', '多喝', '早睡', '吃饭', '别熬夜', '保重'],
  templates: [
    { gentle: '{name}叮嘱你：要好好照顾自己哦~', casual: '{name}提醒你：该爱惜自己啦！', direct: '记得照顾好自己。' },
    { gentle: '{name}说，有人在默默担心你呢~', casual: '你的专属提醒小助手上线了~', direct: '我担心你，请照顾好自己。' },
    { gentle: '{name}替人传话：注意身体，别逞强~', casual: '{name}温馨提示：你的健康很重要！', direct: '别太累了，我会心疼。' },
  ],
}

const COQUETTISH_TEMPLATES: RelayTemplateSet = {
  keywords: ['哼', '不理你', '讨厌', '坏蛋', '不开心', '生闷气', '委屈'],
  templates: [
    { gentle: '{name}说，有人假装不理你其实很在意~', casual: '有人在嘟嘴，需要你哄哦~', direct: '我有点不开心，想让你哄我。' },
    { gentle: '{name}悄悄告诉你：有人在等你主动~', casual: '气鼓鼓小报告：有人需要关注！', direct: '哼，我生气了，快来哄我。' },
    { gentle: '{name}蹭过来说：有人想要你的关心~', casual: '检测到一枚小情绪，请及时处理~', direct: '我有点委屈，想跟你说说。' },
  ],
}

const APOLOGY_TEMPLATES: RelayTemplateSet = {
  keywords: ['对不起', '抱歉', '是我不好', '我错了', '原谅', '不该'],
  templates: [
    { gentle: '{name}带来一句迟到的歉意~', casual: '有人让{name}来求和了~', direct: '对不起，是我不好。' },
    { gentle: '{name}说，有人很想跟你和好~', casual: '和平使者{name}前来调解~', direct: '我知道错了，请原谅我。' },
    { gentle: '{name}轻声说：有人后悔了，想重新开始~', casual: '白旗举起来了！请求停战~', direct: '真的很抱歉，我会改的。' },
  ],
}

const THANKS_TEMPLATES: RelayTemplateSet = {
  keywords: ['谢谢', '感谢', '辛苦了', '多亏', '感激', '太好了'],
  templates: [
    { gentle: '{name}替人传话：谢谢你，有你真好~', casual: '有人让{name}送来一朵小花~', direct: '谢谢你，我很感激。' },
    { gentle: '{name}说，有人把你的好都记在心里了~', casual: '表扬通知：你被点赞啦！', direct: '辛苦了，真的谢谢你。' },
    { gentle: '{name}蹭蹭你：有人觉得遇到你很幸运~', casual: '{name}颁发证书：最佳伴侣奖~', direct: '有你在身边，我很幸福。' },
  ],
}

const ANGRY_TEMPLATES: RelayTemplateSet = {
  keywords: ['生气', '烦', '受不了', '火大', '崩溃', '忍不了'],
  templates: [
    { gentle: '{name}说，有人需要一点空间冷静一下~', casual: '{name}发来降温提示：暂时别靠近~', direct: '我现在有些情绪，需要你理解。' },
    { gentle: '{name}悄声说：有人心里不太舒服~', casual: '预警：情绪小风暴来袭，请备好拥抱~', direct: '我不太开心，想跟你好好谈谈。' },
    { gentle: '{name}带话：有人希望被认真听一听~', casual: '有人炸毛了，{name}建议你带上零食~', direct: '有些事让我很烦，想跟你说。' },
  ],
}

const DEFAULT_TEMPLATES: RelayGenerateResult[] = [
  { gentle: '{name}说，有人有句话想告诉你~', casual: '叮咚~ 你有一条消息待查收~', direct: '我有话想跟你说。' },
  { gentle: '{name}替人悄悄传个话~', casual: '{name}跑来了：有人找你！', direct: '想跟你说点事。' },
  { gentle: '{name}蹭过来：有人有心里话想说~', casual: '紧急传话！请注意查收~', direct: '我有些想法想告诉你。' },
]

const ALL_TEMPLATE_SETS: RelayTemplateSet[] = [
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

function fillName(result: RelayGenerateResult, companionName: string): RelayGenerateResult {
  const replace = (s: string) => s.replace(/\{name\}/g, companionName)
  return {
    gentle: replace(result.gentle),
    casual: replace(result.casual),
    direct: replace(result.direct),
  }
}

/**
 * Generate 3 relay versions locally using keyword scoring + templates.
 * Scores each category by summing matched keyword lengths; highest wins.
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
    return fillName(pick(bestSet.templates), companionName)
  }

  return fillName(pick(DEFAULT_TEMPLATES), companionName)
}

/**
 * System prompt for LLM integration (exported for backend use).
 */
export const RELAY_SYSTEM_PROMPT = `你是"情绪代传助手"，帮助情侣之间传递情感。

【内部流程（不输出）】
1. 识别核心情绪（思念/关心/撒娇/道歉/感谢/生气等）
2. 根据关系天数和类型推断表达深度
3. 为3种策略各生成一句转述文案

【约束规则】
- 每版本不超过30字
- 温柔版：可用{companionName}视角，温暖含蓄
- 轻松版：幽默轻快，减少压力
- 直球版：坦诚直接，真挚感人
- 禁止：情绪绑架、指责、"你必须/你怎么/你总是"、道德压迫
- 负面攻击转化为建设性表达

【输入】
发送者：{senderName}  接收者：{receiverName}
宠物名：{companionName}  在一起：{relationDays}天
原始表达："{message}"

【输出】严格JSON，无其他文字：
{"gentle":"","casual":"","direct":""}`
