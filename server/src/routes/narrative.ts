import { Router } from 'express'
import * as narrativeService from '../services/narrative.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { scope, partnerId, photoId, taskIds } = req.body

    if (!scope) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'scope is required' },
      })
    }

    const narrative = await narrativeService.generateNarrative({
      scope,
      userId: req.userId!,
      partnerId: partnerId || undefined,
      photoId: photoId || undefined,
      taskIds: taskIds || undefined,
    })

    res.json({ ok: true, data: narrative })
  } catch (error) {
    console.error('Generate narrative error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'NARRATIVE_FAILED', message: 'Failed to generate narrative' },
    })
  }
})

export default router
