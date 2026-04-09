import { pool } from '../db.js'

export async function generateNarrative(data: {
  scope: string
  userId: string
  partnerId?: string
  photoId?: string
  taskIds?: string[]
}) {
  // Placeholder: use template-based generation instead of LLM
  // This can be swapped for a real LLM call later without changing the interface

  // Fetch basic stats for context
  const statsResult = await pool.query(
    `SELECT
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE i.status IN ('completed', 'responded')) as completed_tasks,
      COUNT(*) FILTER (WHERE t.item_type = 'care') as care_tasks
     FROM task_instances i
     JOIN task_templates t ON i.template_id = t.id
     WHERE t.creator_id = $1 OR t.receiver_id = $1`,
    [data.userId]
  )

  const stats = statsResult.rows[0]

  // Simple template narrative
  const narratives = [
    `你们今天一起接住了 ${stats.completed_tasks} 件小事，其中 ${stats.care_tasks} 次是互相关心`,
    `你们之间已经传递了 ${stats.care_tasks} 次温暖，完成了 ${stats.completed_tasks} 件共同事项`,
    `今天你们的互动很温馨，一共完成了 ${stats.completed_tasks} 件事`,
    `你们的关系在慢慢升温，已经一起完成了 ${stats.completed_tasks} 件小事`,
  ]

  const content = narratives[Math.floor(Math.random() * narratives.length)]

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
