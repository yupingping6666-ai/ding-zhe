import { pool } from '../db.js'

export async function getTasksForUser(userId: string) {
  const result = await pool.query(
    `SELECT
      t.id, t.creator_id, t.receiver_id, t.name, t.category, t.remind_time,
      t.repeat_rule, t.weekly_days, t.follow_up_intensity, t.is_active,
      t.item_type, t.note, t.created_at as template_created_at,
      i.id as instance_id, i.scheduled_at, i.status, i.follow_up_count,
      i.max_follow_ups, i.follow_up_interval, i.next_follow_up_at,
      i.deferred_since, i.completed_at, i.skipped_at, i.expired_at,
      i.relation_status, i.feedback, i.action_log, i.created_at as instance_created_at
     FROM task_templates t
     LEFT JOIN task_instances i ON t.id = i.template_id
     WHERE t.creator_id = $1 OR t.receiver_id = $1
     ORDER BY i.scheduled_at DESC NULLS LAST`,
    [userId]
  )

  // Group instances by template
  const templates: Record<string, any> = {}
  for (const row of result.rows) {
    if (!templates[row.id]) {
      templates[row.id] = {
        id: row.id,
        creatorId: row.creator_id,
        receiverId: row.receiver_id,
        name: row.name,
        category: row.category,
        remindTime: row.remind_time,
        repeatRule: row.repeat_rule,
        weeklyDays: row.weekly_days,
        followUpIntensity: row.follow_up_intensity,
        isActive: row.is_active,
        itemType: row.item_type,
        note: row.note,
        createdAt: row.template_created_at,
        instances: [],
      }
    }
    if (row.instance_id) {
      templates[row.id].instances.push({
        id: row.instance_id,
        templateId: row.id,
        scheduledTime: row.scheduled_at,
        status: row.status,
        followUpCount: row.follow_up_count,
        maxFollowUps: row.max_follow_ups,
        followUpInterval: row.follow_up_interval,
        nextFollowUpAt: row.next_follow_up_at,
        deferredSince: row.deferred_since,
        completedAt: row.completed_at,
        skippedAt: row.skipped_at,
        expiredAt: row.expired_at,
        relationStatus: row.relation_status,
        feedback: row.feedback,
        actionLog: row.action_log,
      })
    }
  }

  return Object.values(templates)
}

export async function createTask(data: {
  creatorId: string
  receiverId: string
  name: string
  category: string
  remindTime: string
  repeatRule: string
  weeklyDays: number[]
  followUpIntensity: string
  itemType: string
  note: string
  scheduledAt: Date
}) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Create template
    const templateResult = await client.query(
      `INSERT INTO task_templates
       (creator_id, receiver_id, name, category, remind_time, repeat_rule,
        weekly_days, follow_up_intensity, item_type, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.creatorId, data.receiverId, data.name, data.category,
        data.remindTime, data.repeatRule, data.weeklyDays,
        data.followUpIntensity, data.itemType, data.note,
      ]
    )

    const template = templateResult.rows[0]

    // Calculate max follow-ups and interval based on intensity
    const intensityConfig: Record<string, { maxFollowUps: number; interval: number }> = {
      light: { maxFollowUps: 2, interval: 30 },
      standard: { maxFollowUps: 3, interval: 10 },
      strong: { maxFollowUps: 5, interval: 5 },
    }
    const intensity = intensityConfig[data.followUpIntensity] || intensityConfig.standard

    // Create instance
    const instanceResult = await client.query(
      `INSERT INTO task_instances
       (template_id, scheduled_at, status, max_follow_ups, follow_up_interval, relation_status)
       VALUES ($1, $2, 'pending', $3, $4, 'sent')
       RETURNING *`,
      [template.id, data.scheduledAt, intensity.maxFollowUps, intensity.interval]
    )

    const instance = instanceResult.rows[0]

    await client.query('COMMIT')
    return { template, instance }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateInstanceStatus(
  instanceId: string,
  status: string,
  feedback?: string
) {
  const now = Date.now()
  const updates: Record<string, any> = { status }
  const setClauses: string[] = ['status = $1']
  const values: any[] = [status]
  let paramIndex = 2

  // Add status-specific fields
  if (status === 'completed') {
    setClauses.push(`completed_at = $${paramIndex}`)
    values.push(new Date(now))
    paramIndex++
    setClauses.push(`relation_status = 'responded'`)
  } else if (status === 'skipped') {
    setClauses.push(`skipped_at = $${paramIndex}`)
    values.push(new Date(now))
    paramIndex++
    setClauses.push(`relation_status = 'responded'`)
  } else if (status === 'deferred') {
    setClauses.push(`deferred_since = $${paramIndex}`)
    values.push(new Date(now))
    paramIndex++
  }

  if (feedback) {
    setClauses.push(`feedback = $${paramIndex}`)
    values.push(feedback)
    paramIndex++
  }

  // Add instance ID
  setClauses.push(`updated_at = $${paramIndex}`)
  values.push(new Date(now))
  paramIndex++
  values.push(instanceId)

  // Append action log
  const actionNote = feedback || status
  const actionEntry = JSON.stringify({
    timestamp: now,
    action: status === 'completed' ? 'user_completed' : status === 'skipped' ? 'user_skipped' : status === 'deferred' ? 'user_deferred' : status,
    note: actionNote,
  })

  setClauses.unshift(`action_log = action_log || $${paramIndex + 1}::jsonb`)
  values.push(actionEntry, instanceId)

  const query = `UPDATE task_instances SET ${setClauses.join(', ')} WHERE id = $${paramIndex + 2} RETURNING *`

  // Simplified: use positional params
  const result = await pool.query(
    `UPDATE task_instances
     SET status = $1, updated_at = NOW(),
         completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
         skipped_at = CASE WHEN $1 = 'skipped' THEN NOW() ELSE skipped_at END,
         deferred_since = CASE WHEN $1 = 'deferred' THEN NOW() ELSE deferred_since END,
         relation_status = CASE WHEN $1 IN ('completed', 'skipped') THEN 'responded' ELSE relation_status END,
         feedback = COALESCE($2, feedback),
         action_log = action_log || jsonb_build_object(
           'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000,
           'action', CASE
             WHEN $1 = 'completed' THEN 'user_completed'
             WHEN $1 = 'skipped' THEN 'user_skipped'
             WHEN $1 = 'deferred' THEN 'user_deferred'
             ELSE $1::text
           END,
           'note', COALESCE($2, $1::text)
         )
     WHERE id = $3
     RETURNING *`,
    [status, feedback, instanceId]
  )

  return result.rows[0]
}

export async function getTaskById(instanceId: string) {
  const result = await pool.query(
    `SELECT
      i.*, t.name, t.category, t.item_type, t.note, t.creator_id, t.receiver_id,
      t.remind_time, t.repeat_rule, t.follow_up_intensity
     FROM task_instances i
     JOIN task_templates t ON i.template_id = t.id
     WHERE i.id = $1`,
    [instanceId]
  )
  return result.rows[0] || null
}
