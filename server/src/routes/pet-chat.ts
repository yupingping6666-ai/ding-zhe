import { Router, Request } from 'express'
import { chatWithAI } from '../services/pet-chat.service.js'
import { detectWeatherIntent, fetchWeather } from '../services/weather.service.js'
import { config } from '../config.js'

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
      userName: context?.userName || '',
      userCity: context?.userCity || '',
      partnerName: context?.partnerName || '',
      partnerCity: context?.partnerCity || '',
      upcomingAnniversaries: Array.isArray(context?.upcomingAnniversaries)
        ? (context.upcomingAnniversaries as unknown[])
            .filter((a: any) => a && typeof a.title === 'string')
            .slice(0, 5)
            .map((a: any) => ({
              title: String(a.title),
              emoji: String(a.emoji || '📅'),
              daysUntil: Number(a.daysUntil) || 0,
              isToday: !!a.isToday,
            }))
        : [] as Array<{ title: string; emoji: string; daysUntil: number; isToday: boolean }>,
      taskSummary: context?.taskSummary && typeof context.taskSummary === 'object'
        ? {
            pendingTasks: Array.isArray(context.taskSummary.pendingTasks)
              ? (context.taskSummary.pendingTasks as unknown[])
                  .filter((t: any) => t && typeof t.name === 'string')
                  .slice(0, 5)
                  .map((t: any) => ({
                    name: String(t.name),
                    category: String(t.category || ''),
                    itemType: String(t.itemType || ''),
                    forPartner: !!t.forPartner,
                  }))
              : [] as Array<{ name: string; category: string; itemType: string; forPartner: boolean }>,
            todayCompleted: Number(context.taskSummary.todayCompleted) || 0,
            todayTotal: Number(context.taskSummary.todayTotal) || 0,
            overdueCount: Number(context.taskSummary.overdueCount) || 0,
          }
        : null,
    }

    // Sanitize image URLs: only allow http(s), max 3
    const safeImageUrls: string[] = Array.isArray(imageUrls)
      ? (imageUrls as unknown[]).filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u)).slice(0, 3)
      : []

    // Weather detection: check intent and fetch data if needed
    let weatherData = null
    let partnerWeatherData = null
    if (config.qweather.apiKey) {
      const intent = detectWeatherIntent(message)
      if (intent.isWeather) {
        // Check if asking about partner's weather
        const escapedName = safeContext.partnerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const askingPartner = safeContext.partnerName && new RegExp(
          `${escapedName}|老公|老婆|对象|另一半|他那|她那|那边|那儿|对方`,
        ).test(message)

        const city = intent.city
          || (askingPartner ? safeContext.partnerCity : null)
          || safeContext.userCity
          || config.qweather.defaultCity
        weatherData = await fetchWeather(city)

        // Also fetch partner's weather if cities differ and asking about partner
        if (askingPartner && safeContext.partnerCity && safeContext.partnerCity !== safeContext.userCity) {
          partnerWeatherData = await fetchWeather(safeContext.partnerCity)
        }
      }
    }

    const result = await chatWithAI(message, safeHistory, safeContext, safeImageUrls.length > 0 ? safeImageUrls : undefined, weatherData ?? partnerWeatherData)

    res.json({ ok: true, data: result })
  } catch (error) {
    console.error('[PetChat] Route error:', error)
    // Return fallback flag instead of HTTP error, so frontend degrades gracefully
    res.json({ ok: true, data: { text: '', fallback: true } })
  }
})

export default router
