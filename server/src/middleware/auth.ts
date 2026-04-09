import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface AuthRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string }
    req.userId = decoded.sub
    next()
  } catch {
    return res.status(401).json({
      ok: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    })
  }
}
