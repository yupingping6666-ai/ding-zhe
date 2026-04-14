import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/contexts/UserContext'
import { generateInviteCode, resolveInviteCode } from '@/lib/invite-code'
import { Copy, Check, UserPlus } from 'lucide-react'
import type { Store } from '@/store'
import happyCatImg from '@/assets/pets/cat/happy.png'

interface Props {
  store: Store
  variant: 'hero' | 'compact'
}

export function InvitePairCard({ store, variant }: Props) {
  const currentUserId = useCurrentUser()
  const inviteCode = useMemo(() => generateInviteCode(currentUserId), [currentUserId])
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)

  function handleCopy() {
    navigator.clipboard?.writeText(inviteCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      setJoinError('请输入邀请码')
      return
    }
    if (code === inviteCode) {
      setJoinError('不能输入自己的邀请码哦~')
      return
    }
    const targetUser = resolveInviteCode(code, store.users)
    if (!targetUser) {
      setJoinError('邀请码无效，请检查后重试')
      return
    }
    if (targetUser.partnerId && targetUser.partnerId.length > 0) {
      setJoinError('对方已经有搭档了')
      return
    }
    const currentUser = store.users.find(u => u.id === currentUserId)
    if (currentUser?.partnerId && currentUser.partnerId.length > 0) {
      setJoinError('你已经配对了')
      return
    }
    setJoinError('')
    store.bindPartner(currentUserId, targetUser.id)
  }

  if (variant === 'hero') {
    return (
      <div className="bg-gradient-to-br from-primary/8 via-care/5 to-primary/10 rounded-3xl border border-primary/15 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <img src={happyCatImg} alt="" className="w-12 h-12 object-contain" draggable={false} />
          <div>
            <h3 className="text-base font-bold text-foreground">邀请TA一起加入</h3>
            <p className="text-xs text-muted-foreground mt-0.5">分享邀请码，建立你们的专属空间</p>
          </div>
        </div>

        {/* My invite code */}
        <div className="bg-white/80 rounded-2xl p-4 text-center">
          <p className="text-2xs text-muted-foreground mb-2">我的邀请码</p>
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-xl font-mono font-extrabold text-foreground tracking-widest">{inviteCode}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-2xs text-muted-foreground mt-1.5">
            {copied ? '已复制!' : '复制后发给对方~'}
          </p>
        </div>

        {/* Join with partner code */}
        {!showJoinInput ? (
          <button
            onClick={() => setShowJoinInput(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-sm font-medium text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            输入对方的邀请码加入
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value); setJoinError('') }}
                placeholder="输入对方邀请码..."
                className="flex-1 min-w-0 h-10 px-4 rounded-xl bg-white border border-border/40 text-sm text-center font-mono tracking-widest placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleJoin}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all shrink-0"
              >
                加入
              </button>
            </div>
            {joinError && (
              <p className="text-xs text-destructive text-center animate-fade-in">{joinError}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // compact variant
  return (
    <div className="bg-card rounded-3xl border border-border/40 p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <UserPlus className="w-4.5 h-4.5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">邀请配对</h3>
      </div>

      {/* My invite code */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
        <div>
          <p className="text-2xs text-muted-foreground">我的邀请码</p>
          <span className="text-base font-mono font-bold text-foreground tracking-widest">{inviteCode}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      {copied && <p className="text-2xs text-primary text-center -mt-1">已复制!</p>}

      {/* Join input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => { setJoinCode(e.target.value); setJoinError('') }}
          placeholder="输入对方邀请码..."
          className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-secondary border-none text-sm text-center font-mono tracking-widest placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleJoin}
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all shrink-0"
        >
          加入
        </button>
      </div>
      {joinError && (
        <p className="text-xs text-destructive text-center animate-fade-in">{joinError}</p>
      )}
    </div>
  )
}
