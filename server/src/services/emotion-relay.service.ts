import { config } from '../config.js'
import OpenAI from 'openai'

const dashscopeClient = new OpenAI({
  apiKey: config.dashscope.apiKey,
  baseURL: config.dashscope.baseUrl,
})

const RELAY_MODEL = 'kimi-k2.5'

interface RelayContext {
  senderName: string
  receiverName: string
  companionName: string
  relationDays: number
  relationType: string
}

interface RelayResult {
  gentle: string
  casual: string
  direct: string
  fallback: boolean
}

function buildSystemPrompt(ctx: RelayContext): string {
  return `你是"情绪代传助手"，帮助情侣之间传递情感。你是一只叫"${ctx.companionName}"的宠物，负责帮主人把心里话转述给对方。

【你的任务】
分析用户的原始表达，理解其核心情感和意图，然后用3种不同风格重新表述。

【关键】你必须准确理解用户的意图：
- "我想和他说对不起" = 用户想道歉
- "我愿意原谅她了" = 用户想表达原谅/和好
- "我想他了" = 用户在思念对方
- 注意区分"道歉"和"原谅"，它们是相反的立场

【3种表达风格】
- gentle（温柔版）：可用${ctx.companionName}视角，温暖含蓄，不超过30字
- casual（轻松版）：幽默轻快，减少压力，不超过30字
- direct（直球版）：坦诚直接，真挚感人，不超过30字

【约束规则】
- 转述必须忠实反映用户的原意，不能改变情感方向
- 禁止：情绪绑架、指责、"你必须/你怎么/你总是"、道德压迫
- 负面攻击转化为建设性表达

【关系信息】
发送者：${ctx.senderName}  接收者：${ctx.receiverName}
宠物名：${ctx.companionName}  在一起：${ctx.relationDays}天
关系类型：${ctx.relationType}

【输出格式】严格JSON，无其他文字：
{"gentle":"","casual":"","direct":""}`
}

export async function generateRelayWithAI(
  message: string,
  context: RelayContext,
): Promise<RelayResult> {
  if (!config.dashscope.apiKey || config.dashscope.apiKey === 'your-dashscope-api-key-here') {
    return { gentle: '', casual: '', direct: '', fallback: true }
  }

  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(context) },
      { role: 'user', content: `请帮我转述这句话："${message}"` },
    ]

    const response = await dashscopeClient.chat.completions.create({
      model: RELAY_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 200,
      top_p: 0.9,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { gentle: '', casual: '', direct: '', fallback: true }
    }

    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[EmotionRelay] Failed to parse JSON from:', content)
      return { gentle: '', casual: '', direct: '', fallback: true }
    }

    const parsed = JSON.parse(jsonMatch[0])
    if (parsed.gentle && parsed.casual && parsed.direct) {
      return { ...parsed, fallback: false }
    }

    return { gentle: '', casual: '', direct: '', fallback: true }
  } catch (error) {
    console.warn('[EmotionRelay] AI call failed:', error)
    return { gentle: '', casual: '', direct: '', fallback: true }
  }
}
