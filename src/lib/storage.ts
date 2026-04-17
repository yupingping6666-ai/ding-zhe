/**
 * localStorage persistence layer for ding-zhe app.
 * Provides save/load/clear utilities with JSON serialization and error handling.
 */

const STORAGE_PREFIX = 'dingzhe_'

const KEYS = {
  users: `${STORAGE_PREFIX}users`,
  space: `${STORAGE_PREFIX}space`,
  templates: `${STORAGE_PREFIX}templates`,
  instances: `${STORAGE_PREFIX}instances`,
  feelings: `${STORAGE_PREFIX}feelings`,
  comments: `${STORAGE_PREFIX}comments`,
  narratives: `${STORAGE_PREFIX}narratives`,
  relayMessages: `${STORAGE_PREFIX}relay_messages`,
} as const

type StorageKey = keyof typeof KEYS

function save<T>(key: StorageKey, data: T): void {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data))
  } catch {
    // localStorage full or not available — silently ignore
  }
}

function load<T>(key: StorageKey): T | null {
  try {
    const raw = localStorage.getItem(KEYS[key])
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function remove(key: StorageKey): void {
  try {
    localStorage.removeItem(KEYS[key])
  } catch {
    // ignore
  }
}

function clearAll(): void {
  for (const key of Object.keys(KEYS) as StorageKey[]) {
    remove(key)
  }
}

function hasData(): boolean {
  try {
    return localStorage.getItem(KEYS.space) !== null
  } catch {
    return false
  }
}

export const storage = { save, load, remove, clearAll, hasData, KEYS }
