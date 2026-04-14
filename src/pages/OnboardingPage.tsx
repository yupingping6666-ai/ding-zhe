import { useState, useMemo } from 'react'
import type { Store } from '@/store'
import { getUser } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import {
  COMPANION_CHARACTERS,
  COMPANION_LIST,
  RELATION_TYPES,
  getCompanionMessage,
} from '@/lib/companion'
import type { CompanionAnimal, RelationType } from '@/lib/companion'
import { generateInviteCode, resolveInviteCode } from '@/lib/invite-code'
import { ArrowRight, Copy, Check } from 'lucide-react'
import standingCatImg from '@/assets/pets/cat/standing.png'
import happyCatImg from '@/assets/pets/cat/happy.png'
import loveCatImg from '@/assets/pets/cat/love.png'

interface Props {
  store: Store
  onComplete: () => void
}

type Step = 'welcome' | 'character' | 'relation' | 'invite' | 'done'

export function OnboardingPage({ store, onComplete }: Props) {
  const currentUserId = useCurrentUser()
  const user = getUser(currentUserId)
  const [step, setStep] = useState<Step>('welcome')
  const [selectedAnimal, setSelectedAnimal] = useState<CompanionAnimal>(store.space.companion)
  const [selectedRelation, setSelectedRelation] = useState<RelationType>('couple')
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  const character = COMPANION_CHARACTERS[selectedAnimal]
  const inviteCode = useMemo(() => generateInviteCode(currentUserId), [currentUserId])
  const alreadyPaired = user.partnerId && user.partnerId.length > 0

  function handleCharacterConfirm() {
    store.updateSpaceCompanion(selectedAnimal)
    setStep('relation')
  }

  function handleRelationConfirm() {
    store.updateSpaceRelationType(selectedRelation)
    // If already paired (via invite code), skip invite step
    if (alreadyPaired) {
      setStep('done')
    } else {
      setStep('invite')
    }
  }

  function handleInviteConfirm() {
    setStep('done')
  }

  function handleDone() {
    store.completeOnboarding(currentUserId)
    onComplete()
  }

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

  // ---- Welcome step ----
  if (step === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[700px] px-8 text-center">
        <div className="mb-8 animate-float">
          <span className="text-7xl block">🌸</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-3">
          欢迎来到要记得哦
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          这是属于你们的关系事项空间
        </p>
        <p className="text-xs text-muted-foreground/70 leading-relaxed mb-10">
          在这里，你可以温柔地提醒TA、<br />
          请TA帮忙做事、<br />
          或者确认TA的反馈。<br />
          有一个小动物会陪伴你们~
        </p>
        <button
          onClick={() => setStep('character')}
          className="flex items-center gap-2 px-8 py-4 rounded-full gradient-float-btn text-primary-foreground shadow-float text-base font-bold active:scale-95 transition-all"
        >
          开始设置
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // ---- Character selection step ----
  if (step === 'character') {
    return (
      <div className="px-6 pt-8 pb-6">
        <div className="text-center mb-8">
          <img src={happyCatImg} alt="小橘" className="w-16 h-16 object-contain mx-auto mb-3 animate-float" draggable={false} />
          <h2 className="text-xl font-extrabold text-foreground mb-1">
            选择你们的陪伴小动物
          </h2>
          <p className="text-sm text-muted-foreground">
            {character.name}会陪伴你们一起提醒、反馈和鼓励~
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {COMPANION_LIST.map((c) => {
            const isCat = c.id === 'cat'
            return (
              <button
                key={c.id}
                onClick={() => { if (isCat) setSelectedAnimal(c.id) }}
                disabled={!isCat}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl border-2 transition-all ${
                  isCat
                    ? 'border-primary bg-primary/5 shadow-card-default active:scale-95'
                    : 'border-transparent bg-secondary/30 opacity-40 cursor-not-allowed'
                }`}
              >
                {isCat ? (
                  <img src={standingCatImg} alt="小橘" className="w-10 h-10 object-contain" draggable={false} />
                ) : (
                  <span className="text-3xl grayscale">{c.avatar}</span>
                )}
                <span className={`text-xs font-semibold ${
                  isCat ? 'text-primary' : 'text-muted-foreground/50'
                }`}>
                  {c.name}
                </span>
                {!isCat && (
                  <span className="text-[9px] text-muted-foreground/40 -mt-1">即将开放</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Preview */}
        <div className="bg-card rounded-3xl border border-border/40 p-5 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">预览</p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={loveCatImg} alt="小橘" className="w-14 h-14 object-contain" draggable={false} />
          </div>
          <p className="text-sm text-foreground font-semibold">
            {getCompanionMessage(character, 'welcome').text}
          </p>
        </div>

        <button
          onClick={handleCharacterConfirm}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full gradient-float-btn text-primary-foreground shadow-float text-base font-bold active:scale-95 transition-all"
        >
          就选{character.name}啦!
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // ---- Relation type step ----
  if (step === 'relation') {
    return (
      <div className="px-6 pt-8 pb-6">
        <div className="text-center mb-8">
          <img src={loveCatImg} alt="小橘" className="w-14 h-14 object-contain mx-auto mb-3" draggable={false} />
          <h2 className="text-xl font-extrabold text-foreground mb-1">
            你和对方是什么关系?
          </h2>
          <p className="text-sm text-muted-foreground">
            {character.name}会根据关系调整表达方式~
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {(Object.entries(RELATION_TYPES) as [RelationType, typeof RELATION_TYPES[RelationType]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedRelation(key)}
              className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 transition-all active:scale-[0.98] ${
                selectedRelation === key
                  ? 'border-primary bg-primary/5 shadow-card-default'
                  : 'border-transparent bg-card hover:bg-accent/30'
              }`}
            >
              <span className="text-2xl">{config.emoji}</span>
              <div className="text-left">
                <span className={`text-sm font-bold ${
                  selectedRelation === key ? 'text-primary' : 'text-foreground'
                }`}>
                  {config.label}
                </span>
                <p className="text-xs text-muted-foreground">{config.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleRelationConfirm}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full gradient-float-btn text-primary-foreground shadow-float text-base font-bold active:scale-95 transition-all"
        >
          下一步
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // ---- Invite step ----
  if (step === 'invite') {
    const relationLabel = RELATION_TYPES[selectedRelation].label
    return (
      <div className="px-6 pt-8 pb-6">
        <div className="text-center mb-8">
          <img src={happyCatImg} alt="小橘" className="w-14 h-14 object-contain mx-auto mb-3 animate-float" draggable={false} />
          <h2 className="text-xl font-extrabold text-foreground mb-1">
            邀请你的另一半加入
          </h2>
          <p className="text-sm text-muted-foreground">
            把邀请码发给TA，建立你们的专属空间
          </p>
        </div>

        {/* Invite code card */}
        <div className="bg-card rounded-3xl border border-border/40 p-6 mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">你的邀请码</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-2xl font-mono font-extrabold text-foreground tracking-widest">
              {inviteCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {copied ? '已复制!' : '点击复制，发给对方~'}
          </p>
        </div>

        {/* Or join with code */}
        <div className="bg-card rounded-3xl border border-border/40 p-5 mb-6">
          <p className="text-xs text-muted-foreground mb-3 text-center">或者输入对方的邀请码</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinError('') }}
              placeholder="输入邀请码..."
              className="flex-1 min-w-0 h-11 px-4 rounded-full bg-secondary border-none text-sm text-center font-mono tracking-widest placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleJoin}
              className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all shrink-0 whitespace-nowrap"
            >
              加入
            </button>
          </div>
          {joinError && (
            <p className="text-xs text-destructive text-center mt-2 animate-fade-in">{joinError}</p>
          )}
        </div>

        <button
          onClick={handleInviteConfirm}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full gradient-float-btn text-primary-foreground shadow-float text-base font-bold active:scale-95 transition-all"
        >
          完成设置
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleInviteConfirm}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          先跳过，稍后邀请
        </button>
      </div>
    )
  }

  // ---- Done step ----
  return (
    <div className="flex flex-col items-center justify-center min-h-[700px] px-8 text-center">
      <div className="mb-6">
        <img src={happyCatImg} alt="小橘" className="w-20 h-20 object-contain animate-float" draggable={false} />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-3">
        一切准备就绪!
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        {character.name}已经准备好陪伴你们啦
      </p>
      <p className="text-xs text-muted-foreground/70 mb-10">
        现在你可以给{RELATION_TYPES[selectedRelation].label}创建关心、待办或反馈了~
      </p>
      <button
        onClick={handleDone}
        className="flex items-center gap-2 px-8 py-4 rounded-full gradient-float-btn text-primary-foreground shadow-float text-base font-bold active:scale-95 transition-all"
      >
        <img src={happyCatImg} alt="" className="w-5 h-5 object-contain inline" draggable={false} /> 开始使用
      </button>
    </div>
  )
}
