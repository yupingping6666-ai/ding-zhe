import { Router, Request } from 'express'
import { generateRelayWithAI } from '../services/emotion-relay.service.js'

const router = Router()

router.post('/generate', async (req: Request, res) => {
  try {
    const { message, context } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'message is required' },
      })
    }

    const safeContext = {
      senderName: context?.senderName || '对方',
      receiverName: context?.receiverName || 'TA',
      companionName: context?.companionName || '小橘',
      relationDays: context?.relationDays ?? 0,
      relationType: context?.relationType || 'couple',
    }

    const result = await generateRelayWithAI(message.slice(0, 500), safeContext)

    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('[EmotionRelay] Route error:', error)
    res.json({ ok: true, data: { gentle: '', casual: '', direct: '', fallback: true } })
  }
})

export default router
