import { pool } from '../db.js'

function mapAnniversary(row: any) {
  return {
    id: row.id,
    title: row.title,
    date: row.date_mm_dd,
    year: row.start_year,
    emoji: row.emoji,
    isRecurring: row.is_recurring,
    isPrimary: row.is_primary ?? false,
  }
}

function mapPetState(row: any) {
  return {
    mood: row.mood,
    energy: parseInt(row.energy),
    lastFed: row.last_fed ? new Date(row.last_fed).getTime() : null,
    lastPetted: row.last_petted ? new Date(row.last_petted).getTime() : null,
    todayInteractions: parseInt(row.today_interactions),
    interactionDate: row.interaction_date ? row.interaction_date.toISOString().split('T')[0] : null,
  }
}

async function getUserSpaceId(userId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT id FROM relationship_spaces WHERE user_id_1 = $1 OR user_id_2 = $1 LIMIT 1`,
    [userId]
  )
  return result.rows[0]?.id || null
}

export async function getMySpace(userId: string) {
  const spaceResult = await pool.query(
    `SELECT rs.*, ps.mood, ps.energy, ps.last_fed, ps.last_petted,
            ps.today_interactions, ps.interaction_date
     FROM relationship_spaces rs
     LEFT JOIN pet_states ps ON rs.id = ps.space_id
     WHERE rs.user_id_1 = $1 OR rs.user_id_2 = $1
     LIMIT 1`,
    [userId]
  )

  if (!spaceResult.rows[0]) {
    return null
  }

  const space = spaceResult.rows[0]

  const anniversariesResult = await pool.query(
    `SELECT * FROM anniversaries WHERE space_id = $1 ORDER BY date_mm_dd`,
    [space.id]
  )

  const anniversaries = anniversariesResult.rows.map(mapAnniversary)

  return {
    id: space.id,
    companion: space.companion,
    relationType: space.relation_type,
    createdAt: new Date(space.created_at).getTime(),
    petState: mapPetState(space),
    anniversaries,
  }
}

export async function updateCompanion(userId: string, companion: string) {
  const spaceId = await getUserSpaceId(userId)
  if (!spaceId) {
    throw new Error('Space not found')
  }

  const result = await pool.query(
    `UPDATE relationship_spaces SET companion = $1 WHERE id = $2 RETURNING companion`,
    [companion, spaceId]
  )

  return result.rows[0].companion
}

export async function getAnniversaries(userId: string) {
  const spaceId = await getUserSpaceId(userId)
  if (!spaceId) {
    return []
  }

  const result = await pool.query(
    `SELECT * FROM anniversaries WHERE space_id = $1 ORDER BY date_mm_dd`,
    [spaceId]
  )

  return result.rows.map(mapAnniversary)
}

export async function createAnniversary(
  userId: string,
  data: { title: string; date_mm_dd: string; start_year?: number; emoji: string; is_recurring: boolean; is_primary?: boolean }
) {
  const spaceId = await getUserSpaceId(userId)
  if (!spaceId) {
    throw new Error('Space not found')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (data.is_primary) {
      await client.query(
        `UPDATE anniversaries SET is_primary = FALSE WHERE space_id = $1 AND is_primary = TRUE`,
        [spaceId]
      )
    }
    const result = await client.query(
      `INSERT INTO anniversaries (space_id, title, date_mm_dd, start_year, emoji, is_recurring, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [spaceId, data.title, data.date_mm_dd, data.start_year || null, data.emoji, data.is_recurring, data.is_primary || false]
    )
    await client.query('COMMIT')
    return mapAnniversary(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateAnniversary(
  id: string,
  userId: string,
  patch: { title?: string; date_mm_dd?: string; start_year?: number; emoji?: string; is_recurring?: boolean; is_primary?: boolean }
) {
  const spaceId = await getUserSpaceId(userId)
  if (!spaceId) {
    throw new Error('Space not found')
  }

  const fields: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (patch.title !== undefined) {
    fields.push(`title = $${paramCount++}`)
    values.push(patch.title)
  }
  if (patch.date_mm_dd !== undefined) {
    fields.push(`date_mm_dd = $${paramCount++}`)
    values.push(patch.date_mm_dd)
  }
  if (patch.start_year !== undefined) {
    fields.push(`start_year = $${paramCount++}`)
    values.push(patch.start_year)
  }
  if (patch.emoji !== undefined) {
    fields.push(`emoji = $${paramCount++}`)
    values.push(patch.emoji)
  }
  if (patch.is_recurring !== undefined) {
    fields.push(`is_recurring = $${paramCount++}`)
    values.push(patch.is_recurring)
  }
  if (patch.is_primary !== undefined) {
    fields.push(`is_primary = $${paramCount++}`)
    values.push(patch.is_primary)
  }

  if (fields.length === 0) {
    throw new Error('No fields to update')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (patch.is_primary) {
      await client.query(
        `UPDATE anniversaries SET is_primary = FALSE WHERE space_id = $1 AND is_primary = TRUE`,
        [spaceId]
      )
    }
    values.push(id, spaceId)
    const query = `UPDATE anniversaries SET ${fields.join(', ')} WHERE id = $${paramCount} AND space_id = $${paramCount + 1} RETURNING *`
    const result = await client.query(query, values)
    if (!result.rows[0]) {
      throw new Error('Anniversary not found or access denied')
    }
    await client.query('COMMIT')
    return mapAnniversary(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteAnniversary(id: string, userId: string) {
  const spaceId = await getUserSpaceId(userId)
  if (!spaceId) {
    throw new Error('Space not found')
  }

  const result = await pool.query(
    `DELETE FROM anniversaries WHERE id = $1 AND space_id = $2 RETURNING id`,
    [id, spaceId]
  )

  if (!result.rows[0]) {
    throw new Error('Anniversary not found or access denied')
  }

  return { id }
}

export async function petInteract(userId: string, type: 'pet' | 'feed') {
  const spaceId = await getUserSpaceId(userId)
  if (!spaceId) {
    throw new Error('Space not found')
  }

  const updateField = type === 'feed' ? 'last_fed' : 'last_petted'

  const result = await pool.query(
    `UPDATE pet_states
     SET ${updateField} = NOW(),
         today_interactions = CASE
           WHEN interaction_date = CURRENT_DATE THEN today_interactions + 1
           ELSE 1
         END,
         interaction_date = CURRENT_DATE,
         last_updated = NOW()
     WHERE space_id = $1
     RETURNING *`,
    [spaceId]
  )

  if (!result.rows[0]) {
    throw new Error('Pet state not found')
  }

  return mapPetState(result.rows[0])
}
