import type { User } from '@/types'

/**
 * 从 userId 生成邀请码，格式：YJD-{lastChar}{4charHash}
 * 与 OnboardingPage / RelationshipPage 中原有算法一致
 */
export function generateInviteCode(userId: string): string {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const suffix = hash.toString(36).toUpperCase().slice(0, 4).padEnd(4, '0')
  return `YJD-${userId.slice(-1).toUpperCase()}${suffix}`
}

/**
 * 根据邀请码反查对应用户
 * 遍历 users 数组，对每个用户计算邀请码并比对
 */
export function resolveInviteCode(code: string, users: User[]): User | null {
  const normalized = code.trim().toUpperCase()
  for (const user of users) {
    if (generateInviteCode(user.id) === normalized) {
      return user
    }
  }
  return null
}
