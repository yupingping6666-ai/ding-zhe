import type { PetMood, PetInteractionType } from '@/types'
import type { CompanionMood } from '@/lib/companion'

export const PET_COOLDOWNS: Record<PetInteractionType, number> = {
  pet: 30_000,   // 30 seconds
  feed: 300_000, // 5 minutes
}

export function calculateMood(
  completedCount: number,
  totalActiveCount: number,
  skippedCount: number,
): PetMood {
  if (totalActiveCount === 0) return 'sleepy'
  const rate = completedCount / totalActiveCount
  if (rate > 0.8) return 'happy'
  if (rate > 0.6) return 'content'
  if (rate > 0.3) return 'neutral'
  if (skippedCount > 2) return 'lonely'
  return 'neutral'
}

export function calculateEnergy(
  baseEnergy: number,
  completedToday: number,
  interactionsToday: number,
  lastActiveTimestamp: number | null,
): number {
  let energy = baseEnergy
  energy += completedToday * 8
  energy += interactionsToday * 5
  // Virtual decay: -2 per hour since last activity
  if (lastActiveTimestamp) {
    const hoursIdle = (Date.now() - lastActiveTimestamp) / 3_600_000
    energy -= Math.floor(hoursIdle) * 2
  }
  return Math.max(10, Math.min(100, energy))
}

export function canInteract(lastTimestamp: number | null, cooldownMs: number): boolean {
  if (!lastTimestamp) return true
  return Date.now() - lastTimestamp >= cooldownMs
}

export function getInteractionCooldownRemaining(lastTimestamp: number | null, cooldownMs: number): number {
  if (!lastTimestamp) return 0
  const remaining = cooldownMs - (Date.now() - lastTimestamp)
  return Math.max(0, Math.ceil(remaining / 1000))
}

export function petMoodToCompanionMood(petMood: PetMood): CompanionMood {
  switch (petMood) {
    case 'happy': return 'happy'
    case 'content': return 'idle'
    case 'neutral': return 'thinking'
    case 'lonely': return 'sad'
    case 'sleepy': return 'sleeping'
  }
}

export function getEnergyLabel(energy: number): { text: string; emoji: string } {
  if (energy >= 80) return { text: '精力充沛', emoji: '⚡' }
  if (energy >= 60) return { text: '元气满满', emoji: '💪' }
  if (energy >= 40) return { text: '还行吧', emoji: '😊' }
  if (energy >= 20) return { text: '有点累了', emoji: '😴' }
  return { text: '需要休息', emoji: '💤' }
}

export function getTodayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
