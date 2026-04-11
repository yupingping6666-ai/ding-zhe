import { Router } from 'express'
import * as authService from '../services/auth.service.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { nickname } = req.body
    if (!nickname || typeof nickname !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'nickname is required' },
      })
    }

    const result = await authService.login(nickname)
    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      ok: false,
      error: { code: 'LOGIN_FAILED', message: 'Failed to login' },
    })
  }
})

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

// ===== Phone auth endpoints =====

router.post('/send-code', async (req, res) => {
  try {
    const { phone, purpose } = req.body
    if (!phone || !purpose || !['register', 'reset_password'].includes(purpose)) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'phone and purpose are required' },
      })
    }
    const result = await authService.sendVerificationCode(phone, purpose)
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: { code: result.code, message: result.message } })
    }
    res.json({ ok: true, data: { message: '验证码已发送' } })
  } catch (error) {
    console.error('Send code error:', error)
    res.status(500).json({ ok: false, error: { code: 'SEND_CODE_FAILED', message: 'Failed to send code' } })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { phone, code, password } = req.body
    if (!phone || !code || !password) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'phone, code and password are required' },
      })
    }
    const result = await authService.registerWithPhone(phone, code, password)
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: { code: result.code, message: result.message } })
    }
    res.json({ ok: true, data: result.data })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ ok: false, error: { code: 'REGISTER_FAILED', message: 'Failed to register' } })
  }
})

router.post('/login-phone', async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'phone and password are required' },
      })
    }
    const result = await authService.loginWithPhone(phone, password)
    if (!result.ok) {
      return res.status(401).json({ ok: false, error: { code: result.code, message: result.message } })
    }
    res.json({ ok: true, data: result.data })
  } catch (error) {
    console.error('Phone login error:', error)
    res.status(500).json({ ok: false, error: { code: 'LOGIN_FAILED', message: 'Failed to login' } })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body
    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'phone, code and newPassword are required' },
      })
    }
    const result = await authService.resetPassword(phone, code, newPassword)
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: { code: result.code, message: result.message } })
    }
    res.json({ ok: true, data: result.data })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ ok: false, error: { code: 'RESET_FAILED', message: 'Failed to reset password' } })
  }
})

export default router
