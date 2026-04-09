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
    `SELECT name, date FROM anniversaries
     WHERE space_id = (SELECT id FROM relationship_spaces WHERE user_id_1 = $1 OR user_id_2 = $1 LIMIT 1)
     AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(DAY FROM date) = EXTRACT(DAY FROM CURRENT_DATE)`,
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
  todayAnniversaries: Array<{ name: string; date: string }>
  pet: { mood: string; energy: number } | null
}): string {
  const anniversaryText =
    ctx.todayAnniversaries.length > 0
      ? `今天是个特别的日子：${ctx.todayAnniversaries.map((a) => a.name).join('、')}。`
      : ''

  const relationText =
    ctx.relationDays > 0
      ? `你们已经相伴 ${ctx.relationDays} 天了。`
      : ''

  const petText = ctx.pet
    ? `你们的小宠物现在心情是"${ctx.pet.mood}"，能量值 ${ctx.pet.energy}。`
    : ''

  const taskText = `今天完成了 ${ctx.stats.todayCompleted} 件小事，总共完成了 ${ctx.stats.completedTasks} 件，其中有 ${ctx.stats.careTasks} 次互相关心。`

  return `你是一个温暖的关系助手，负责为情侣/家人生成一段温馨的日常总结。
请根据以下信息，生成一段 30-50 字的中文总结，要有人情味、有温度，像是在讲述他们的故事：

${anniversaryText}${relationText}${taskText}${petText}

要求：
1. 如果有纪念日，优先提到纪念日
2. 提到他们完成的小事数量
3. 语气温暖、亲密、有陪伴感
4. 不要使用 KPI 式的冰冷语言
5. 可以用"今天"、"你们"这样的人称代词
6. 只输出总结内容，不要加标题、不要加引号

请直接输出总结：`
}

/**
 * Generate narrative using DashScope LLM
 * Falls back to template-based generation if API is unavailable
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
    temperature: 0.8,
    max_tokens: 150,
    top_p: 0.9,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('DashScope returned empty response')
  }

  return content.trim()
}

/**
 * Fallback template-based narrative generation
 */
function generateFallbackNarrative(stats: Record<string, number>): string {
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
}) {
  // Fetch relationship context
  const ctx = await fetchRelationshipContext(data.userId)

  let content: string

  try {
    // Try DashScope LLM generation
    const prompt = buildNarrativePrompt(ctx)
    content = await callDashScope(prompt)
  } catch (error) {
    // Fallback to template-based generation
    console.warn('[Narrative] DashScope unavailable, using fallback:', error)
    content = generateFallbackNarrative(ctx.stats)
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
