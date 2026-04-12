import { config } from '../config.js'

// ---- Types ----

export interface WeatherData {
  city: string
  temp: string
  text: string
  feelsLike: string
  humidity: string
  windDir: string
  windScale: string
}

export interface WeatherIntent {
  isWeather: boolean
  city: string | null
}

// ---- Weather intent detection ----

const WEATHER_TRIGGERS = [
  '天气', '气温', '温度', '下雨', '下雪', '刮风',
  '多少度', '冷不冷', '热不热', '穿什么', '带伞',
  '晴天', '阴天', '雾霾', '紫外线',
]

const MAJOR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京',
  '西安', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '大连',
  '厦门', '昆明', '贵阳', '合肥', '福州', '济南', '哈尔滨', '沈阳',
  '长春', '石家庄', '太原', '兰州', '西宁', '银川', '乌鲁木齐',
  '南宁', '海口', '三亚', '拉萨', '呼和浩特', '香港', '澳门', '台北',
]

// Local city → QWeather location ID mapping (no Geo API needed)
const CITY_LOCATION_IDS: Record<string, string> = {
  '北京': '101010100', '上海': '101020100', '广州': '101280101', '深圳': '101280601',
  '杭州': '101210101', '成都': '101270101', '武汉': '101200101', '南京': '101190101',
  '西安': '101110101', '重庆': '101040100', '天津': '101030100', '苏州': '101190401',
  '长沙': '101250101', '郑州': '101180101', '青岛': '101120201', '大连': '101070201',
  '厦门': '101230201', '昆明': '101290101', '贵阳': '101260101', '合肥': '101220101',
  '福州': '101230101', '济南': '101120101', '哈尔滨': '101050101', '沈阳': '101070101',
  '长春': '101060101', '石家庄': '101090101', '太原': '101100101', '兰州': '101160101',
  '西宁': '101150101', '银川': '101170101', '乌鲁木齐': '101130101',
  '南宁': '101300101', '海口': '101310101', '三亚': '101310201', '拉萨': '101140101',
  '呼和浩特': '101080101', '香港': '101320101', '澳门': '101330101', '台北': '101340101',
}

export function detectWeatherIntent(message: string): WeatherIntent {
  const hasWeatherKeyword = WEATHER_TRIGGERS.some(k => message.includes(k))
  if (!hasWeatherKeyword) {
    return { isWeather: false, city: null }
  }

  // Try to extract city name
  let city: string | null = null

  // Pattern 1: 2-4 Chinese chars before weather keywords — only accept known cities
  const cityBeforeKeyword = message.match(/([\u4e00-\u9fa5]{2,4}?)(?:的)?(?:天气|气温|温度|多少度)/)
  if (cityBeforeKeyword) {
    const candidate = cityBeforeKeyword[1]
    const stripped = candidate.replace(/[市区县]$/, '')
    if (MAJOR_CITIES.includes(stripped) || CITY_LOCATION_IDS[stripped]) {
      city = stripped
    }
  }

  // Pattern 2: Check if any known city name appears in the message
  if (!city) {
    for (const c of MAJOR_CITIES) {
      if (message.includes(c)) {
        city = c
        break
      }
    }
  }

  return { isWeather: true, city }
}

// ---- Weather API calls ----

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchWeather(cityName: string): Promise<WeatherData | null> {
  if (!config.qweather.apiKey) {
    return null
  }

  const locationId = CITY_LOCATION_IDS[cityName]
  if (!locationId) {
    console.warn(`[Weather] Unknown city: "${cityName}"`)
    return null
  }

  try {
    const weatherUrl = `${config.qweather.baseUrl}/v7/weather/now?location=${locationId}&key=${config.qweather.apiKey}`
    const weatherRes = await fetchWithTimeout(weatherUrl)
    const weatherData = await weatherRes.json() as {
      code: string
      now?: {
        temp: string
        text: string
        feelsLike: string
        humidity: string
        windDir: string
        windScale: string
      }
    }

    if (weatherData.code !== '200' || !weatherData.now) {
      console.warn(`[Weather] Weather fetch failed for ${cityName}: code=${weatherData.code}`)
      return null
    }

    return {
      city: cityName,
      temp: weatherData.now.temp,
      text: weatherData.now.text,
      feelsLike: weatherData.now.feelsLike,
      humidity: weatherData.now.humidity,
      windDir: weatherData.now.windDir,
      windScale: weatherData.now.windScale,
    }
  } catch (error) {
    console.warn('[Weather] API call failed:', error)
    return null
  }
}
