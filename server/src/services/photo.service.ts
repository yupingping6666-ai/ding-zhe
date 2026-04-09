import { pool } from '../db.js'
import { config } from '../config.js'
import path from 'path'

export async function savePhoto(data: {
  userId: string
  mode: string
  url: string
  description?: string
  relatedTaskId?: string
  tags?: string[]
}) {
  const result = await pool.query(
    `INSERT INTO photos (user_id, mode, url, description, related_task_id, tags)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.userId,
      data.mode,
      data.url,
      data.description || null,
      data.relatedTaskId || null,
      data.tags || [],
    ]
  )
  return result.rows[0]
}

export async function getPhotosForUser(userId: string, limit = 50) {
  const result = await pool.query(
    `SELECT * FROM photos WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}
