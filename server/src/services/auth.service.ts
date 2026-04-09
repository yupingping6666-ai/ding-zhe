import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { config } from '../config.js'

export async function login(nickname: string) {
  // Find user by nickname
  const result = await pool.query(
    'SELECT id, nickname, avatar, mode, partner_id, onboarded, created_at FROM users WHERE nickname = $1',
    [nickname]
  )

  let user = result.rows[0]

  // Auto-create user if not found (demo mode)
  if (!user) {
    const insertResult = await pool.query(
      `INSERT INTO users (nickname, avatar, mode, onboarded)
       VALUES ($1, '😀', 'single', false)
       RETURNING id, nickname, avatar, mode, partner_id, onboarded, created_at`,
      [nickname]
    )
    user = insertResult.rows[0]
  }

  // Generate JWT
  const token = jwt.sign(
    { sub: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )

  return { token, user }
}

export async function getUserProfile(userId: string) {
  const result = await pool.query(
    `SELECT u.id, u.nickname, u.avatar, u.mode, u.partner_id, u.onboarded, u.created_at,
            p.id as partner_id_detail, p.nickname as partner_nickname, p.avatar as partner_avatar
     FROM users u
     LEFT JOIN users p ON u.partner_id = p.id
     WHERE u.id = $1`,
    [userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    nickname: row.nickname,
    avatar: row.avatar,
    mode: row.mode,
    partnerId: row.partner_id,
    onboarded: row.onboarded,
    createdAt: row.created_at,
    partner: row.partner_id_detail
      ? {
          id: row.partner_id_detail,
          nickname: row.partner_nickname,
          avatar: row.partner_avatar,
        }
      : null,
  }
}
