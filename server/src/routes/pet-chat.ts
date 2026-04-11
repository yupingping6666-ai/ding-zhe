import { Router, Request } from 'express'
import { chatWithAI } from '../services/pet-chat.service.js'

const router = Router()

// No auth required — pet chat context is sent from the frontend,
// no user-specific DB queries needed. This allows local-mode (no login) to work.
router.post('/reply', async (req: Request, res) => {
  try {
    const { message, history, context, imageUrls } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'message is required' },
      })
    }

    // Limit history to max 10 entries
    const safeHistory = Array.isArray(history) ? history.slice(-10) : []

    const safeContext = {
      companionName: context?.companionName || '小橘',
      mood: context?.mood || 'neutral',
      energy: context?.energy ?? 50,
      relationDays: context?.relationDays ?? 0,
    }

    // Sanitize image URLs: only allow http(s), max 3
    const safeImageUrls: string[] = Array.isArray(imageUrls)
      ? (imageUrls as unknown[]).filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u)).slice(0, 3)
      : []

    const result = await chatWithAI(message, safeHistory, safeContext, safeImageUrls.length > 0 ? safeImageUrls : undefined)

    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('[PetChat] Route error:', error)
    // Return fallback flag instead of HTTP error, so frontend degrades gracefully
    res.json({ ok: true, data: { text: '', fallback: true } })
  }
})

export default router
