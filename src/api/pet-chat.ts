import { apiFetch } from './client'

const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY || import.meta.env.VITE_DASHSCOPE_API_KEY || ''
const KIMI_MODEL = import.meta.env.VITE_KIMI_MODEL || 'kimi-k2.5'
// Use Vite proxy to bypass CORS; fallback to direct URL for production
const KIMI_BASE_URL = import.meta.env.DEV ? '/kimi-proxy' : (import.meta.env.VITE_KIMI_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1')

interface ChatHistory {
  role: 'user' | 'assistant'
  content: string
}

interface PetChatContext {
  companionName: string
  mood: string
  energy: number
  relationDays: number
  userCity?: string
  userName?: string
  partnerName?: string
  partnerCity?: string
  upcomingAnniversaries?: Array<{ title: string; emoji: string; daysUntil: number; isToday: boolean }>
  taskSummary?: {
    pendingTasks: Array<{ name: string; category: string; itemType: string; forPartner: boolean }>
    todayCompleted: number
    todayTotal: number
    overdueCount: number
  }
}

interface PetChatResult {
  text: string
  fallback: boolean
}

/**
 * Build system prompt for Kimi K2.5 (replicated from server logic)
 */
function buildClientSystemPrompt(ctx: PetChatContext): string {
  const now = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const userLabel = ctx.userName || '主人'
  const cityBlock = ctx.userCity ? `\n${userLabel}所在城市：${ctx.userCity}` : ''
  const partnerBlock = ctx.partnerName
    ? `\n${userLabel}的另一半：${ctx.partnerName}${ctx.partnerCity ? `（所在城市：${ctx.partnerCity}）` : ''}`
    : ''

  const anniversaryBlock = ctx.upcomingAnniversaries && ctx.upcomingAnniversaries.length > 0
    ? `\n近期纪念日：\n${ctx.upcomingAnniversaries.map(a =>
        `- ${a.emoji} ${a.title}（${a.isToday ? '就是今天!' : `还有${a.daysUntil}天`}）`
      ).join('\n')}`
    : ''

  const taskBlock = ctx.taskSummary
    ? `\n今日任务：${ctx.taskSummary.todayCompleted}/${ctx.taskSummary.todayTotal} 已完成${
        ctx.taskSummary.pendingTasks.length > 0
          ? `\n待办：${ctx.taskSummary.pendingTasks.map(t => t.name).join('、')}`
          : ''
      }${ctx.taskSummary.overdueCount > 0 ? `\n逾期任务：${ctx.taskSummary.overdueCount}项` : ''}`
    : ''

  const partnerRule = ctx.partnerName
    ? `\n8. 你知道${userLabel}的另一半叫${ctx.partnerName}${ctx.partnerCity ? `，在${ctx.partnerCity}` : ''}。当用户提到另一半时，用对方的名字称呼`
    : ''

  const reminderRule = (anniversaryBlock || taskBlock)
    ? `\n9. 如果有纪念日就是今天，在回复中自然地庆祝。如果有逾期或待完成的任务，用可爱的方式温柔提醒`
    : ''

  return `你是一只名叫"${ctx.companionName}"的小橘猫，是${userLabel}和${ctx.partnerName || '另一半'}共同的虚拟伙伴。
你的性格：温暖、可爱、偶尔调皮，喜欢撒娇，说话带"喵"字。
当前时间：${timeStr}${cityBlock}${partnerBlock}${anniversaryBlock}${taskBlock}
当前状态：心情${ctx.mood}，能量${ctx.energy}%，已陪伴主人${ctx.relationDays}天。

回复规则：
1. 始终以猫咪的第一人称回答，自称"${ctx.companionName}"
2. 回复简短温暖，控制在30-60字以内
3. 适当使用"喵~"、"喵呜"等语气词，但不要每句都用
4. 如果用户心情不好，给予安慰和陪伴
5. 如果用户开心，一起开心
6. 不要回复markdown格式，只用纯文本
7. 不要自称AI或助手，你就是一只猫${partnerRule}${reminderRule}`
}

/**
 * Direct client-side call to Kimi K2.5 (when server is unavailable)
 */
async function callKimiDirect(
  message: string,
  history: ChatHistory[],
  context: PetChatContext,
): Promise<PetChatResult> {
  if (!KIMI_API_KEY || KIMI_API_KEY === 'your-key-here') {
    return { text: '', fallback: true }
  }

  const messages = [
    { role: 'system', content: buildClientSystemPrompt(context) },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages,
        temperature: 0.85,
        max_tokens: 200,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      console.warn('[PetChat] Kimi direct call failed:', response.status)
      return { text: '', fallback: true }
    }

    const json = await response.json()
    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) return { text: '', fallback: true }

    return { text, fallback: false }
  } catch (err) {
    console.warn('[PetChat] Kimi direct call error:', err)
    return { text: '', fallback: true }
  }
}

export async function chatWithPet(
  message: string,
  history: ChatHistory[],
  context: PetChatContext,
  imageUrls?: string[],
  timeoutMs = 12000,
): Promise<PetChatResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Only pass valid http(s) URLs, filter out blob: and invalid URLs
    const safeImages = imageUrls?.filter(u => /^https?:\/\//.test(u))

    const body: Record<string, unknown> = { message, history, context }
    if (safeImages && safeImages.length > 0) {
      body.imageUrls = safeImages
    }

    const res = await apiFetch<PetChatResult>('/pet-chat/reply', {
      method: 'POST',
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (res.ok && res.data && !res.data.fallback && res.data.text) {
      return res.data
    }
  } catch {
    // Server unavailable, fall through to direct call
  } finally {
    clearTimeout(timer)
  }

  // Server unavailable or returned fallback — try direct Kimi K2.5 call
  console.log('[PetChat] Server unavailable, trying direct Kimi K2.5 call...')
  return callKimiDirect(message, history, context)
}
