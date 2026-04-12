import { pool } from '../db.js'

export async function invitePartner(inviterId: string, targetNickname: string) {
  // Find target user
  const targetResult = await pool.query(
    'SELECT id, nickname FROM users WHERE nickname = $1',
    [targetNickname]
  )

  if (targetResult.rows.length === 0) {
    return { error: 'USER_NOT_FOUND', message: `用户 "${targetNickname}" 不存在` }
  }

  const targetUser = targetResult.rows[0]

  if (targetUser.id === inviterId) {
    return { error: 'SELF_INVITE', message: '不能邀请自己' }
  }

  // Check if either user already has a partner
  const inviterResult = await pool.query(
    'SELECT partner_id FROM users WHERE id = $1',
    [inviterId]
  )

  if (inviterResult.rows[0]?.partner_id) {
    return { error: 'ALREADY_BOUND', message: '你已经绑定了一位伙伴' }
  }

  const targetCheck = await pool.query(
    'SELECT partner_id FROM users WHERE id = $1',
    [targetUser.id]
  )

  if (targetCheck.rows[0]?.partner_id) {
    return { error: 'PARTNER_BOUND', message: `"${targetNickname}" 已经绑定了伙伴` }
  }

  // Create relationship space
  const userIds = [inviterId, targetUser.id].sort()
  const spaceResult = await pool.query(
    `INSERT INTO relationship_spaces (user_id_1, user_id_2, relation_type, companion)
     VALUES ($1, $2, 'couple', 'cat')
     RETURNING *`,
    [userIds[0], userIds[1]]
  )

  // Initialize pet state
  await pool.query(
    `INSERT INTO pet_states (space_id, mood, energy) VALUES ($1, 'content', 60)`,
    [spaceResult.rows[0].id]
  )

  // Update both users
  await pool.query(
    'UPDATE users SET partner_id = $1, mode = $2 WHERE id = $3',
    [targetUser.id, 'dual', inviterId]
  )
  await pool.query(
    'UPDATE users SET partner_id = $1, mode = $2 WHERE id = $3',
    [inviterId, 'dual', targetUser.id]
  )

  return {
    space: spaceResult.rows[0],
    partner: { id: targetUser.id, nickname: targetUser.nickname },
  }
}

export async function dissolveRelationship(userId: string) {
  // Find user's partner
  const userResult = await pool.query(
    'SELECT partner_id FROM users WHERE id = $1',
    [userId]
  )

  const partnerId = userResult.rows[0]?.partner_id
  if (!partnerId) {
    return { error: 'NO_RELATIONSHIP', message: '当前没有绑定关系' }
  }

  // Delete relationship space (pet_states + anniversaries cascade-deleted)
  await pool.query(
    `DELETE FROM relationship_spaces
     WHERE (user_id_1 = $1 AND user_id_2 = $2)
        OR (user_id_1 = $2 AND user_id_2 = $1)`,
    [userId, partnerId]
  )

  // Clear partner_id and switch both users back to single mode
  await pool.query(
    'UPDATE users SET partner_id = NULL, mode = $1 WHERE id = $2',
    ['single', userId]
  )
  await pool.query(
    'UPDATE users SET partner_id = NULL, mode = $1 WHERE id = $2',
    ['single', partnerId]
  )

  return { mode: 'single' }
}
