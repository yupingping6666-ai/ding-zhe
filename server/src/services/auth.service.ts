import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

// ===== Phone auth helpers =====

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
}

function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

function generateCode(): string {
  if (config.sms.mockCode) return config.sms.mockCode
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function verifyCode(phone: string, code: string, purpose: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE verification_codes SET used = true
     WHERE phone = $1 AND code = $2 AND purpose = $3 AND used = false AND expires_at > NOW()
     RETURNING id`,
    [phone, code, purpose]
  )
  return result.rowCount! > 0
}

// ===== Phone auth public API =====

export async function sendVerificationCode(phone: string, purpose: 'register' | 'reset_password') {
  if (!validatePhone(phone)) {
    return { ok: false, code: 'INVALID_PHONE', message: '手机号格式不正确' }
  }

  const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phone])
  const userExists = userResult.rows.length > 0

  if (purpose === 'register' && userExists) {
    return { ok: false, code: 'PHONE_EXISTS', message: '该手机号已注册' }
  }
  if (purpose === 'reset_password' && !userExists) {
    return { ok: false, code: 'PHONE_NOT_FOUND', message: '该手机号未注册' }
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + config.sms.codeExpiry * 1000)

  await pool.query(
    'INSERT INTO verification_codes (phone, code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
    [phone, code, purpose, expiresAt]
  )

  console.log(`[SMS] Verification code for ${phone}: ${code}`)
  return { ok: true }
}

export async function registerWithPhone(phone: string, code: string, password: string) {
  if (!validatePhone(phone)) {
    return { ok: false, code: 'INVALID_PHONE', message: '手机号格式不正确' }
  }
  if (!password || password.length < 6) {
    return { ok: false, code: 'WEAK_PASSWORD', message: '密码至少6位' }
  }

  const valid = await verifyCode(phone, code, 'register')
  if (!valid) {
    return { ok: false, code: 'INVALID_CODE', message: '验证码无效或已过期' }
  }

  const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone])
  if (existing.rows.length > 0) {
    return { ok: false, code: 'PHONE_EXISTS', message: '该手机号已注册' }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const suffix = phone.slice(-4)
  const nickname = `用户_${suffix}`

  const insertResult = await pool.query(
    `INSERT INTO users (phone, password_hash, nickname, avatar, mode, onboarded)
     VALUES ($1, $2, $3, '😀', 'single', false)
     RETURNING id, nickname, avatar, mode, partner_id, onboarded, created_at`,
    [phone, passwordHash, nickname]
  )

  const user = insertResult.rows[0]
  const token = signToken(user.id)
  return { ok: true, data: { token, user } }
}

export async function loginWithPhone(phone: string, password: string) {
  if (!phone || !password) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: '手机号或密码错误' }
  }

  const result = await pool.query(
    'SELECT id, nickname, avatar, mode, partner_id, onboarded, created_at, password_hash FROM users WHERE phone = $1',
    [phone]
  )

  if (result.rows.length === 0) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: '手机号或密码错误' }
  }

  const user = result.rows[0]
  if (!user.password_hash) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: '手机号或密码错误' }
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: '手机号或密码错误' }
  }

  const token = signToken(user.id)
  const { password_hash: _, ...safeUser } = user
  return { ok: true, data: { token, user: safeUser } }
}

export async function resetPassword(phone: string, code: string, newPassword: string) {
  if (!validatePhone(phone)) {
    return { ok: false, code: 'INVALID_PHONE', message: '手机号格式不正确' }
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, code: 'WEAK_PASSWORD', message: '密码至少6位' }
  }

  const valid = await verifyCode(phone, code, 'reset_password')
  if (!valid) {
    return { ok: false, code: 'INVALID_CODE', message: '验证码无效或已过期' }
  }

  const userResult = await pool.query(
    'SELECT id, nickname, avatar, mode, partner_id, onboarded, created_at FROM users WHERE phone = $1',
    [phone]
  )
  if (userResult.rows.length === 0) {
    return { ok: false, code: 'PHONE_NOT_FOUND', message: '该手机号未注册' }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE users SET password_hash = $1 WHERE phone = $2', [passwordHash, phone])

  const user = userResult.rows[0]
  const token = signToken(user.id)
  return { ok: true, data: { token, user } }
}
