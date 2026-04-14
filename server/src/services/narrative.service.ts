import { pool } from '../db.js'
import { config } from '../config.js'
import OpenAI from 'openai'

// Initialize DashScope client (OpenAI-compatible API)
const dashscopeClient = new OpenAI({
  apiKey: config.dashscope.apiKey,
  baseURL: config.dashscope.baseUrl,
})

/**
 * Fetch relationship context for narrative generation
 */
async function fetchRelationshipContext(userId: string) {
  // Basic task stats
  const statsResult = await pool.query(
    `SELECT
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE i.status IN ('completed', 'responded')) as completed_tasks,
      COUNT(*) FILTER (WHERE t.item_type = 'care') as care_tasks,
      COUNT(*) FILTER (WHERE i.status = 'skipped') as skipped_tasks,
      COUNT(*) FILTER (WHERE i.status = 'completed' AND i.completed_at::date = CURRENT_DATE) as today_completed
     FROM task_instances i
     JOIN task_templates t ON i.template_id = t.id
     WHERE t.creator_id = $1 OR t.receiver_id = $1`,
    [userId]
  )

  const stats = statsResult.rows[0]

  // Relationship duration
  const spaceResult = await pool.query(
    `SELECT created_at, relation_type FROM relationship_spaces
     WHERE user_id_1 = $1 OR user_id_2 = $1
     LIMIT 1`,
    [userId]
  )

  const space = spaceResult.rows[0]
  const relationDays = space
    ? Math.floor((Date.now() - new Date(space.created_at).getTime()) / 86400000)
    : 0

  // Recent anniversaries
  const anniversaryResult = await pool.query(
    `SELECT title, date_mm_dd FROM anniversaries
     WHERE space_id = (SELECT id FROM relationship_spaces WHERE user_id_1 = $1 OR user_id_2 = $1 LIMIT 1)`,
    [userId]
  )

  const todayAnniversaries = anniversaryResult.rows

  // Pet state
  const petResult = await pool.query(
    `SELECT mood, energy FROM pet_states
     WHERE space_id = (SELECT id FROM relationship_spaces WHERE user_id_1 = $1 OR user_id_2 = $1 LIMIT 1)`,
    [userId]
  )

  const pet = petResult.rows[0]

  return {
    stats: {
      totalTasks: parseInt(stats.total_tasks),
      completedTasks: parseInt(stats.completed_tasks),
      careTasks: parseInt(stats.care_tasks),
      skippedTasks: parseInt(stats.skipped_tasks),
      todayCompleted: parseInt(stats.today_completed),
    },
    relationDays,
    relationType: space?.relation_type || null,
    todayAnniversaries,
    pet: pet ? { mood: pet.mood, energy: parseInt(pet.energy) } : null,
  }
}

/**
 * Build prompt for narrative generation based on context
 */
function buildNarrativePrompt(ctx: {
  stats: Record<string, number>
  relationDays: number
  relationType: string | null
  todayAnniversaries: Array<{ title: string; date_mm_dd: string }>
  pet: { mood: string; energy: number } | null
  feelings?: Array<{ content: string; mood: string; photoCount: number }>
  totalPhotos?: number
}): string {
  const anniversaryText =
    ctx.todayAnniversaries.length > 0
      ? `今天是个特别的日子：${ctx.todayAnniversaries.map((a) => a.title).join('、')}。`
      : ''

  const relationText =
    ctx.relationDays > 0
      ? `你们已经相伴 ${ctx.relationDays} 天了。`
      : ''

  const petText = ctx.pet
    ? `你们的小宠物现在心情是"${ctx.pet.mood}"，能量值 ${ctx.pet.energy}。`
    : ''

  const taskText = `今天完成了 ${ctx.stats.todayCompleted} 件小事，总共完成了 ${ctx.stats.completedTasks} 件，其中有 ${ctx.stats.careTasks} 次互相关心。`

  // Feelings context
  let feelingsText = ''
  if (ctx.feelings && ctx.feelings.length > 0) {
    const entries = ctx.feelings.slice(0, 5).map((f, i) => {
      const photoNote = f.photoCount > 0 ? `（附${f.photoCount}张照片）` : ''
      return `${i + 1}. ${f.mood} "${f.content}"${photoNote}`
    }).join('\n')
    feelingsText = `\n\n今天记录的感受：\n${entries}`
  }

  // Photo context
  let photoText = ''
  const totalPhotos = ctx.totalPhotos || (ctx.feelings || []).reduce((sum, f) => sum + f.photoCount, 0)
  if (totalPhotos > 0) {
    photoText = `\n今天共拍了 ${totalPhotos} 张照片记录生活瞬间。`
  }

  return `你是一个温暖的关系助手，负责为情侣/家人生成一段温馨的日常总结。
请根据以下信息，生成一段 50-100 字的中文总结，要有人情味、有温度，像是在讲述他们的故事：

${anniversaryText}${relationText}${taskText}${petText}${feelingsText}${photoText}

要求：
1. 如果有纪念日，优先提到纪念日
2. 结合用户记录的感受内容进行分析，提炼今天的情绪主题
3. 如果有照片记录，提及"用镜头/照片记录了..."的意象，体现用照片留住瞬间的价值
4. 语气温暖、亲密、有陪伴感
5. 不要使用 KPI 式的冰冷语言，不要罗列数据
6. 可以用"今天"、"你们"这样的人称代词
7. 第一行是标题（10字以内），第二行开始是正文
8. 只输出总结内容，不要加引号

请直接输出：`
}

/**
 * Generate narrative using DashScope LLM (text-only)
 */
