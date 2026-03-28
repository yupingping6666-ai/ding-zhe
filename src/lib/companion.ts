// ---- Companion Animal Character System ----
// Each animal has contextual expressions for different product scenarios.
// Characters are "companion assistants" that help convey reminders, status,
// and emotional feedback between users.

export type CompanionAnimal = 'dog' | 'cat' | 'bear' | 'rabbit' | 'penguin' | 'fox' | 'hamster' | 'duck'

export type RelationType = 'couple' | 'spouse' | 'family' | 'parent_child' | 'roommate' | 'friend'

export type CompanionMood =
  | 'idle'        // default / neutral
  | 'happy'       // task completed, positive feedback
  | 'celebrate'   // great achievement, all done
  | 'waiting'     // waiting for response
  | 'remind'      // gentle nudge / reminder
  | 'sad'         // can't do / skipped
  | 'sleeping'    // nothing to do, rest
  | 'love'        // care-type context
  | 'encourage'   // motivational
  | 'thinking'    // processing / loading

export interface CompanionCharacter {
  id: CompanionAnimal
  name: string
  avatar: string
  expressions: Record<CompanionMood, string>
}

export const COMPANION_CHARACTERS: Record<CompanionAnimal, CompanionCharacter> = {
  dog: {
    id: 'dog',
    name: '小柴',
    avatar: '🐕',
    expressions: {
      idle: '🐕',
      happy: '🐶',
      celebrate: '🎉🐶',
      waiting: '🐕‍🦺',
      remind: '🐾',
      sad: '🐶💧',
      sleeping: '🐶💤',
      love: '🐶💕',
      encourage: '💪🐶',
      thinking: '🐕',
    },
  },
  cat: {
    id: 'cat',
    name: '小橘',
    avatar: '🐱',
    expressions: {
      idle: '🐱',
      happy: '😺',
      celebrate: '🎉😸',
      waiting: '🐈',
      remind: '🐾',
      sad: '😿',
      sleeping: '😽',
      love: '😻',
      encourage: '💪😼',
      thinking: '😾',
    },
  },
  bear: {
    id: 'bear',
    name: '小熊',
    avatar: '🐻',
    expressions: {
      idle: '🐻',
      happy: '🧸',
      celebrate: '🎉🧸',
      waiting: '🐻',
      remind: '🐾',
      sad: '🐻💧',
      sleeping: '🐻💤',
      love: '🧸💕',
      encourage: '💪🧸',
      thinking: '🐻',
    },
  },
  rabbit: {
    id: 'rabbit',
    name: '小兔',
    avatar: '🐰',
    expressions: {
      idle: '🐰',
      happy: '🐰✨',
      celebrate: '🎉🐰',
      waiting: '🐇',
      remind: '🐾',
      sad: '🐰💧',
      sleeping: '🐰💤',
      love: '🐰💕',
      encourage: '💪🐰',
      thinking: '🐇',
    },
  },
  penguin: {
    id: 'penguin',
    name: '小企鹅',
    avatar: '🐧',
    expressions: {
      idle: '🐧',
      happy: '🐧✨',
      celebrate: '🎉🐧',
      waiting: '🐧',
      remind: '🐾',
      sad: '🐧💧',
      sleeping: '🐧💤',
      love: '🐧💕',
      encourage: '💪🐧',
      thinking: '🐧',
    },
  },
  fox: {
    id: 'fox',
    name: '小狐',
    avatar: '🦊',
    expressions: {
      idle: '🦊',
      happy: '🦊✨',
      celebrate: '🎉🦊',
      waiting: '🦊',
      remind: '🐾',
      sad: '🦊💧',
      sleeping: '🦊💤',
      love: '🦊💕',
      encourage: '💪🦊',
      thinking: '🦊',
    },
  },
  hamster: {
    id: 'hamster',
    name: '小仓',
    avatar: '🐹',
    expressions: {
      idle: '🐹',
      happy: '🐹✨',
      celebrate: '🎉🐹',
      waiting: '🐹',
      remind: '🐾',
      sad: '🐹💧',
      sleeping: '🐹💤',
      love: '🐹💕',
      encourage: '💪🐹',
      thinking: '🐹',
    },
  },
  duck: {
    id: 'duck',
    name: '小鸭',
    avatar: '🐥',
    expressions: {
      idle: '🐥',
      happy: '🐥✨',
      celebrate: '🎉🐥',
      waiting: '🐤',
      remind: '🐾',
      sad: '🐥💧',
      sleeping: '🐥💤',
      love: '🐥💕',
      encourage: '💪🐥',
      thinking: '🐤',
    },
  },
}

