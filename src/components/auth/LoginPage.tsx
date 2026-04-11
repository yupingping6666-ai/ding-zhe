import { useState } from 'react'
import { Smartphone, Lock, ChevronLeft } from 'lucide-react'
import { useApi } from '@/contexts/ApiContext'
import { AuthInput, AuthButton } from './shared'
import loginCatImg from '@/assets/pets/cat/login-cat.png'
import pawIcon from '@/assets/pets/cat/paw-icon.png'

interface LoginPageProps {
  onNavigate: (screen: 'welcome' | 'find-password') => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { loginWithPhone } = useApi()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = /^1[3-9]\d{9}$/.test(phone) && password.length >= 1

  const handleLogin = async () => {
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)
    const result = await loginWithPhone(phone, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || '登录失败')
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, hsl(32 70% 96%) 0%, hsl(30 50% 94%) 50%, hsl(32 60% 97%) 100%)' }}
    >
      {/* Fake status bar */}
      <div className="flex items-center justify-between px-8 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✿</span>
          <span className="text-xs font-semibold text-foreground">小红</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-[3px]">
            <div className="w-[3px] h-[6px] bg-foreground rounded-sm" />
            <div className="w-[3px] h-[8px] bg-foreground rounded-sm" />
            <div className="w-[3px] h-[10px] bg-foreground rounded-sm" />
            <div className="w-[3px] h-[12px] bg-foreground rounded-sm" />
          </div>
          <span className="text-[10px] font-medium text-foreground ml-1">100%</span>
          <div className="w-6 h-3 border border-foreground rounded-sm ml-0.5 relative">
            <div className="absolute inset-[1.5px] bg-foreground rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="flex items-center px-4 pb-2 flex-shrink-0">
        <button onClick={() => onNavigate('welcome')} className="flex items-center gap-1 text-muted-foreground active:opacity-60">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto scrollbar-hide">
        {/* Cat head LEFT + Title RIGHT */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <img
            src={loginCatImg}
            alt="小橘"
            draggable={false}
            className="w-40 h-40 object-contain flex-shrink-0 select-none pointer-events-none"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">手机登录</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">回到你的档案空间</p>
          </div>
        </div>

        <div className="w-full mt-6 space-y-3">
          <AuthInput
            icon={<Smartphone className="w-4 h-4" />}
            placeholder="手机号码"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError('') }}
            inputMode="numeric"
            maxLength={11}
            error={!!error}
          />

          <p className="flex items-center gap-1 text-xs text-muted-foreground/60 px-1">
            <img src={pawIcon} alt="" className="w-5 h-5 object-contain opacity-40 grayscale" />
            请输入手机号码
          </p>

          <AuthInput
            icon={<Lock className="w-4 h-4" />}
            placeholder="密码"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            error={!!error}
          />

          <div className="flex justify-end">
            <button
              onClick={() => onNavigate('find-password')}
              className="text-xs text-primary/70 active:opacity-60"
            >
              忘记密码?
            </button>
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>

        <div className="w-full mt-6">
          <AuthButton onClick={handleLogin} disabled={!canSubmit} loading={loading}>
            登录
          </AuthButton>
        </div>

        <button className="mt-4 text-xs font-medium text-muted-foreground active:opacity-60">
          短信验证码登录
        </button>
      </div>
    </div>
  )
}
