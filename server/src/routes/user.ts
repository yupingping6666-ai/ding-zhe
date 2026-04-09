import { Router } from 'express'
import * as authService from '../services/auth.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Reuse /user/me from auth routes for simplicity, or extend here
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await authService.getUserProfile(req.userId!)
    if (!profile) {
      return res.status(404).json({
        ok: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      })
    }
    res.json({ ok: true, data: profile })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'PROFILE_FAILED', message: 'Failed to get profile' },
    })
  }
})

export default router