export const COMPANION_LIST: CompanionCharacter[] = Object.values(COMPANION_CHARACTERS)

// ---- Relationship types ----
export const RELATION_TYPES: Record<RelationType, { label: string; emoji: string; desc: string }> = {
  couple: { label: '情侣', emoji: '💑', desc: '甜蜜的恋人' },
  spouse: { label: '夫妻', emoji: '💍', desc: '携手的伴侣' },
  family: { label: '家人', emoji: '👨‍👩‍👧', desc: '温暖的家庭' },
  parent_child: { label: '亲子', emoji: '👩‍👧', desc: '亲密的陪伴' },
  roommate: { label: '室友', emoji: '🏠', desc: '生活好搭档' },
  friend: { label: '好友', emoji: '🤝', desc: '贴心的朋友' },
}

// ---- Contextual companion messages ----
// The companion speaks on behalf of the system to soften interactions.

export function getCompanionMessage(
  character: CompanionCharacter,
  context: 'empty_all' | 'empty_sent' | 'complete' | 'deferred' | 'cant_do' | 'waiting' | 'encourage' | 'welcome'
): { emoji: string; text: string } {
  const name = character.name
  switch (context) {
    case 'empty_all':
      return { emoji: character.expressions.sleeping, text: `${name}说：今天都处理完啦，休息一下吧~` }
    case 'empty_sent':
      return { emoji: character.expressions.idle, text: `${name}说：还没有发出的提醒，给TA创建一个吧~` }
    case 'complete':
      return { emoji: character.expressions.celebrate, text: `${name}说：太棒了！做得好！` }
    case 'deferred':
      return { emoji: character.expressions.waiting, text: `${name}说：这件事还在等你哦~` }
    case 'cant_do':
      return { emoji: character.expressions.sad, text: `${name}说：没关系，下次一定可以的！` }
    case 'waiting':
      return { emoji: character.expressions.waiting, text: `${name}说：TA还在处理中，耐心等等~` }
    case 'encourage':
      return { emoji: character.expressions.encourage, text: `${name}说：加油，你可以的！` }
    case 'welcome':
      return { emoji: character.expressions.happy, text: `${name}来陪你啦！` }
  }
}

import type { PetMood, PetInteractionType } from '@/types'
import { petMoodToCompanionMood } from '@/lib/pet-state'

export function getTimelineCompanionNote(
  character: CompanionCharacter,
  action: string
): string | null {
  const name = character.name
  switch (action) {
    case 'reminded':
      return `${name}帮你送达了提醒`
    case 'user_completed':
      return `${name}很开心！`
    case 'acknowledged':
      return `${name}说：收到爱心啦~`
    case 'user_deferred':
      return `${name}会稍后再提醒的`
    case 'follow_up_sent':
      return `${name}又来提醒啦~`
    case 'feedback_sent':
      return `${name}帮你把回复传达啦`
    case 'cant_do':
      return `${name}说：没关系的~`
    default:
      return null
  }
}

// ---- Pet mood → expression ----
export function getPetMoodExpression(character: CompanionCharacter, petMood: PetMood): string {
  const companionMood = petMoodToCompanionMood(petMood)
  return character.expressions[companionMood]
}

// ---- Pet interaction response ----
export function getInteractionResponse(
  character: CompanionCharacter,
  type: PetInteractionType,
  cooldownActive: boolean,
): { emoji: string; text: string } {
  const name = character.name
  if (cooldownActive) {
    if (type === 'pet') return { emoji: character.expressions.happy, text: `${name}刚刚被摸过啦，开心得不行~` }
    return { emoji: character.expressions.happy, text: `${name}说：吃饱了，肚子圆滚滚~` }
  }
  if (type === 'pet') {
    const msgs = [
      `${name}开心地蹭蹭你~`,
      `${name}舒服地眯起了眼睛~`,
      `${name}摇摇尾巴，很享受~`,
    ]
    return { emoji: character.expressions.love, text: msgs[Math.floor(Math.random() * msgs.length)] }
  }
  const msgs = [
    `${name}吃得很开心！`,
    `${name}大口大口地吃着~`,
    `${name}说：好好吃呀！`,
  ]
  return { emoji: character.expressions.happy, text: msgs[Math.floor(Math.random() * msgs.length)] }
}
