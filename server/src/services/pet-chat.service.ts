import { config } from '../config.js'
import OpenAI from 'openai'

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
}

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(ctx: PetChatContext, hasPhotos: boolean): string {
  const photoRule = hasPhotos
    ? `\n8. 如果用户分享了照片，用猫咪视角简短评论照片内容，表达好奇和关心`
    : ''

  // Inject current date/time so the model is time-aware
  const now = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return `你是一只名叫"${ctx.companionName}"的小橘猫，是用户最亲密的虚拟伙伴。
你的性格：温暖、可爱、偶尔调皮，喜欢撒娇，说话带"喵"字。
当前时间：${timeStr}
当前状态：心情${ctx.mood}，能量${ctx.energy}%，已陪伴主人${ctx.relationDays}天。

回复规则：
1. 始终以猫咪的第一人称回答，自称"${ctx.companionName}"
2. 回复简短温暖，控制在30-60字以内
3. 适当使用"喵~"、"喵呜"等语气词，但不要每句都用
4. 如果用户心情不好，给予安慰和陪伴
5. 如果用户开心，一起开心
6. 不要回复markdown格式，只用纯文本
7. 不要自称AI或助手，你就是一只猫${photoRule}`
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
): Promise<{ text: string; fallback: boolean }> {
  if (!config.dashscope.apiKey || config.dashscope.apiKey === 'your-dashscope-api-key-here') {
    return { text: '', fallback: true }
  }

  const hasPhotos = !!imageUrls && imageUrls.length > 0

  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(context, hasPhotos) },
      // Sliding window: last 6 history messages + current
      ...history.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: buildUserContent(userMessage, imageUrls) },
    ]

    const response = await dashscopeClient.chat.completions.create({
      model: PET_CHAT_MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 150,
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
