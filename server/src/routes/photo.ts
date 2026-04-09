import { Router } from 'express'
import * as photoService from '../services/photo.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      })
    }

    const { description, relatedTaskId, mode, tags } = req.body

    const photo = await photoService.savePhoto({
      userId: req.userId!,
      mode: mode || 'single',
      url: `/uploads/${req.file.filename}`,
      description: description || undefined,
      relatedTaskId: relatedTaskId || undefined,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    })

    res.json({ ok: true, data: photo })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload photo' },
    })
  }
})

router.get('/list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const photos = await photoService.getPhotosForUser(req.userId!, limit)
    res.json({ ok: true, data: photos })
  } catch (error) {
    console.error('Get photos error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'PHOTOS_FAILED', message: 'Failed to fetch photos' },
    })
  }
})

export default router
