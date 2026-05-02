/**
 * Vision-based narrative generation
 * Calls Kimi K2.5 model directly from client to analyze images
 */

import type { FeelingEntry } from '@/types'

const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY || import.meta.env.VITE_DASHSCOPE_API_KEY || ''
const KIMI_MODEL = import.meta.env.VITE_KIMI_MODEL || import.meta.env.VITE_DASHSCOPE_VL_MODEL || 'kimi-k2.5'
// Use Vite proxy to bypass CORS; fallback to direct URL for production
const KIMI_BASE_URL = import.meta.env.DEV ? '/kimi-proxy' : (import.meta.env.VITE_KIMI_BASE_URL || import.meta.env.VITE_DASHSCOPE_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1')

/**
 * Convert a blob/object URL to base64 data URL
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string | null> {
  try {
    const response = await fetch(blobUrl)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Check if vision API is available (API key configured)
 */
export function isVisionAvailable(): boolean {
  return KIMI_API_KEY.length > 0 && KIMI_API_KEY !== 'your-key-here'
}

interface VisionNarrativeResult {
  title: string
  bodyText: string
  petSummary: string
}

/**
 * Generate narrative by sending images + feelings to Kimi K2.5 model
 */
export async function generateVisionNarrative(
  feelings: FeelingEntry[],
  photoUrls: string[],
  companionName: string,
  companionAvatar: string,
  isDual: boolean,
): Promise<VisionNarrativeResult | null> {
  if (!isVisionAvailable() || photoUrls.length === 0) return null

  // Convert blob/object URLs to base64 (limit to 4 images to control token cost)
  const imagePromises = photoUrls.slice(0, 4).map(url => blobUrlToBase64(url))
  const base64Images = (await Promise.all(imagePromises)).filter((img): img is string => img !== null)

  if (base64Images.length === 0) return null

  // Build multimodal message content
  const feelingsText = feelings.map((f, i) => `${i + 1}. ${f.mood} "${f.content}"`).join('\n')
  const modeText = isDual ? '情侣/家人' : '个人'

  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

  // Add images first
  for (const base64 of base64Images) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: base64 },
    })
  }

  // Add text prompt
  contentParts.push({
    type: 'text',
    text: `你是一个温暖的${modeText}关系助手"${companionName}"。请根据上面的照片和下面的文字记录，生成一段关于"这一天的意义"的温馨总结。

今天的感受记录：
${feelingsText}

要求：
1. 仔细观察照片内容（场景、物体、氛围、颜色等），将照片中看到的具体内容融入叙述
2. 结合文字记录的情绪和内容，提炼今天的主题
3. 语气温暖、真诚，像在讲述一个温馨的故事
4. 不要说"照片中"这样生硬的描述，而是自然地把画面内容编织进叙事

请严格按以下格式输出（不要加引号或其他标记）：
标题：（10字以内，概括今天的意义）
正文：（80-150字，结合照片画面和感受内容，讲述这一天的故事）
寄语：（20-30字，${companionName}对${isDual ? '你们' : '你'}说的一句话）`,
  })

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
          {
            role: 'user',
            content: contentParts,
          },
        ],
        temperature: 0.85,
        max_tokens: 400,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      console.warn('[VisionNarrative] API error:', response.status)
      return null
    }

    const json = await response.json()
    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) return null

    // Parse structured output
    return parseVisionResponse(text, companionName, companionAvatar)
  } catch (error) {
    console.warn('[VisionNarrative] Request failed:', error)
    return null
  }
}

/**
 * Parse the VL model's response into structured narrative parts
 */
function parseVisionResponse(
  text: string,
  _companionName: string,
  _companionAvatar: string,
): VisionNarrativeResult {
  const lines = text.split('\n').filter(l => l.trim())

  let title = ''
  let bodyText = ''
  let petWords = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('标题：') || trimmed.startsWith('标题:')) {
      title = trimmed.replace(/^标题[：:]/, '').trim()
    } else if (trimmed.startsWith('正文：') || trimmed.startsWith('正文:')) {
      bodyText = trimmed.replace(/^正文[：:]/, '').trim()
    } else if (trimmed.startsWith('寄语：') || trimmed.startsWith('寄语:')) {
      petWords = trimmed.replace(/^寄语[：:]/, '').trim()
    } else if (!title) {
      // First line might be title without prefix
      title = trimmed
    } else if (!bodyText) {
      bodyText += (bodyText ? '\n' : '') + trimmed
    }
  }

  // Fallback: if parsing fails, use the whole text
  if (!title && !bodyText) {
    const firstLine = lines[0] || '今天的故事'
    title = firstLine.length <= 15 ? firstLine : firstLine.slice(0, 10)
    bodyText = lines.slice(1).join('\n') || text
  }

  const petSummary = petWords || '陪你们记录了这一天'

  return { title, bodyText, petSummary }
}
