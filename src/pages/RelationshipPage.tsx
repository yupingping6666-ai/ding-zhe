import { useState } from 'react'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import {
  COMPANION_CHARACTERS,
  COMPANION_LIST,
  RELATION_TYPES,
} from '@/lib/companion'
import type { CompanionAnimal, RelationType } from '@/lib/companion'
import { getRelationDurationText, humanizeStats } from '@/lib/narrative'
import { FullSpaceScene } from '@/components/space/FullSpaceScene'
import { AnniversarySection } from '@/components/anniversary/AnniversarySection'
import { ArrowLeft, ChevronDown } from 'lucide-react'

interface Props {
  store: Store
  onBack: () => void
}

export function RelationshipPage({ store, onBack }: Props) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const partner = store.getUserProfile(user.partnerId)
  const character = COMPANION_CHARACTERS[store.space.companion]
  const relation = RELATION_TYPES[store.space.relationType]
  const [showRelationPicker, setShowRelationPicker] = useState(false)

  const completedCount = store.instances.filter(i => i.status === 'completed').length
  const careCount = store.templates.filter(t => t.itemType === 'care').length
  const stats = humanizeStats({ total: store.instances.length, completed: completedCount, careCount })

  function handleChangeCompanion(animal: CompanionAnimal) {
    store.updateSpaceCompanion(animal)
  }

  function handleChangeRelation(type: RelationType) {
    store.updateSpaceRelationType(type)
    setShowRelationPicker(false)
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
        {/* Full space scene — pet protagonist */}
        <FullSpaceScene
          character={character}
          petState={store.currentPetState}
          todayCompleted={store.todayCompletedCount}
          todayTotal={store.todayTotalCount}
          todayCareCount={store.todayCareCount}
          relationDays={store.relationDays}
          todayAnniversaries={store.todayAnniversaries}
          onInteract={store.petInteraction}
        />

        {/* Relationship info — avatars + duration */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-lg shadow-sm">
            {user.avatar}
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-primary">{relation.emoji} {relation.label}</p>
            <p className="text-2xs text-muted-foreground">{getRelationDurationText(store.relationDays)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-lg shadow-sm">
            {partner.avatar}
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
        />

        {/* Shared companion */}
        <div className="bg-card rounded-3xl border border-border/40 p-5">
          <h3 className="text-sm font-bold text-foreground mb-1">我们的陪伴角色</h3>
          <p className="text-xs text-muted-foreground mb-4">选一个你们都喜欢的小动物~</p>
          <div className="grid grid-cols-4 gap-2">
            {COMPANION_LIST.map((c) => (
              <button
                key={c.id}
                onClick={() => handleChangeCompanion(c.id)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all active:scale-95 ${
                  store.space.companion === c.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-secondary/50 hover:bg-accent/30'
                }`}
              >
                <span className="text-2xl">{c.avatar}</span>
                <span className={`text-2xs font-semibold ${
                  store.space.companion === c.id ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Relationship settings */}
        <div className="bg-card rounded-3xl border border-border/40 overflow-hidden">
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
          <button className="w-full px-5 py-4 text-sm text-left text-foreground hover:bg-accent/30 transition-colors flex items-center justify-between">
            <span>邀请码</span>
            <span className="text-muted-foreground text-xs font-mono">查看</span>
          </button>
          <div className="border-t border-border/40" />
          <button
            onClick={() => store.resetOnboarding(currentUserId)}
            className="w-full px-5 py-4 text-sm text-left text-primary hover:bg-accent/30 transition-colors"
          >
            重新设置引导流程
          </button>
        </div>
      </div>
    </div>
  )
}
