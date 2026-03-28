import { useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import { SentItemCard } from '@/components/SentItemCard'
import { ITEM_TYPE_CONFIG } from '@/types'
import { formatTime } from '@/lib/time'
import type { Store } from '@/store'
import { getUser } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS, getCompanionMessage } from '@/lib/companion'
import { MiniSpaceScene } from '@/components/space/MiniSpaceScene'
import { Mic, Bell } from 'lucide-react'

interface Props {
  store: Store
  onOpenDetail: (templateId: string) => void
  onTriggerReminder: (instanceId: string) => void
  onVoiceCreate: () => void
}

type HomeTab = 'received' | 'sent'

export function HomePage({ store, onOpenDetail, onTriggerReminder, onVoiceCreate }: Props) {
  const currentUserId = useCurrentUser()
  const [tab, setTab] = useState<HomeTab>('received')
  const [expandedUpcoming, setExpandedUpcoming] = useState<Set<string>>(new Set())

  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  const { getTemplate, completeInstance, deferInstance, skipInstance, cantDoInstance, respondWithFeedback } = store
  const receivedItems = store.getReceivedItems(currentUserId)
  const sentItems = store.getSentItems(currentUserId)
  const notifications = store.getUserNotifications(currentUserId)

  // ---- Received tab sections (relationship language) ----
  const needResponse = receivedItems.filter((i) => i.status === 'deferred')
  const needAction = receivedItems.filter((i) => i.status === 'awaiting')
  const upcoming = receivedItems.filter((i) => i.status === 'pending')
  const handled = receivedItems.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired'
  )

  const doneCount = handled.filter((i) => i.status === 'completed').length
  const activeCount = needResponse.length + needAction.length

  // ---- Sent tab sections (progress tracking) ----
  const sentWaiting = sentItems.filter((i) =>
    i.status === 'pending' || i.status === 'awaiting' ||
    (i.status === 'deferred' && i.relationStatus !== 'responded')
  )
  const sentProcessing = sentItems.filter((i) =>
    i.status === 'deferred' && i.relationStatus === 'responded'
  )
  const sentDone = sentItems.filter((i) => i.status === 'completed')
  const sentFailed = sentItems.filter((i) => i.status === 'skipped')

  return (
    <div className="pb-4">
      {/* Space scene header */}
      <div className="relative">
        <MiniSpaceScene
          character={character}
          petState={store.currentPetState}
          todayCompleted={store.todayCompletedCount}
          todayTotal={store.todayTotalCount}
          todayCareCount={store.todayCareCount}
          relationDays={store.relationDays}
          todayAnniversaries={store.todayAnniversaries}
        />
        {/* Overlaid title + notifications */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3">
          <h1 className="text-lg font-extrabold text-foreground/80">要记得哦</h1>
          {notifications.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-foreground/60" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center animate-badge-bounce">
                <span className="text-[9px] text-primary-foreground font-bold">{notifications.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dual tabs — pill style */}
      <div className="px-5 pt-3">
        <div className="flex bg-secondary/80 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'received'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            我收到的
            {activeCount > 0 && tab !== 'received' && (
              <span className="ml-1.5 text-xs bg-deferred/15 text-deferred px-2 py-0.5 rounded-full font-bold">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'sent'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            我发出的
            {sentItems.length > 0 && tab !== 'sent' && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {sentItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications banner — warm bubble */}
      {notifications.length > 0 && tab === 'received' && (
        <div className="px-4 mt-3">
          <div className="bg-care-surface/70 border border-care/15 rounded-2xl p-3.5 space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="flex items-center gap-2.5">
                <span className="text-sm">💌</span>
                <p className="text-xs text-foreground flex-1 truncate leading-relaxed">{n.message}</p>
                <button
                  onClick={() => store.dismissNotification(n.id)}
                  className="text-2xs text-care-foreground font-semibold hover:text-foreground px-2 py-0.5 rounded-full bg-care/10"
                >
                  知道了
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== RECEIVED TAB ======== */}
      {tab === 'received' && (
        <>
          {/* Warm stats summary */}
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {doneCount > 0 && activeCount > 0
                ? `已温柔回应 ${doneCount} 件，还有 ${activeCount} 件等着你~`
                : doneCount > 0
                  ? `今天已温柔回应了 ${doneCount} 件小事 🌟`
                  : activeCount > 0
                    ? `有 ${activeCount} 件小事在等你回应~`
                    : ''
              }
            </p>
          </div>

          {/* Section 1: 等你回应的 */}
          {needResponse.length > 0 && (
            <section className="px-4 mt-3 animate-fade-in">
              <SectionHeader emoji="💭" title="等你回应的" count={needResponse.length} color="deferred" />
              <div className="space-y-3">
                {needResponse.map((inst) => (
                  <TaskCard
                    key={inst.id}
                    instance={inst}
                    template={getTemplate(inst.templateId)}
                    onComplete={completeInstance}
                    onDefer={deferInstance}
                    onSkip={skipInstance}
                    onCantDo={cantDoInstance}
                    onFeedback={respondWithFeedback}
                    onTapName={() => onOpenDetail(inst.templateId)}
                    variant="deferred"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state — companion character */}
          {needResponse.length === 0 && needAction.length === 0 && (
            <section className="px-4 mt-6">
              <div className="text-center py-10 bg-success-surface/50 rounded-3xl border border-success/10">
                <span className="text-4xl mb-2 block animate-float">{character.expressions.sleeping}</span>
                <p className="text-sm font-bold text-foreground">{getCompanionMessage(character, 'empty_all').text}</p>
                <p className="text-xs text-muted-foreground mt-1">保持这个节奏~</p>
              </div>
            </section>
          )}

          {/* Section 2: 等你处理的 */}
          {needAction.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="📋" title="等你处理的" color="awaiting" />
              <div className="space-y-3">
                {needAction.map((inst) => (
                  <div key={inst.id} onClick={() => onTriggerReminder(inst.id)} className="cursor-pointer">
                    <TaskCard
                      instance={inst}
                      template={getTemplate(inst.templateId)}
                      onComplete={completeInstance}
                      onDefer={deferInstance}
                      onSkip={skipInstance}
                      onCantDo={cantDoInstance}
                      onFeedback={respondWithFeedback}
                      onTapName={() => onOpenDetail(inst.templateId)}
                      variant="awaiting"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: 待会儿的事 — 默认收起，点击展开操作 */}
          {upcoming.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="⏰" title="待会儿的事" count={upcoming.length} />
              <div className="space-y-3">
                {upcoming.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                  const isExpanded = expandedUpcoming.has(inst.id)
                  const sender = tpl.creatorId !== tpl.receiverId
                    ? getUser(tpl.creatorId)
                    : null

                  if (isExpanded) {
                    return (
                      <TaskCard
                        key={inst.id}
                        instance={inst}
                        template={tpl}
                        onComplete={completeInstance}
                        onDefer={deferInstance}
                        onSkip={skipInstance}
                        onCantDo={cantDoInstance}
                        onFeedback={respondWithFeedback}
                        onTapName={() => onOpenDetail(inst.templateId)}
                        variant="pending"
                      />
                    )
                  }

                  return (
                    <div
                      key={inst.id}
                      onClick={() => setExpandedUpcoming((prev) => new Set(prev).add(inst.id))}
                      className="flex items-center gap-3 px-4 py-3.5 bg-card/80 rounded-3xl border border-border/40 shadow-sm hover:bg-accent/30 transition-colors cursor-pointer active:bg-accent/50"
                    >
                      <span className="text-lg">{typeConf.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate block">
                          {tpl.name}
                        </span>
                        {sender && (
                          <span className="text-2xs text-muted-foreground">
                            {sender.name}{typeConf.senderVerb}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`sticker sticker-${tpl.itemType}`}>{typeConf.label}</span>
                        <span className="text-xs text-muted-foreground/70">{formatTime(inst.scheduledTime)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Section 4: 你已处理的 — 点击跳转详情页 */}
          {handled.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="✨" title="你已处理的" />
              <div className="bg-card rounded-3xl border border-border/40 divide-y divide-border/40 overflow-hidden">
                {handled.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                  const statusEmoji = inst.status === 'completed' ? '🌟' :
                    inst.status === 'skipped' ? '⏭' : '⏰'
                  const statusText = inst.status === 'completed'
                    ? `${formatTime(inst.completedAt!)} 完成`
                    : inst.status === 'skipped'
                      ? (inst.actionLog.some(a => a.action === 'cant_do') ? '做不了' : '跳过了')
                      : '没来得及'

                  return (
                    <div
                      key={inst.id}
                      onClick={() => onOpenDetail(inst.templateId)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 active:bg-accent/50 transition-colors"
                    >
                      <span className="text-base opacity-50">{typeConf.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-muted-foreground truncate block">{tpl.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{statusEmoji}</span>
                        <span className="text-xs text-muted-foreground">{statusText}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Voice FAB */}
          <div className="flex justify-center pt-6 pb-2">
            <button
              onClick={onVoiceCreate}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-full gradient-float-btn text-primary-foreground shadow-float active:scale-95 transition-all hover:shadow-xl"
            >
              <Mic className="w-5 h-5" />
              <span className="text-sm font-bold">说一句话</span>
            </button>
          </div>
        </>
      )}

      {/* ======== SENT TAB — grouped by progress ======== */}
      {tab === 'sent' && (
        <>
          {sentItems.length === 0 ? (
            <section className="px-4 mt-8">
              <div className="text-center py-12">
                <span className="text-4xl mb-3 block animate-float">{character.expressions.idle}</span>
                <p className="text-sm font-bold text-foreground">{getCompanionMessage(character, 'empty_sent').text}</p>
                <p className="text-xs text-muted-foreground mt-1.5">给TA创建一个关心或小任务吧</p>
              </div>
            </section>
          ) : (
            <div className="px-4 mt-3 space-y-5">
              {/* 等对方回应 */}
              {sentWaiting.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="💌" title="等TA回应" count={sentWaiting.length} />
                  <div className="space-y-3">
                    {sentWaiting.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}

              {/* 对方处理中 */}
              {sentProcessing.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="⏳" title="TA处理中" count={sentProcessing.length} />
                  <div className="space-y-3">
                    {sentProcessing.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}

              {/* 已完成 */}
              {sentDone.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="🎉" title="已完成" count={sentDone.length} />
                  <div className="space-y-3">
                    {sentDone.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}

              {/* 做不了 */}
              {sentFailed.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="😅" title="做不了" count={sentFailed.length} />
                  <div className="space-y-3">
                    {sentFailed.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* Section header component */
function SectionHeader({ emoji, title, count, color }: {
  emoji: string
  title: string
  count?: number
  color?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{emoji}</span>
      <h2 className={`text-sm font-bold ${
        color === 'deferred' ? 'text-deferred-foreground' :
        color === 'awaiting' ? 'text-awaiting-foreground' :
        'text-foreground'
      }`}>
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          color === 'deferred' ? 'bg-deferred/10 text-deferred' :
          color === 'awaiting' ? 'bg-awaiting/10 text-awaiting' :
          'bg-secondary text-muted-foreground'
        }`}>
          {count}
        </span>
      )}
    </div>
  )
}
