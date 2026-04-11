import { useState, useEffect, useCallback, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useApi } from '@/contexts/ApiContext'

// ===== CatMascot =====

const CAT_IMAGES = import.meta.glob('@/assets/pets/cat/*.png', { eager: true, import: 'default' }) as Record<string, string>

function getCatImage(name: string): string {
  const key = Object.keys(CAT_IMAGES).find((k) => k.includes(`/${name}.png`))
  return key ? CAT_IMAGES[key] : ''
}

interface CatMascotProps {
  pose: 'idle' | 'happy' | 'curious' | 'thinking' | 'sitting' | 'auth-welcome' | 'auth-login' | 'auth-register' | 'auth-findpw'
  className?: string
}

export function CatMascot({ pose, className = 'w-40 h-40' }: CatMascotProps) {
  return (
    <img
      src={getCatImage(pose)}
      alt="小橘"
      className={`object-contain ${className}`}
    />
  )
}

// ===== AuthInput =====

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  icon?: React.ReactNode
  error?: boolean
}

export function AuthInput({ icon, error, type: typeProp, ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = typeProp === 'password'

  return (
    <div className={`relative flex items-center h-12 rounded-2xl border bg-secondary/80 px-4 transition-colors ${
      error ? 'border-red-400' : 'border-border/30 focus-within:border-primary/40'
    }`}>
      {icon && <span className="mr-2 flex-shrink-0 text-muted-foreground/60">{icon}</span>}
      <input
        {...props}
        type={isPassword && !showPassword ? 'password' : 'text'}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 text-muted-foreground/50 active:opacity-60"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}

// ===== AuthButton =====

interface AuthButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

export function AuthButton({ children, onClick, disabled, loading, variant = 'primary' }: AuthButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full h-12 rounded-full font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${
        isPrimary
          ? 'text-white shadow-float'
          : 'bg-secondary text-foreground/70 border border-border/40'
      }`}
      style={isPrimary ? { background: 'linear-gradient(135deg, hsl(14 80% 78%), hsl(14 90% 65%))' } : undefined}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          请稍候...
        </span>
      ) : children}
    </button>
  )
}

// ===== CountdownButton =====

interface CountdownButtonProps {
  phone: string
  purpose: 'register' | 'reset_password'
  onError?: (msg: string) => void
}

export function CountdownButton({ phone, purpose, onError }: CountdownButtonProps) {
  const { sendCode } = useApi()
  const [countdown, setCountdown] = useState(0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSend = useCallback(async () => {
    if (countdown > 0 || sending) return
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      onError?.('请输入正确的手机号')
      return
    }
    setSending(true)
    const result = await sendCode(phone, purpose)
    setSending(false)
    if (result.ok) {
      setCountdown(60)
    } else {
      onError?.(result.error || '发送失败')
    }
  }, [phone, purpose, countdown, sending, sendCode, onError])

  const isDisabled = countdown > 0 || sending || !/^1[3-9]\d{9}$/.test(phone)

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={isDisabled}
      className="flex-shrink-0 px-4 h-10 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white"
      style={{ background: 'linear-gradient(135deg, hsl(14 80% 78%), hsl(14 90% 65%))' }}
    >
      {sending ? '...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
    </button>
  )
}
