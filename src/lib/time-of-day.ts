import type { TimeOfDay } from '@/types'

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

export function getTimeGreeting(t: TimeOfDay): string {
  switch (t) {
    case 'morning': return '早安'
    case 'afternoon': return '午后好'
    case 'evening': return '傍晚好'
    case 'night': return '夜深了'
  }
}

export function getAmbientGradientClass(t: TimeOfDay): string {
  switch (t) {
    case 'morning': return 'gradient-morning'
    case 'afternoon': return 'gradient-afternoon'
    case 'evening': return 'gradient-evening'
    case 'night': return 'gradient-night'
  }
}
