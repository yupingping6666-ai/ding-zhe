import { apiFetch } from './client'
import type { RelayGenerateResult } from '@/types'

const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY || ''
const KIMI_MODEL = import.meta.env.VITE_KIMI_MODEL || 'kimi-k2.5'
const KIMI_BASE_URL = import.meta.env.DEV ? '/kimi-proxy' : (import.meta.env.VITE_KIMI_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1')

interface RelayContext {
  senderName: string
  receiverName: string
  companionName: string
  relationDays: number
  relationType: string
}

export interface RelaySmartResult {
  text: string
  tone: 'gentle' | 'casual' | 'direct'
  fallback: boolean
}

function buildSmartRelayPrompt(message: string, context: RelayContext): string {
  return `你是"表达优化助手"，帮助情侣更好地表达内心感受。你同时具备温柔诗意和幽默俏皮的能力。

【核心目标】
分析用户原话的情感和语境，自动选择最合适的表达风格，用全新的方式重新表达用户想说的话。

【自动判断风格】
根据原话的情感类型自动选择最佳风格：
- gentle（温柔）：适用于深情告白、思念、感谢、离别等需要打动人心的场景
- casual（轻松）：适用于日常撒娇、调侃、小埋怨、逗趣等轻松氛围的场景
- direct（直球）：适用于道歉、严肃表态、郑重承诺等需要真诚直接的场景

【约束规则】
- 输出不超过50字
- 必须忠实传达原话的核心意思，不能丢失关键信息
- 不要用「」引号直接引用原话——用你自己的话重新说
- 可以自然融入${context.companionName}的视角（第三方传话的小动物伙伴）
- 禁止：情绪绑架、指责、道德压迫
- 如果原话含有负面攻击，转化为建设性的表达

【输入】
发送者：${context.senderName}  接收者：${context.receiverName}
宠物名：${context.companionName}  在一起：${context.relationDays}天
原始表达："${message}"

【输出】严格JSON，无其他文字：
{"tone":"gentle或casual或direct","text":"优化后的表达"}`
}

/**
 * Call Kimi directly from client for emotion relay (smart single version)
 */
async function callKimiRelay(message: string, context: RelayContext): Promise<RelaySmartResult> {
  if (!KIMI_API_KEY || KIMI_API_KEY === 'your-key-here') {
    return { text: '', tone: 'gentle', fallback: true }
  }

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'user', content: buildSmartRelayPrompt(message, context) },
        ],
        temperature: 0.85,
        max_tokens: 150,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      console.warn('[EmotionRelay] Kimi direct call failed:', response.status)
      return { text: '', tone: 'gentle', fallback: true }
    }

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content?.trim()
    if (!content) return { text: '', tone: 'gentle', fallback: true }

    // Parse JSON response
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (parsed.text && parsed.tone) {
        return { text: parsed.text, tone: parsed.tone, fallback: false }
      }
    }

    // If parsing fails, use the content as-is
    return { text: content.replace(/[{}"]/g, '').slice(0, 60), tone: 'gentle', fallback: false }
  } catch (err) {
    console.warn('[EmotionRelay] Kimi direct call error:', err)
    return { text: '', tone: 'gentle', fallback: true }
  }
}

/**
 * Generate a single AI-optimized relay message (auto-selects best tone)
 */
export async function generateSmartRelay(
  message: string,
  context: RelayContext,
  timeoutMs = 15000,
): Promise<RelaySmartResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Try server API first
    const res = await apiFetch<{ text: string; tone: string }>('/emotion-relay/generate-smart', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    })

    if (res.ok && res.data && res.data.text) {
      return { text: res.data.text, tone: (res.data.tone as RelaySmartResult['tone']) || 'gentle', fallback: false }
    }
  } catch {
    // Server unavailable
  } finally {
    clearTimeout(timer)
  }

  // Fallback: direct Kimi call
  return callKimiRelay(message, context)
}

// Keep legacy API for backwards compatibility
interface RelayApiResult {
  gentle: string
  casual: string
  direct: string
  fallback: boolean
}

export async function generateRelayVersions(
  message: string,
  context: RelayContext,
  timeoutMs = 15000,
): Promise<RelayApiResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await apiFetch<RelayGenerateResult>('/emotion-relay/generate', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    })

    if (res.ok && res.data && res.data.gentle && res.data.casual && res.data.direct) {
      return { ...res.data, fallback: false }
    }

    console.warn('[EmotionRelay] API fallback:', res.ok ? 'incomplete response' : res.error)
    return { gentle: '', casual: '', direct: '', fallback: true }
  } catch (err) {
    console.warn('[EmotionRelay] API request failed:', err)
    return { gentle: '', casual: '', direct: '', fallback: true }
  } finally {
    clearTimeout(timer)
  }
}
