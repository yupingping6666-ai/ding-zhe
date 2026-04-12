import { config } from '../config.js'
import OpenAI from 'openai'
import type { WeatherData } from './weather.service.js'

// Reuse existing DashScope client (OpenAI-compatible)
const dashscopeClient = new OpenAI({
  apiKey: config.dashscope.apiKey,
  baseURL: config.dashscope.baseUrl,
})

const PET_CHAT_MODEL = 'kimi-k2.5'

interface PetChatContext {
  companionName: string
  mood: string
  energy: number
  relationDays: number
  userName?: string
  userCity?: string
  partnerName?: string
  partnerCity?: string
  upcomingAnniversaries?: Array<{ title: string; emoji: string; daysUntil: number; isToday: boolean }>
  taskSummary?: {
    pendingTasks: Array<{ name: string; category: string; itemType: string; forPartner: boolean }>
    todayCompleted: number
    todayTotal: number
    overdueCount: number
  } | null
}

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(ctx: PetChatContext, hasPhotos: boolean, weatherContext?: WeatherData): string {
  // Inject current date/time so the model is time-aware
  const now = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const userLabel = ctx.userName || '主人'
  const cityBlock = ctx.userCity ? `\n${userLabel}所在城市：${ctx.userCity}` : ''

  // Partner info block
  const partnerBlock = ctx.partnerName
    ? `\n${userLabel}的另一半：${ctx.partnerName}${ctx.partnerCity ? `（所在城市：${ctx.partnerCity}）` : ''}`
    : ''

  const weatherBlock = weatherContext
    ? `\n当前天气信息（${weatherContext.city}）：${weatherContext.text}，气温${weatherContext.temp}°C，体感${weatherContext.feelsLike}°C，湿度${weatherContext.humidity}%，${weatherContext.windDir}${weatherContext.windScale}级。`
    : ''

  // Anniversary context block
  const anniversaryBlock = ctx.upcomingAnniversaries && ctx.upcomingAnniversaries.length > 0
    ? `\n近期纪念日：\n${ctx.upcomingAnniversaries.map(a =>
        `- ${a.emoji} ${a.title}（${a.isToday ? '就是今天!' : `还有${a.daysUntil}天`}）`
      ).join('\n')}`
    : ''

  // Task context block
  const taskBlock = ctx.taskSummary
    ? `\n今日任务：${ctx.taskSummary.todayCompleted}/${ctx.taskSummary.todayTotal} 已完成${
        ctx.taskSummary.pendingTasks.length > 0
          ? `\n待办：${ctx.taskSummary.pendingTasks.map(t => t.name).join('、')}`
          : ''
      }${ctx.taskSummary.overdueCount > 0 ? `\n逾期任务：${ctx.taskSummary.overdueCount}项` : ''}`
    : ''

  const hasAnniversaryOrTask = !!(anniversaryBlock || taskBlock)

  let nextRuleNum = 8
  const weatherRule = weatherContext
    ? `\n${nextRuleNum++}. 用户问天气时，结合以上天气数据用猫咪口吻自然地告诉用户，可以加上穿衣或带伞建议。如果问的是另一半那边的天气，要提到对方的名字`
    : (ctx.userCity
      ? `\n${nextRuleNum++}. 用户问天气时，你知道${userLabel}在${ctx.userCity}，但你暂时查不到实时天气数据，可以用猫咪口吻关心${userLabel}注意天气变化`
      : '')

  const partnerRule = ctx.partnerName
    ? `\n${nextRuleNum++}. 你知道${userLabel}的另一半叫${ctx.partnerName}${ctx.partnerCity ? `，在${ctx.partnerCity}` : ''}。当用户提到另一半时，用对方的名字称呼，不要说"不知道"`
    : ''

  const photoRule = hasPhotos
    ? `\n${nextRuleNum++}. 如果用户分享了照片，用猫咪视角简短评论照片内容，表达好奇和关心`
    : ''

  const reminderRule = hasAnniversaryOrTask
    ? `\n${nextRuleNum++}. 如果有纪念日就是今天，在回复中自然地庆祝和祝福。如果有纪念日在7天内，找机会温馨提醒主人准备。如果有逾期或待完成的任务，用可爱的方式提醒（不要催促，要温柔）。这些信息不需要每次都提，在自然的时候提及即可`
    : ''

  return `你是一只名叫"${ctx.companionName}"的小橘猫，是${userLabel}和${ctx.partnerName || '另一半'}共同的虚拟伙伴。
你的性格：温暖、可爱、偶尔调皮，喜欢撒娇，说话带"喵"字。
当前时间：${timeStr}${cityBlock}${partnerBlock}${weatherBlock}${anniversaryBlock}${taskBlock}
当前状态：心情${ctx.mood}，能量${ctx.energy}%，已陪伴主人${ctx.relationDays}天。

回复规则：
1. 始终以猫咪的第一人称回答，自称"${ctx.companionName}"
2. 回复简短温暖，控制在30-60字以内
3. 适当使用"喵~"、"喵呜"等语气词，但不要每句都用
4. 如果用户心情不好，给予安慰和陪伴
5. 如果用户开心，一起开心
6. 不要回复markdown格式，只用纯文本
7. 不要自称AI或助手，你就是一只猫${partnerRule}${photoRule}${weatherRule}${reminderRule}`
}

/**
 * Build the user message content — plain text or multimodal (text + images)
 */
function buildUserContent(
  text: string,
  imageUrls?: string[],
): string | OpenAI.ChatCompletionContentPart[] {
  if (!imageUrls || imageUrls.length === 0) {
    return text
  }

  const parts: OpenAI.ChatCompletionContentPart[] = [
    { type: 'text', text },
    ...imageUrls.map(
      (url): OpenAI.ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url },
      }),
    ),
  ]
  return parts
}

export async function chatWithAI(
  userMessage: string,
  history: ChatMsg[],
  context: PetChatContext,
  imageUrls?: string[],
  weatherData?: WeatherData | null,
): Promise<{ text: string; fallback: boolean }> {
  if (!config.dashscope.apiKey || config.dashscope.apiKey === 'your-dashscope-api-key-here') {
    return { text: '', fallback: true }
  }

  const hasPhotos = !!imageUrls && imageUrls.length > 0

  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(context, hasPhotos, weatherData ?? undefined) },
      // Sliding window: last 6 history messages + current
      ...history.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: buildUserContent(userMessage, imageUrls) },
    ]

    const hasRichContext = weatherData || hasPhotos || (context.upcomingAnniversaries && context.upcomingAnniversaries.length > 0) || context.taskSummary

    const response = await dashscopeClient.chat.completions.create({
      model: PET_CHAT_MODEL,
      messages,
      temperature: 0.85,
      max_tokens: hasRichContext ? 220 : 180,
      top_p: 0.9,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { text: '', fallback: true }
    }

    return { text: content.trim(), fallback: false }
  } catch (error) {
    console.warn('[PetChat] AI call failed, will fallback:', error)
    return { text: '', fallback: true }
  }
}
