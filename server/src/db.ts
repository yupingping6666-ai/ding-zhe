import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
})

export async function testConnection() {
  const client = await pool.connect()
  try {
    await client.query('SELECT NOW()')
    console.log('✅ PostgreSQL connected')
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', (error as Error).message)
    process.exit(1)
  } finally {
    client.release()
  }
}
