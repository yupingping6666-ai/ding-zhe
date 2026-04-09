import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { pool, testConnection } from './db.js'

// Routes
import authRouter from './routes/auth.js'
import userRouter from './routes/user.js'
import taskRouter from './routes/task.js'
import photoRouter from './routes/photo.js'
import narrativeRouter from './routes/narrative.js'
import relationRouter from './routes/relation.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files for uploaded photos
app.use('/uploads', express.static(config.upload.dir))

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/task', taskRouter)
app.use('/api/photo', photoRouter)
app.use('/api/narrative', narrativeRouter)
app.use('/api/relation', relationRouter)

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
})

// Start server
async function start() {
  await testConnection()
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`)
    console.log(`📦 Environment: ${config.nodeEnv}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
