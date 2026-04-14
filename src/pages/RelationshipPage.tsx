import { useState, useMemo } from 'react'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import {
  COMPANION_LIST,
  RELATION_TYPES,
} from '@/lib/companion'
import type { RelationType } from '@/lib/companion'
import { getRelationDurationText, humanizeStats } from '@/lib/narrative'
import { generateInviteCode } from '@/lib/invite-code'
import { AnniversarySection } from '@/components/anniversary/AnniversarySection'
import { UserAvatar } from '@/components/UserAvatar'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import standingCatImg from '@/assets/pets/cat/standing.png'

interface Props {
  store: Store
  onBack: () => void
  onEditProfile?: (userId: string) => void
}

export function RelationshipPage({ store, onBack, onEditProfile }: Props) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const partner = store.getUserProfile(user.partnerId)
  const relation = RELATION_TYPES[store.space.relationType]
  const [showRelationPicker, setShowRelationPicker] = useState(false)
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  // 生成稳定的邀请码（基于 userId，不随渲染变化）
  const inviteCode = useMemo(() => generateInviteCode(currentUserId), [currentUserId])

  function handleCopyInviteCode() {
    navigator.clipboard?.writeText(inviteCode).catch(() => {})
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const completedCount = store.instances.filter(i => i.status === 'completed').length
  const careCount = store.templates.filter(t => t.itemType === 'care').length
  const stats = humanizeStats({ total: store.instances.length, completed: completedCount, careCount })

  function handleChangeRelation(type: RelationType) {
    store.updateSpaceRelationType(type)
    setShowRelationPicker(false)
  }

  async function handleDissolve() {
    setDissolving(true)
    await store.dissolveRelationship()
    setDissolving(false)
    setShowDissolveConfirm(false)
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">我们的空间</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Hero — static cat + together info */}
        <div className="flex flex-col items-center py-6 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl">
          <img
            src={standingCatImg}
            alt="小橘"
            className="w-32 h-32 object-contain select-none pointer-events-none"
            draggable={false}
          />

          {/* Enlarged together info */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => onEditProfile?.(currentUserId)}
              className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-xl shadow-sm border border-border/30 hover:border-primary/40 transition-all active:scale-95 relative overflow-hidden"
            >
              <UserAvatar avatar={user.avatar} />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center">
                <span className="text-[8px] text-white">✏️</span>
              </div>
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-primary">{relation.emoji} {relation.label}</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">
                {store.relationDays} <span className="text-base font-bold">天</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{getRelationDurationText(store.relationDays)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-xl shadow-sm border border-border/30 overflow-hidden">
              <UserAvatar avatar={partner.avatar} />
            </div>
          </div>
        </div>

        {/* Humanized stats — warm narrative */}
        <div className="bg-card/60 rounded-3xl border border-border/30 p-4 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">{stats.totalText}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{stats.completedText}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{stats.careText}</p>
        </div>

        {/* Anniversary section */}
        <AnniversarySection
          anniversaries={store.space.anniversaries}
          onAdd={store.addAnniversary}
          onRemove={store.removeAnniversary}
          onUpdate={store.updateAnniversary}
        />

        {/* Shared companion — cat active, others greyed out */}
        <div className="bg-card rounded-3xl border border-border/40 p-5">
          <h3 className="text-sm font-bold text-foreground mb-1">我们的陪伴角色</h3>
          <p className="text-xs text-muted-foreground mb-4">选一个你们都喜欢的小动物~</p>
          <div className="grid grid-cols-4 gap-2">
            {COMPANION_LIST.map((c) => {
              const isCat = c.id === 'cat'
              return (
                <div
                  key={c.id}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all ${
                    isCat
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-secondary/30 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {isCat ? (
                    <img
                      src={standingCatImg}
                      alt="小橘"
                      className="w-8 h-8 object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-2xl grayscale">{c.avatar}</span>
                  )}
                  <span className={`text-2xs font-semibold ${
                    isCat ? 'text-primary' : 'text-muted-foreground/50'
                  }`}>
                    {c.name}
                  </span>
                  {!isCat && (
                    <span className="text-[9px] text-muted-foreground/40 -mt-0.5">即将开放</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Relationship settings */}
        <div className="bg-card rounded-3xl border border-border/40 overflow-hidden">
          {/* 编辑个人资料 */}
          <button
            onClick={() => onEditProfile?.(currentUserId)}
            className="w-full px-5 py-4 text-sm text-left text-foreground hover:bg-accent/30 transition-colors flex items-center justify-between"
          >
            <span>编辑个人资料</span>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full overflow-hidden inline-flex items-center justify-center text-base"><UserAvatar avatar={user.avatar} imgClass="w-5 h-5" /></span>
              <span className="text-muted-foreground text-xs">{user.name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
            </div>
          </button>
          <div className="border-t border-border/40" />
          {/* 关系类型 — 点击展开选择 */}
          <button
            onClick={() => setShowRelationPicker(!showRelationPicker)}
            className="w-full px-5 py-4 text-sm text-left text-foreground hover:bg-accent/30 transition-colors flex items-center justify-between"
          >
            <span>关系类型</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{relation.emoji} {relation.label}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showRelationPicker ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showRelationPicker && (
            <div className="px-3 pb-3 animate-fade-in">
              <div className="bg-secondary/50 rounded-2xl p-1.5 space-y-1">
                {(Object.entries(RELATION_TYPES) as [RelationType, typeof RELATION_TYPES[RelationType]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleChangeRelation(key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all active:scale-[0.98] ${
                      store.space.relationType === key
                        ? 'bg-card shadow-sm'
                        : 'hover:bg-card/60'
                    }`}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    <div className="text-left flex-1">
                      <span className={`text-sm font-semibold ${
                        store.space.relationType === key ? 'text-primary' : 'text-foreground'
                      }`}>
                        {config.label}
                      </span>
                      <p className="text-2xs text-muted-foreground">{config.desc}</p>
                    </div>
                    {store.space.relationType === key && (
                      <span className="text-xs text-primary font-bold">当前</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border/40" />
          <button
            onClick={() => setShowInviteCode(!showInviteCode)}
            className="w-full px-5 py-4 text-sm text-left text-foreground hover:bg-accent/30 transition-colors flex items-center justify-between"
          >
            <span>邀请码</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-mono">{showInviteCode ? '收起' : '查看'}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showInviteCode ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showInviteCode && (
            <div className="px-5 pb-4 animate-fade-in">
              <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center">你的专属邀请码</p>
                <p className="text-xl font-bold font-mono text-center text-primary tracking-wider">{inviteCode}</p>
                <p className="text-2xs text-muted-foreground text-center leading-relaxed">
                  把邀请码分享给对方，TA 在引导页输入后即可加入你们的共享空间
                </p>
                <button
                  onClick={handleCopyInviteCode}
                  className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    inviteCopied
                      ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
                      : 'bg-primary/10 text-primary hover:bg-primary/15'
                  }`}
                >
                  {inviteCopied ? '已复制到剪贴板' : '复制邀请码'}
                </button>
              </div>
            </div>
          )}
          <div className="border-t border-border/40" />
          <button
            onClick={() => store.resetOnboarding(currentUserId)}
            className="w-full px-5 py-4 text-sm text-left text-primary hover:bg-accent/30 transition-colors"
          >
            重新设置引导流程
          </button>
        </div>

        {/* Dissolve relationship */}
        <div className="pt-4 pb-8">
          <button
            onClick={() => setShowDissolveConfirm(true)}
            className="w-full py-3 text-sm text-destructive/80 hover:text-destructive transition-colors"
          >
            解除关系
          </button>
        </div>
      </div>

      {/* Dissolve confirmation overlay */}
      {showDissolveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="mx-6 w-full max-w-[300px] bg-card rounded-3xl border border-border/40 p-6 shadow-xl animate-scale-in">
            <div className="text-center mb-4">
              <span className="text-3xl">💔</span>
              <h3 className="text-base font-bold text-foreground mt-2">确定要解除关系吗？</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                解除后将切回单人模式，共享空间和纪念日将被清除，但各自的记录会保留。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDissolveConfirm(false)}
                disabled={dissolving}
                className="flex-1 py-2.5 text-sm font-medium text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
              >
                再想想
              </button>
              <button
                onClick={handleDissolve}
                disabled={dissolving}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-destructive rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {dissolving ? '解除中...' : '确定解除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
