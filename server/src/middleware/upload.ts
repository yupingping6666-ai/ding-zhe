import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.resolve(__dirname, '../../', config.upload.dir)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
    }
  },
})
