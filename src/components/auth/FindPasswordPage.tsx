import { useState } from 'react'
import { ChevronLeft, Smartphone, Lock } from 'lucide-react'
import { useApi } from '@/contexts/ApiContext'
import { AuthInput, AuthButton, CountdownButton } from './shared'
import findpwCatImg from '@/assets/pets/cat/findpw-cat.png'

interface FindPasswordPageProps {
  onNavigate: (screen: 'welcome' | 'login') => void
}

export function FindPasswordPage({ onNavigate }: FindPasswordPageProps) {
  const { resetPassword } = useApi()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = /^1[3-9]\d{9}$/.test(phone) && code.length >= 4 && newPassword.length >= 6

  const handleReset = async () => {
    if (!canSubmit || loading) return
    setError('')
    setLoading(true)
    const result = await resetPassword(phone, code, newPassword)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || '重置失败')
    }
    // Success: resetPassword in ApiContext auto-sets authenticated state
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, hsl(32 70% 96%) 0%, hsl(30 50% 94%) 50%, hsl(32 60% 97%) 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => onNavigate('login')} className="flex items-center gap-1 text-muted-foreground active:opacity-60">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto scrollbar-hide">
        {/* Cat LEFT + Title RIGHT */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <img
            src={findpwCatImg}
            alt="小橘"
            draggable={false}
            className="w-40 h-40 object-contain flex-shrink-0 select-none pointer-events-none"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">找回密码</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">重新连接，安全升级</p>
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
              purpose="reset_password"
              onError={setError}
            />
          </div>

          <p className="text-xs text-muted-foreground/60 px-1">验证身份后即可设置新密码</p>

          <AuthInput
            icon={<Lock className="w-4 h-4" />}
            placeholder="设置新密码（至少6位）"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError('') }}
            error={!!error}
          />

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>

        <div className="w-full mt-6 pb-8">
          <AuthButton onClick={handleReset} disabled={!canSubmit} loading={loading}>
            验证并设置密码
          </AuthButton>
        </div>
      </div>
    </div>
  )
}
