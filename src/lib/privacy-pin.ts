const STORAGE_KEY = 'dingzhe_privacy_pin'
const QUESTION_KEY = 'dingzhe_security_question'
const ANSWER_KEY = 'dingzhe_security_answer'

export const SECURITY_QUESTIONS = [
  '你的宠物名字是什么？',
  '你最喜欢的食物是什么？',
  '你的生日是几月几号？',
  '你最好朋友的名字是什么？',
  '你最喜欢的颜色是什么？',
]

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Check whether a PIN has been set */
export function hasPin(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)
}

/** Store a new PIN (hashed) */
export async function setPin(pin: string): Promise<void> {
  const hash = await sha256(pin)
  localStorage.setItem(STORAGE_KEY, hash)
}

/** Verify an entered PIN against the stored hash */
export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return false
  const hash = await sha256(pin)
  return hash === stored
}

/** Clear only the PIN (keeps security question data) */
export function clearPin(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Check whether a security question has been set */
export function hasSecurityQuestion(): boolean {
  return !!localStorage.getItem(QUESTION_KEY) && !!localStorage.getItem(ANSWER_KEY)
}

/** Get the stored security question text */
export function getSecurityQuestion(): string | null {
  return localStorage.getItem(QUESTION_KEY)
}

/** Store a security question and its answer (answer is hashed) */
export async function setSecurityQuestion(question: string, answer: string): Promise<void> {
  const normalized = answer.trim().toLowerCase()
  const hash = await sha256(normalized)
  localStorage.setItem(QUESTION_KEY, question)
  localStorage.setItem(ANSWER_KEY, hash)
}

/** Verify a security answer against the stored hash */
export async function verifySecurityAnswer(answer: string): Promise<boolean> {
  const stored = localStorage.getItem(ANSWER_KEY)
  if (!stored) return false
  const normalized = answer.trim().toLowerCase()
  const hash = await sha256(normalized)
  return hash === stored
}
