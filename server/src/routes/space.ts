import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'
import * as spaceService from '../services/space.service.js'

const router = Router()

// GET /api/space/my
router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const space = await spaceService.getMySpace(req.userId!)
    if (!space) {
      return res.status(404).json({
        ok: false,
        error: { code: 'SPACE_NOT_FOUND', message: 'No relationship space found for this user' },
      })
    }
    res.json({ ok: true, data: space })
  } catch (error) {
    console.error('[Space] Get my space error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

// POST /api/space/companion
router.post('/companion', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { companion } = req.body
    if (!companion) {
      return res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Missing companion field' } })
    }
    const result = await spaceService.updateCompanion(req.userId!, companion)
    res.json({ ok: true, data: { companion: result } })
  } catch (error) {
    console.error('[Space] Update companion error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

// GET /api/space/anniversaries
router.get('/anniversaries', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const anniversaries = await spaceService.getAnniversaries(req.userId!)
    res.json({ ok: true, data: anniversaries })
  } catch (error) {
    console.error('[Space] Get anniversaries error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

// POST /api/space/anniversaries
router.post('/anniversaries', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, date_mm_dd, start_year, emoji, is_recurring } = req.body
    if (!title || !date_mm_dd) {
      return res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Missing title or date_mm_dd' } })
    }
    const result = await spaceService.createAnniversary(req.userId!, {
      title,
      date_mm_dd,
      start_year,
      emoji: emoji || '📅',
      is_recurring: is_recurring !== undefined ? is_recurring : true,
    })
    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('[Space] Create anniversary error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

// POST /api/space/pet-interact
router.post('/pet-interact', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { type } = req.body
    if (!type || !['pet', 'feed'].includes(type)) {
      return res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid type, must be "pet" or "feed"' } })
    }
    const result = await spaceService.petInteract(req.userId!, type)
    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('[Space] Pet interact error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

export default router

// Separate router for anniversary-specific routes (PATCH/DELETE by ID)
const anniversaryRouter = Router()

// PATCH /api/anniversaries/:id
anniversaryRouter.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const result = await spaceService.updateAnniversary(id, req.userId!, req.body)
    res.json({ ok: true, data: result })
  } catch (error: any) {
    if (error.message === 'Anniversary not found or access denied') {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: error.message } })
    }
    console.error('[Anniversary] Update error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

// DELETE /api/anniversaries/:id
anniversaryRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const result = await spaceService.deleteAnniversary(id, req.userId!)
    res.json({ ok: true, data: result })
  } catch (error: any) {
    if (error.message === 'Anniversary not found or access denied') {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: error.message } })
    }
    console.error('[Anniversary] Delete error:', error)
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
})

export { anniversaryRouter }