async function callDashScope(prompt: string): Promise<string> {
  if (!config.dashscope.apiKey || config.dashscope.apiKey === 'your-dashscope-api-key-here') {
    throw new Error('DASHSCOPE_API_KEY not configured')
  }

  const response = await dashscopeClient.chat.completions.create({
    model: config.dashscope.model,
    messages: [
      {
        role: 'system',
        content:
          '你是一个温暖的关系助手，语气亲切、有人情味。你的任务是为用户生成一段简短温馨的日常总结。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.85,
    max_tokens: 300,
    top_p: 0.9,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('DashScope returned empty response')
  }

  return content.trim()
}

/**
 * Generate narrative using DashScope VL (vision-language) model
 * Sends actual images for visual analysis
 */
async function callDashScopeVL(
  prompt: string,
  photoUrls: string[],
  feelings: Array<{ content: string; mood: string; photoCount: number }>,
): Promise<string> {
  if (!config.dashscope.apiKey || config.dashscope.apiKey === 'your-dashscope-api-key-here') {
    throw new Error('DASHSCOPE_API_KEY not configured')
  }

  // Build multimodal content with images
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

  // Add images (limit to 4 for cost control)
  for (const url of photoUrls.slice(0, 4)) {
    contentParts.push({
      type: 'image_url',
      image_url: { url },
    })
  }

  // Build text with feelings context
  const feelingsText = feelings.map((f, i) => `${i + 1}. ${f.mood} "${f.content}"`).join('\n')

  contentParts.push({
    type: 'text',
    text: `${prompt}\n\n今天的感受记录：\n${feelingsText}\n\n请仔细观察上面的照片内容（场景、物体、人物、氛围等），结合文字记录生成叙事。`,
  })

  const response = await dashscopeClient.chat.completions.create({
    model: config.dashscope.vlModel,
    messages: [
      {
        role: 'user',
        content: contentParts as any,
      },
    ],
    temperature: 0.85,
    max_tokens: 400,
    top_p: 0.9,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('DashScope VL returned empty response')
  }

  return content.trim()
}

/**
 * Fallback template-based narrative generation
 */
function generateFallbackNarrative(
  stats: Record<string, number>,
  feelings?: Array<{ content: string; mood: string; photoCount: number }>,
  totalPhotos?: number,
): string {
  const photoCount = totalPhotos || 0
  const feelingCount = (feelings || []).length

  if (feelingCount > 0 && photoCount > 0) {
    const moods = (feelings || []).map(f => f.mood).filter(Boolean).slice(0, 3).join('')
    const narratives = [
      `今天用 ${photoCount} 张照片记录了生活 ${moods}，这些瞬间值得被珍藏`,
      `${photoCount} 张照片、${feelingCount} 条感受 ${moods}，今天的你们在认真生活`,
      `镜头定格了 ${photoCount} 个瞬间 ${moods}，每一帧都是你们的故事`,
    ]
    return narratives[Math.floor(Math.random() * narratives.length)]
  }

  if (feelingCount > 0) {
    const snippet = (feelings || [])[0]?.content.slice(0, 15) || ''
    const narratives = [
      `今天记录了 ${feelingCount} 条感受，「${snippet}…」这样的时刻值得回味`,
      `${feelingCount} 条真实的记录，你们正在用文字编织属于自己的故事`,
    ]
    return narratives[Math.floor(Math.random() * narratives.length)]
  }

  const narratives = [
    `你们今天一起接住了 ${stats.completedTasks} 件小事，其中 ${stats.careTasks} 次是互相关心`,
    `你们之间已经传递了 ${stats.careTasks} 次温暖，完成了 ${stats.completedTasks} 件共同事项`,
    `今天你们的互动很温馨，一共完成了 ${stats.completedTasks} 件事`,
    `你们的关系在慢慢升温，已经一起完成了 ${stats.completedTasks} 件小事`,
  ]
  return narratives[Math.floor(Math.random() * narratives.length)]
}

export async function generateNarrative(data: {
  scope: string
  userId: string
  partnerId?: string
  photoId?: string
  taskIds?: string[]
  feelings?: Array<{ content: string; mood: string; photoCount: number }>
  photoUrls?: string[]
}) {
  // Fetch relationship context
  const ctx = await fetchRelationshipContext(data.userId)

  let content: string
  const photoUrls = data.photoUrls || []
  const feelings = data.feelings || []

  try {
    // If photos with remote URLs exist, use VL model for image analysis
    const remotePhotos = photoUrls.filter(url => url.startsWith('http'))
    if (remotePhotos.length > 0 && feelings.length > 0) {
      const totalPhotos = remotePhotos.length
      const prompt = buildNarrativePrompt({
        ...ctx,
        feelings,
        totalPhotos,
      })
      content = await callDashScopeVL(prompt, remotePhotos, feelings)
    } else {
      // Text-only generation
      const totalPhotos = photoUrls.length
      const prompt = buildNarrativePrompt({
        ...ctx,
        feelings,
        totalPhotos,
      })
      content = await callDashScope(prompt)
    }
  } catch (error) {
    // Fallback to template-based generation
    console.warn('[Narrative] DashScope unavailable, using fallback:', error)
    content = generateFallbackNarrative(ctx.stats, feelings, photoUrls.length)
  }

  // Store in database
  const result = await pool.query(
    `INSERT INTO narratives (scope, user_id, partner_id, photo_id, task_ids, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.scope,
      data.userId,
      data.partnerId || null,
      data.photoId || null,
      data.taskIds || [],
      content,
    ]
  )

  return result.rows[0]
}
