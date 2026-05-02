import { useState } from 'react'
import { TaskCard } from '@/components/TaskCard'
import { SentItemCard } from '@/components/SentItemCard'
import { SectionHeader } from '@/components/SectionHeader'
import { ITEM_TYPE_CONFIG } from '@/types'
import { formatTime } from '@/lib/time'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS, getCompanionMessage } from '@/lib/companion'
import { PetEmoji } from '@/components/PetEmoji'
import { Bell, Mic, ChevronRight } from 'lucide-react'

interface Props {
  store: Store
  userMode: 'single' | 'dual'
  onOpenDetail: (templateId: string) => void
  onOpenFeelingDetail: (feelingId: string) => void
  onTriggerReminder: (instanceId: string) => void
  onVoiceCreate: () => void
  onOpenNotifications: () => void
  onCompleteInstance: (instanceId: string, note?: string, photoUrl?: string) => void
}

type TodoTab = 'pending' | 'done'

export function TodoPage({ store, userMode, onOpenDetail, onOpenFeelingDetail, onTriggerReminder, onVoiceCreate, onOpenNotifications, onCompleteInstance }: Props) {
  const currentUserId = useCurrentUser()
  const [tab, setTab] = useState<TodoTab>('pending')
  const [expandedUpcoming, setExpandedUpcoming] = useState<Set<string>>(new Set())

  const character = COMPANION_CHARACTERS[store.space.companion]
  const { getTemplate, deferInstance, skipInstance, cantDoInstance, respondWithFeedback } = store

  const receivedItems = store.getReceivedItems(currentUserId)
  const sentItems = store.getSentItems(currentUserId)
  const notifications = store.getUserNotifications(currentUserId)

  // ---- Received sections ----
  const needResponse = receivedItems.filter((i) => i.status === 'deferred')
  const needAction = receivedItems.filter((i) => i.status === 'awaiting')
  const upcoming = receivedItems.filter((i) => i.status === 'pending')
  const handled = receivedItems.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired'
  )
  const doneCount = handled.filter((i) => i.status === 'completed').length
  const activeCount = needResponse.length + needAction.length

  // ---- Sent sections ----
  const sentWaiting = sentItems.filter((i) =>
    i.status === 'pending' || i.status === 'awaiting' ||
    (i.status === 'deferred' && i.relationStatus !== 'responded')
  )
  const sentProcessing = sentItems.filter((i) =>
    i.status === 'deferred' && i.relationStatus === 'responded'
  )
  const sentDone = sentItems.filter((i) => i.status === 'completed')
  const sentFailed = sentItems.filter((i) => i.status === 'skipped')

  // ---- Single mode ----
  const selfItems = receivedItems.filter((i) => {
    const tpl = store.getTemplate(i.templateId)
    return tpl && tpl.creatorId === tpl.receiverId
  })
  const selfPending = selfItems.filter((i) => i.status === 'pending' || i.status === 'awaiting' || i.status === 'deferred')
  const selfDone = selfItems.filter((i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired')

  // ---- Dual mode aggregate counts for tabs ----
  const dualPendingCount = activeCount + upcoming.length + sentWaiting.length + sentProcessing.length
  const dualDoneCount = handled.length + sentDone.length + sentFailed.length

  return (
    <div className="pb-6">
      {/* ===== Page header ===== */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h1 className="text-lg font-bold text-foreground">待办</h1>
        {userMode === 'dual' && notifications.length > 0 && (
          <div className="relative">
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-full bg-secondary/60"
            >
              <Bell className="w-5 h-5 text-foreground/60" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">{notifications.length}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ===== Single mode content ===== */}
      {userMode === 'single' && (
        <div className="px-4 pt-3 space-y-5">
          {/* Tab switcher */}
          <div className="flex bg-secondary/80 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setTab('pending')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                tab === 'pending' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              待完成
              {selfPending.length > 0 && tab !== 'pending' && (
                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{selfPending.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('done')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                tab === 'done' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              已完成
              {selfDone.length > 0 && tab !== 'done' && (
                <span className="ml-1.5 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">{selfDone.length}</span>
              )}
            </button>
          </div>

          {/* Pending tab */}
          {tab === 'pending' && (
            <>
              {store.getFeelings(currentUserId, { aboutPartner: true }).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-foreground">最近的感受</h2>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {store.getFeelings(currentUserId, { aboutPartner: true })
                      .slice(0, 3)
                      .map((feeling) => (
                        <div
                          key={feeling.id}
                          onClick={() => onOpenFeelingDetail(feeling.id)}
                          className="bg-white rounded-2xl p-4 border border-border/30 flex items-start gap-3 cursor-pointer hover:bg-accent/30 active:bg-accent/50 transition-colors shadow-card-default"
                        >
                          <span className="text-lg">{feeling.mood}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground line-clamp-2">{feeling.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(feeling.createdAt).toLocaleDateString('zh-CN')}
                              {feeling.isDraft && <span className="ml-2 text-primary">草稿</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {store.getDraftItems(currentUserId).length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-foreground mb-3">未发送</h2>
                  <div className="space-y-2">
                    {store.getDraftItems(currentUserId).map((inst) => {
                      const tpl = store.getTemplate(inst.templateId)
                      if (!tpl) return null
                      return (
                        <div
                          key={inst.id}
                          className="bg-white rounded-2xl p-4 border border-dashed border-primary/30 flex items-center gap-3 shadow-card-default"
                        >
                          <span className="text-lg">{ITEM_TYPE_CONFIG[tpl.itemType].emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{tpl.name}</p>
                            {tpl.note && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tpl.note}</p>}
                          </div>
                          <button
                            onClick={() => store.promoteDraftToSent(tpl.id)}
                            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            发送
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selfPending.length > 0 && (
                <div>
                  <SectionHeader emoji="📋" title="待处理" count={selfPending.length} />
                  <div className="space-y-2">
                    {selfPending.map((inst) => {
                      const tpl = store.getTemplate(inst.templateId)
                      if (!tpl) return null
                      return (
                        <TaskCard
                          key={inst.id}
                          instance={inst}
                          template={tpl}
                          store={store}
                          onComplete={onCompleteInstance}
                          onDefer={deferInstance}
                          onSkip={skipInstance}
                          onCantDo={cantDoInstance}
                          onTapName={() => onOpenDetail(inst.templateId)}
                          onDateChange={(instanceId, newDate) => store.updateInstanceDate(instanceId, newDate)}
                          variant={inst.status === 'deferred' ? 'deferred' : inst.status === 'awaiting' ? 'awaiting' : 'pending'}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {selfPending.length === 0 &&
               store.getFeelings(currentUserId, { aboutPartner: true }).length === 0 &&
               store.getDraftItems(currentUserId).length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-sm">全部搞定了</p>
                  <p className="text-xs mt-1">点击 + 记录感受或创建提醒吧</p>
                </div>
              )}
            </>
          )}

          {/* Done tab */}
          {tab === 'done' && (
            <>
              {selfDone.length > 0 ? (
                <div>
                  <SectionHeader emoji="✨" title="已完成" count={selfDone.length} />
                  <div className="space-y-2">
                    {selfDone.map((inst) => {
                      const tpl = store.getTemplate(inst.templateId)
                      if (!tpl) return null
                      return (
                        <TaskCard
                          key={inst.id}
                          instance={inst}
                          template={tpl}
                          store={store}
                          onComplete={onCompleteInstance}
                          onDefer={deferInstance}
                          onSkip={skipInstance}
                          onCantDo={cantDoInstance}
                          onTapName={() => onOpenDetail(inst.templateId)}
                          variant={inst.status === 'completed' ? 'completed' : 'skipped'}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-sm">还没有完成的记录</p>
                  <p className="text-xs mt-1">完成待办后会出现在这里</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== Dual mode tabs ===== */}
      {userMode === 'dual' && (
      <>
      <div className="px-4 pt-3">
        <div className="flex bg-secondary/80 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'pending' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            待完成
            {dualPendingCount > 0 && tab !== 'pending' && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{dualPendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab('done')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'done' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            已完成
            {dualDoneCount > 0 && tab !== 'done' && (
              <span className="ml-1.5 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">{dualDoneCount}</span>
            )}
          </button>
        </div>
      </div>

      {notifications.length > 0 && tab === 'pending' && (
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

      {/* PENDING TAB (dual) */}
      {tab === 'pending' && (
        <>
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {doneCount > 0 && activeCount > 0
                ? `已温柔回应 ${doneCount} 件，还有 ${activeCount} 件等着你~`
                : doneCount > 0
                  ? `已温柔回应了 ${doneCount} 件小事`
                  : activeCount > 0
                    ? `有 ${activeCount} 件小事在等你回应~`
                    : ''}
            </p>
          </div>

          {needResponse.length > 0 && (
            <section className="px-4 mt-3 animate-fade-in">
              <SectionHeader emoji="💭" title="等你回应的" count={needResponse.length} color="deferred" />
              <div className="space-y-3">
                {needResponse.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  return (
                  <TaskCard
                    key={inst.id}
                    instance={inst}
                    template={tpl}
                    store={store}
                    onComplete={onCompleteInstance}
                    onDefer={deferInstance}
                    onSkip={skipInstance}
                    onCantDo={cantDoInstance}
                    onFeedback={respondWithFeedback}
                    onTapName={() => onOpenDetail(inst.templateId)}
                    variant="deferred"
                  />
                  )
                })}
              </div>
            </section>
          )}

          {needAction.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="📋" title="等你处理的" color="awaiting" />
              <div className="space-y-3">
                {needAction.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  return (
                  <div key={inst.id} onClick={() => onTriggerReminder(inst.id)} className="cursor-pointer">
                    <TaskCard
                      instance={inst}
                      template={tpl}
                      store={store}
                      onComplete={onCompleteInstance}
                      onDefer={deferInstance}
                      onSkip={skipInstance}
                      onCantDo={cantDoInstance}
                      onFeedback={respondWithFeedback}
                      onTapName={() => onOpenDetail(inst.templateId)}
                      variant="awaiting"
                    />
                  </div>
                  )
                })}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="⏰" title="待会儿的事" count={upcoming.length} />
              <div className="space-y-3">
                {upcoming.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                  const isExpanded = expandedUpcoming.has(inst.id)
                  const sender = tpl.creatorId !== tpl.receiverId ? store.getUserProfile(tpl.creatorId) : null

                  if (isExpanded) {
                    return (
                      <TaskCard
                        key={inst.id}
                        instance={inst}
                        template={tpl}
                        store={store}
                        onComplete={onCompleteInstance}
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
                      className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-border/30 shadow-card-default hover:bg-accent/30 transition-colors cursor-pointer active:bg-accent/50"
                    >
                      <span className="text-lg">{typeConf.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate block">{tpl.name}</span>
                        {sender && <span className="text-2xs text-muted-foreground">{sender.name}{typeConf.senderVerb}</span>}
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

          {/* Sent pending items */}
          {sentWaiting.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="💌" title="等TA回应" count={sentWaiting.length} />
              <div className="space-y-3">
                {sentWaiting.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  return <SentItemCard key={inst.id} instance={inst} template={tpl} store={store} onTapName={() => onOpenDetail(inst.templateId)} />
                })}
              </div>
            </section>
          )}
          {sentProcessing.length > 0 && (
            <section className="px-4 mt-5 animate-fade-in">
              <SectionHeader emoji="⏳" title="TA处理中" count={sentProcessing.length} />
              <div className="space-y-3">
                {sentProcessing.map((inst) => {
                  const tpl = getTemplate(inst.templateId)
                  if (!tpl) return null
                  return <SentItemCard key={inst.id} instance={inst} template={tpl} store={store} onTapName={() => onOpenDetail(inst.templateId)} />
                })}
              </div>
            </section>
          )}

          {/* All empty state */}
          {needResponse.length === 0 && needAction.length === 0 && upcoming.length === 0 &&
           sentWaiting.length === 0 && sentProcessing.length === 0 && (
            <section className="px-4 mt-6">
              <div className="text-center py-10 bg-success-surface/50 rounded-2xl border border-success/10">
                <span className="block mb-2 animate-float"><PetEmoji value={character.expressions.sleeping} size="w-10 h-10" /></span>
                <p className="text-sm font-bold text-foreground">{getCompanionMessage(character, 'empty_all').text}</p>
                <p className="text-xs text-muted-foreground mt-1">保持这个节奏~</p>
              </div>
            </section>
          )}

          <div className="flex justify-center pt-6 pb-2">
            <button
              onClick={onVoiceCreate}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-full gradient-float-btn text-primary-foreground shadow-float active:scale-95 transition-all hover:shadow-xl"
            >
              <Mic className="w-5 h-5" />
              <span className="text-sm font-bold">提醒日记</span>
            </button>
          </div>
        </>
      )}

      {/* DONE TAB (dual) */}
      {tab === 'done' && (
        <>
          {dualDoneCount > 0 ? (
            <div className="px-4 mt-3 space-y-5">
              {/* Received done */}
              {handled.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="✨" title="你已处理的" count={handled.length} />
                  <div className="bg-white rounded-2xl border border-border/30 divide-y divide-border/30 overflow-hidden shadow-card-default">
                    {handled.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      const typeConf = ITEM_TYPE_CONFIG[tpl.itemType]
                      const statusEmoji = inst.status === 'completed' ? '🌟' : inst.status === 'skipped' ? '⏭' : '⏰'
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

              {/* Sent done */}
              {sentDone.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="🎉" title="TA已完成" count={sentDone.length} />
                  <div className="space-y-3">
                    {sentDone.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} store={store} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
              {sentFailed.length > 0 && (
                <section className="animate-fade-in">
                  <SectionHeader emoji="😅" title="做不了" count={sentFailed.length} />
                  <div className="space-y-3">
                    {sentFailed.map((inst) => {
                      const tpl = getTemplate(inst.templateId)
                      if (!tpl) return null
                      return <SentItemCard key={inst.id} instance={inst} template={tpl} store={store} onTapName={() => onOpenDetail(inst.templateId)} />
                    })}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <section className="px-4 mt-8">
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm">还没有完成的记录</p>
                <p className="text-xs mt-1">完成待办后会出现在这里</p>
              </div>
            </section>
          )}
        </>
      )}
      </>
      )}
    </div>
  )
}
