import dotenv from 'dotenv'
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env' })

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'dingzhe',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'ding-zhe-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },

  sms: {
    mockCode: process.env.SMS_MOCK_CODE || '',
    codeExpiry: parseInt(process.env.SMS_CODE_EXPIRY || '300', 10),
  },

  // AI model config (Kimi K2.5 via Moonshot API, OpenAI-compatible)
  dashscope: {
    apiKey: process.env.KIMI_API_KEY || process.env.DASHSCOPE_API_KEY || '',
    model: process.env.KIMI_MODEL || process.env.DASHSCOPE_MODEL || 'kimi-k2.5',
    vlModel: process.env.KIMI_VL_MODEL || process.env.DASHSCOPE_VL_MODEL || 'kimi-k2.5',
    baseUrl: process.env.KIMI_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1',
  },

  qweather: {
    apiKey: process.env.QWEATHER_API_KEY || '',
    baseUrl: process.env.QWEATHER_BASE_URL || 'https://devapi.qweather.com',
    defaultCity: process.env.QWEATHER_DEFAULT_CITY || '北京',
  },
}
