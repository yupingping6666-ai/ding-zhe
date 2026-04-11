import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, Calendar, Delete, ShieldCheck } from 'lucide-react'
import {
  hasPin, setPin, verifyPin, clearPin,
  hasSecurityQuestion, getSecurityQuestion, setSecurityQuestion, verifySecurityAnswer,
  SECURITY_QUESTIONS,
} from '@/lib/privacy-pin'
import lockClosedImg from '@/assets/lock-closed.png'
import lockUnlockedCatImg from '@/assets/lock-unlocked-cat.png'

type Phase = 'guide' | 'setup' | 'setup-confirm' | 'setup-security' | 'verify' | 'forgot' | 'unlocking'

interface PrivacyLockScreenProps {
  hiddenCount: number
  onUnlocked: () => void
  onCancel: () => void
}

const PIN_LENGTH = 4

function getInitialPhase(): Phase {
  if (hasPin()) return 'verify'
  if (hasSecurityQuestion()) return 'setup' // reset flow: PIN cleared but security question exists
  return 'guide'
}

export function PrivacyLockScreen({ hiddenCount, onUnlocked, onCancel }: PrivacyLockScreenProps) {
  const [phase, setPhase] = useState<Phase>(getInitialPhase)
  const [pin, setPin_] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [shaking, setShaking] = useState(false)
  const [hint, setHint] = useState('')
  const [unlockStep, setUnlockStep] = useState(0)
  const [showPad, setShowPad] = useState(false)

  // Security question states
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [securityError, setSecurityError] = useState(false)

  const today = new Date()
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`

  const phaseHint = (): string => {
    if (hint) return hint
    switch (phase) {
      case 'setup':
        return '设置隐私密码'
      case 'setup-confirm':
        return '再次输入确认'
      case 'verify':
        return '请您证明身份'
      default:
        return ''
    }
  }

  const isError = hint === '密码错误' || hint === '两次密码不一致'

  const triggerShake = useCallback(() => {
    setShaking(true)
    navigator.vibrate?.(200)
    setTimeout(() => {
      setShaking(false)
      setPin_('')
      setHint('')
    }, 400)
  }, [])

  // Handle PIN input completion
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return

    const handle = async () => {
      if (phase === 'setup') {
        setFirstPin(pin)
        setPin_('')
        setPhase('setup-confirm')
      } else if (phase === 'setup-confirm') {
        if (pin === firstPin) {
          await setPin(pin)
          if (hasSecurityQuestion()) {
            setPhase('unlocking')
          } else {
            setPhase('setup-security')
          }
        } else {
          setHint('两次密码不一致')
          setFirstPin('')
          setPhase('setup')
          triggerShake()
        }
      } else if (phase === 'verify') {
        const ok = await verifyPin(pin)
        if (ok) {
          setPhase('unlocking')
        } else {
          setHint('密码错误')
          triggerShake()
        }
      }
    }

    const t = setTimeout(handle, 150)
    return () => clearTimeout(t)
  }, [pin, phase, firstPin, triggerShake])

  // Unlock animation
  useEffect(() => {
    if (phase !== 'unlocking') return

    const t1 = setTimeout(() => setUnlockStep(1), 300)
    const t2 = setTimeout(() => setUnlockStep(2), 1200)
    const t3 = setTimeout(() => onUnlocked(), 2200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [phase, onUnlocked])

  const pressKey = useCallback(
    (key: string) => {
      if (phase === 'unlocking') return
      if (key === 'del') {
        setPin_((p) => p.slice(0, -1))
      } else if (key === 'cancel') {
        onCancel()
      } else {
        setPin_((p) => (p.length < PIN_LENGTH ? p + key : p))
      }
    },
    [phase, onCancel],
  )

  const numKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['cancel', '0', 'del'],
  ]

  const isUnlocking = phase === 'unlocking'
  const showNumPad = !isUnlocking && showPad && ['setup', 'setup-confirm', 'verify'].includes(phase)

  const handleBack = () => {
    if (phase === 'forgot') {
      setPhase('verify')
      setSecurityAnswer('')
      setSecurityError(false)
      setPin_('')
      setHint('')
    } else {
      onCancel()
    }
  }

  const handleForgotVerify = async () => {
    const ok = await verifySecurityAnswer(securityAnswer)
    if (ok) {
      clearPin()
      setPin_('')
      setFirstPin('')
      setHint('')
      setSecurityAnswer('')
      setSecurityError(false)
      setShowPad(true)
      setPhase('setup')
    } else {
      setSecurityError(true)
      setShaking(true)
      navigator.vibrate?.(200)
      setTimeout(() => setShaking(false), 400)
    }
  }

  const handleSecuritySubmit = async () => {
    await setSecurityQuestion(selectedQuestion, securityAnswer)
    setPhase('unlocking')
  }

  return (
    <div
      className={`flex flex-col h-full transition-opacity duration-500 ${
        isUnlocking && unlockStep >= 2 ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(180deg, hsl(32 70% 96%) 0%, hsl(30 40% 94%) 40%, hsl(32 50% 97%) 100%)' }}
    >
      {/* Header */}
      {phase !== 'setup-security' && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
          <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground active:opacity-60">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">返回</span>
          </button>
          <h1 className="text-sm font-semibold text-foreground">隐私锁状态</h1>
          <div className="w-14" />
        </div>
      )}

      {/* Date info */}
      <div className="flex items-center justify-center gap-1.5 py-2 text-muted-foreground flex-shrink-0">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs">{dateStr} ({hiddenCount} 条)</span>
      </div>

      {/* ========== GUIDE phase ========== */}
      {phase === 'guide' && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-8">
            <img
              src={lockClosedImg}
              alt="锁"
              className="w-28 h-28 object-contain"
            />
            <h2 className="mt-6 text-lg font-bold text-foreground">保护你的隐私记录</h2>
            <p className="mt-2 text-sm text-muted-foreground text-center leading-relaxed">
              设置 4 位数字密码后，隐藏的记录将需要验证才能查看
            </p>
            <button
              onClick={() => { setPhase('setup'); setShowPad(true) }}
              className="mt-8 h-12 w-48 rounded-2xl text-white font-semibold text-sm active:opacity-80 transition-opacity"
              style={{ background: 'linear-gradient(135deg, hsl(32 80% 55%), hsl(25 90% 50%))' }}
            >
              开始设置
            </button>
          </div>
          {/* Reserve pad space */}
          <div className="flex-shrink-0 px-8 pb-6 opacity-0 pointer-events-none">
            <div className="grid grid-cols-3 gap-2">
              {numKeys.flat().map((key) => (
                <div key={key} className="h-12" />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========== SETUP-SECURITY phase ========== */}
      {phase === 'setup-security' && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-6">
            <ShieldCheck className="w-12 h-12 text-amber-500" />
            <h2 className="mt-4 text-base font-semibold text-foreground">设置安全问题</h2>
            <p className="mt-1 text-xs text-muted-foreground">忘记密码时可通过安全问题找回</p>

            <div className="w-full mt-6 space-y-3">
              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-white/70 px-4 text-sm text-foreground appearance-none"
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>

              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="请输入你的答案"
                className="w-full h-12 rounded-xl border border-border bg-white/70 px-4 text-sm text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <button
              onClick={handleSecuritySubmit}
              disabled={securityAnswer.trim().length === 0}
              className="mt-6 h-12 w-full rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, hsl(32 80% 55%), hsl(25 90% 50%))' }}
            >
              完成
            </button>
          </div>
        </>
      )}

      {/* ========== FORGOT phase ========== */}
      {phase === 'forgot' && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-6">
            <ShieldCheck className="w-12 h-12 text-amber-500" />
            <h2 className="mt-4 text-base font-semibold text-foreground">忘记密码</h2>
            <p className="mt-1 text-xs text-muted-foreground">请回答安全问题以重置密码</p>

            <div className="w-full mt-6 space-y-3">
              <div className="w-full rounded-xl bg-white/50 px-4 py-3 text-sm text-foreground/80">
                {getSecurityQuestion()}
              </div>

              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => { setSecurityAnswer(e.target.value); setSecurityError(false) }}
                placeholder="请输入答案"
                className={`w-full h-12 rounded-xl border px-4 text-sm text-foreground placeholder:text-muted-foreground/50 bg-white/70 ${
                  securityError ? 'border-red-400' : 'border-border'
                } ${shaking ? 'animate-shake' : ''}`}
              />

              {securityError && (
                <p className="text-xs text-red-500">答案不正确，请重试</p>
              )}
            </div>

            <button
              onClick={handleForgotVerify}
              disabled={securityAnswer.trim().length === 0}
              className="mt-6 h-12 w-full rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, hsl(32 80% 55%), hsl(25 90% 50%))' }}
            >
              验证
            </button>
          </div>
        </>
      )}

      {/* ========== PIN phases (setup / setup-confirm / verify / unlocking) ========== */}
      {['setup', 'setup-confirm', 'verify', 'unlocking'].includes(phase) && (
        <>
          {/* Center area: lock always centered here */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {/* Lock image */}
            <button
              onClick={() => { if (!isUnlocking && ['setup', 'setup-confirm', 'verify'].includes(phase)) setShowPad(true) }}
              className={`block ${!isUnlocking && !showPad ? 'active:scale-95 transition-transform' : ''}`}
            >
              <img
                src={isUnlocking ? lockUnlockedCatImg : lockClosedImg}
                alt={isUnlocking ? '已解锁' : '已锁定'}
                className={`w-36 h-36 object-contain transition-all duration-500 ${
                  isUnlocking ? 'animate-fade-in scale-105' : ''
                }`}
              />
            </button>

            {/* Hint text */}
            {!isUnlocking && (
              <p className={`mt-4 text-base font-semibold ${isError ? 'text-red-500' : 'text-foreground/80'}`}>
                {showPad ? phaseHint() : '点击锁解锁'}
              </p>
            )}

            {/* Unlocked badge */}
            {isUnlocking && unlockStep >= 1 && (
              <div className="mt-4 animate-fade-in-up">
                <span className="text-base font-bold text-foreground/80">已解锁</span>
              </div>
            )}

            {/* PIN indicators */}
            {!isUnlocking && showPad && (
              <div className={`flex gap-5 mt-4 ${shaking ? 'animate-shake' : ''}`}>
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-150 ${
                      i < pin.length
                        ? 'bg-foreground scale-110'
                        : 'bg-muted-foreground/25'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Number pad */}
          <div className={`flex-shrink-0 px-8 pb-6 ${showNumPad ? '' : 'opacity-0 pointer-events-none'}`}>
            <div className="grid grid-cols-3 gap-2">
              {numKeys.flat().map((key) => {
                if (key === 'cancel') {
                  return (
                    <button
                      key={key}
                      onClick={() => pressKey('cancel')}
                      className="h-12 rounded-2xl text-muted-foreground text-xs font-medium active:bg-black/5 transition-colors"
                    >
                      取消
                    </button>
                  )
                }
                if (key === 'del') {
                  return (
                    <button
                      key={key}
                      onClick={() => pressKey('del')}
                      className="h-12 rounded-2xl flex items-center justify-center text-muted-foreground active:bg-black/5 transition-colors"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  )
                }
                return (
                  <button
                    key={key}
                    onClick={() => pressKey(key)}
                    className="h-12 rounded-2xl bg-white/70 text-foreground text-lg font-medium shadow-sm active:bg-white/90 active:shadow transition-all"
                  >
                    {key}
                  </button>
                )
              })}
            </div>
            {/* Forgot password link */}
            {phase === 'verify' && hasSecurityQuestion() && (
              <button
                onClick={() => { setPhase('forgot'); setPin_(''); setHint(''); setSecurityAnswer(''); setSecurityError(false) }}
                className="mt-3 w-full text-center text-xs text-muted-foreground/60 underline active:opacity-60"
              >
                忘记密码?
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
