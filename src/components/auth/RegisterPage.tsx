import { useState } from 'react'
import { ChevronLeft, Smartphone, Lock } from 'lucide-react'
import { useApi } from '@/contexts/ApiContext'
import { AuthInput, AuthButton, CountdownButton } from './shared'
import registerCatImg from '@/assets/pets/cat/register-cat.png'

interface RegisterPageProps {
  onNavigate: (screen: 'welcome') => void
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { register } = useApi()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = /^1[3-9]\d{9}$/.test(phone) && code.length >= 4 && password.length >= 6 && agreed

  const handleRegister = async () => {
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)
    const result = await register(phone, code, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || '注册失败')
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, hsl(32 70% 96%) 0%, hsl(30 50% 94%) 50%, hsl(32 60% 97%) 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => onNavigate('welcome')} className="flex items-center gap-1 text-muted-foreground active:opacity-60">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto scrollbar-hide">
        {/* Cat image - centered above title */}
        <div className="flex justify-center -mb-2">
          <img
            src={registerCatImg}
            alt="小橘"
            draggable={false}
            className="w-40 h-40 object-contain drop-shadow-md select-none pointer-events-none"
          />
        </div>

        {/* Title - centered below cat */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-foreground">手机注册</h1>
          <p className="mt-1 text-sm text-muted-foreground">开启你的情绪记录之旅</p>
        </div>

        <div className="w-full mt-4 space-y-2.5">
          <AuthInput
            icon={<Smartphone className="w-4 h-4" />}
            placeholder="手机号码"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError('') }}
            inputMode="numeric"
            maxLength={11}
            error={!!error}
          />

          <p className="text-xs text-muted-foreground/60 px-1">✦ 这是你 AI 情绪档案的开启钥匙</p>

          {/* Verification code row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AuthInput
                placeholder="短信验证码"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError('') }}
                inputMode="numeric"
                maxLength={6}
                error={!!error}
              />
            </div>
            <CountdownButton
              phone={phone}
              purpose="register"
              onError={setError}
            />
          </div>

          <AuthInput
            icon={<Lock className="w-4 h-4" />}
            placeholder="设置密码（至少6位）"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            error={!!error}
          />

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          {/* Agreement */}
          <label className="flex items-start gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              我已阅读并同意<span className="text-primary/70">《Link 用户协议》</span>和<span className="text-primary/70">《隐私政策》</span>
            </span>
          </label>
        </div>

        <div className="w-full mt-4 pb-4">
          <AuthButton onClick={handleRegister} disabled={!canSubmit} loading={loading}>
            注册并开启档案
          </AuthButton>
        </div>
      </div>
    </div>
  )
}
