import { Router } from 'express'
import * as taskService from '../services/task.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const tasks = await taskService.getTasksForUser(req.userId!)
    res.json({ ok: true, data: tasks })
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'TASKS_FAILED', message: 'Failed to fetch tasks' },
    })
  }
})

router.post('/create', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      name, category, remindTime, repeatRule, weeklyDays,
      followUpIntensity, itemType, receiverId, note,
    } = req.body

    if (!name || !receiverId || !remindTime) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'name, receiverId, and remindTime are required' },
      })
    }

    // Parse remindTime "HH:mm" to Date
    const [h, m] = remindTime.split(':').map(Number)
    const scheduledAt = new Date()
    scheduledAt.setHours(h, m, 0, 0)

    const result = await taskService.createTask({
      creatorId: req.userId!,
      receiverId,
      name,
      category: category || 'other',
      remindTime,
      repeatRule: repeatRule || 'once',
      weeklyDays: weeklyDays || [],
      followUpIntensity: followUpIntensity || 'standard',
      itemType: itemType || 'todo',
      note: note || '',
      scheduledAt,
    })

    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'CREATE_FAILED', message: 'Failed to create task' },
    })
  }
})

router.post('/update_status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { instanceId, status, feedback } = req.body

    if (!instanceId || !status) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'instanceId and status are required' },
      })
    }

    const updated = await taskService.updateInstanceStatus(instanceId, status, feedback, req.userId!)
    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Instance not found' },
      })
    }

    res.json({ ok: true, data: updated })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update status' },
    })
  }
})

export default router
