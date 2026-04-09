import { Router } from 'express'
import * as relationService from '../services/relation.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/invite', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { targetNickname } = req.body

    if (!targetNickname) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'targetNickname is required' },
      })
    }

    const result = await relationService.invitePartner(req.userId!, targetNickname)

    if ('error' in result) {
      const statusMap: Record<string, number> = {
        USER_NOT_FOUND: 404,
        SELF_INVITE: 400,
        ALREADY_BOUND: 409,
        PARTNER_BOUND: 409,
      }
      return res.status(statusMap[result.error] || 400).json({
        ok: false,
        error: { code: result.error, message: result.message },
      })
    }

    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('Invite error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'INVITE_FAILED', message: 'Failed to send invite' },
    })
  }
})

router.post('/bind', authMiddleware, async (_req: AuthRequest, res) => {
  // Binding is handled automatically during invite acceptance
  res.json({ ok: true, message: 'Use /invite to bind partner' })
})

export default router
