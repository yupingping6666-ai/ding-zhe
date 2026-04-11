import { useState } from 'react'
import { getTimeGreeting, getTimeOfDay } from '@/lib/time-of-day'
import { AnniversarySection } from '@/components/anniversary/AnniversarySection'
import { AiInsightCard } from '@/components/AiInsightCard'
import { TaskCard } from '@/components/TaskCard'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { useCurrentUser } from '@/contexts/UserContext'
import { useApi } from '@/contexts/ApiContext'
import { CheckCircle2, ClipboardList, BarChart3, Star, LogOut } from 'lucide-react'
import catHeroImg from '@/assets/pets/cat/mypage-cat.png'
import type { Store } from '@/store'

interface MyPageProps {
  store: Store
  userMode: 'single' | 'dual'
  onOpenDetail?: (templateId: string) => void
  onOpenFeelingDetail?: (feelingId: string) => void
}

type MyTab = 'status' | 'records' | 'todo'

export function MyPage({ store, userMode: _userMode, onOpenDetail, onOpenFeelingDetail }: MyPageProps) {
  const currentUserId = useCurrentUser()
  const { logout } = useApi()
  const user = store.getUserProfile(currentUserId)
  const greeting = getTimeGreeting(getTimeOfDay())
  const character = COMPANION_CHARACTERS[store.space.companion]

  const [tab, setTab] = useState<MyTab>('status')

  // Personal tasks (self-assigned)
  const allInstances = [...store.pending, ...store.awaiting, ...store.deferred, ...store.todayDone]
  const selfInstances = allInstances.filter((i) => {
    const tpl = store.getTemplate(i.templateId)
    return tpl && tpl.receiverId === currentUserId
  })
  const pendingInstances = selfInstances.filter(
    (i) => i.status === 'pending' || i.status === 'awaiting' || i.status === 'deferred'
  )
  const doneInstances = selfInstances.filter(
    (i) => i.status === 'completed' || i.status === 'skipped' || i.status === 'expired'
  )

  // Feelings
  const feelings = store.getFeelings(currentUserId)

  // Stats
  const todayCompleted = store.todayCompletedCount
  const todayPending = store.pending.length + store.awaiting.length + store.deferred.length
  const todayTotal = store.todayTotalCount

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Sticky Header + Tabs */}
      <div className="shrink-0">
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <h1 className="text-xl font-bold text-foreground">
            {tab === 'status' ? (userMode === 'dual' ? '我们的状态' : '我的状态') : tab === 'records' ? (userMode === 'dual' ? '我们记录的' : '我记录的') : '待办'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.name}，{greeting}~
          </p>
        </div>

        {/* Tab Bar */}
        <div className="px-5 pb-3">
          <div className="flex bg-secondary/80 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setTab('status')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                tab === 'status' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {userMode === 'dual' ? '我们的状态' : '我的状态'}
            </button>
            <button
              onClick={() => setTab('records')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                tab === 'records' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              我记录的
              {tab !== 'records' && feelings.length > 0 && (
                <span className="text-2xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {feelings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('todo')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                tab === 'todo' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              待办
              {tab !== 'todo' && pendingInstances.length > 0 && (
                <span className="text-2xs bg-deferred/15 text-deferred px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {pendingInstances.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {tab === 'status' && (
          <div className="px-5 pb-20 space-y-4">
            {/* Cat Hero Section */}
            <div className="relative flex flex-col items-center py-5 bg-secondary/30 rounded-3xl">
              {/* Sparkle decorations */}
              <Star className="absolute top-3 left-6 w-3 h-3 text-primary/25 animate-pulse" style={{ animationDelay: '0s' }} />
              <Star className="absolute top-8 right-8 w-4 h-4 text-care/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Star className="absolute bottom-10 left-10 w-3.5 h-3.5 text-primary/20 animate-pulse" style={{ animationDelay: '1s' }} />
              <Star className="absolute bottom-6 right-12 w-3 h-3 text-care/25 animate-pulse" style={{ animationDelay: '1.5s' }} />
              <Star className="absolute top-12 left-16 w-2.5 h-2.5 text-primary/15 animate-pulse" style={{ animationDelay: '2s' }} />

              {/* Cat image */}
              <img
                src={catHeroImg}
                alt={character.name}
                className="w-24 h-24 object-contain select-none pointer-events-none"
                draggable={false}
              />

              {/* Together days text */}
              <p className="text-base font-bold text-foreground mt-2">
                一起 {store.relationDays} 天
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                一起庆祝吧！{character.name}很开心！
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-2xl p-3 text-center border border-border/30">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(var(--success))]/15 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{todayCompleted}</div>
                  <div className="text-2xs text-muted-foreground">今日完成</div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-3 text-center border border-border/30">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(var(--awaiting))]/15 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-[hsl(var(--awaiting))]" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{todayPending}</div>
                  <div className="text-2xs text-muted-foreground">今日待办</div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-3 text-center border border-border/30">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(var(--care))]/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[hsl(var(--care))]" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{todayTotal}</div>
                  <div className="text-2xs text-muted-foreground">今日总计</div>
                </div>
              </div>
            </div>

            {/* AI Insight Card */}
            <AiInsightCard recordCount={feelings.length} />

            {/* Feelings Preview (last 5) */}
            {feelings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-foreground">我记录的</h2>
                  <button
                    onClick={() => setTab('records')}
                    className="text-xs text-primary font-medium"
                  >
                    查看全部 &gt;
                  </button>
                </div>
                <div className="space-y-2">
                  {feelings
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 5)
                    .map((feeling) => (
                      <div
                        key={feeling.id}
                        className="bg-card rounded-2xl p-4 border border-border/40 flex items-start gap-3 active:scale-[0.98] transition-transform"
                        onClick={() => onOpenFeelingDetail?.(feeling.id)}
                      >
                        <span className="text-lg">{feeling.mood}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-2">{feeling.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(feeling.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border/40 text-sm text-muted-foreground hover:bg-secondary/30 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-4 h-4" />
              退出账号
            </button>
          </div>
        )}

        {tab === 'records' && (
          <div className="px-5 pb-20 space-y-5">
            {/* Full Feelings List */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">{userMode === 'dual' ? '我们的感受' : '我的感受'}</h2>
              {feelings.length > 0 ? (
                <div className="space-y-2">
                  {feelings
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((feeling) => (
                      <div
                        key={feeling.id}
                        className="bg-card rounded-2xl p-4 border border-border/40 flex items-start gap-3 active:scale-[0.98] transition-transform"
                        onClick={() => onOpenFeelingDetail?.(feeling.id)}
                      >
                        <span className="text-lg">{feeling.mood}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-2">{feeling.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(feeling.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm text-muted-foreground">还没有记录感受~</p>
                </div>
              )}
            </div>

            {/* Self-assigned pending tasks */}
            {pendingInstances.filter((i) => {
              const tpl = store.getTemplate(i.templateId)
              return tpl && tpl.creatorId === currentUserId
            }).length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">我记录的待办</h2>
                <div className="space-y-2">
                  {pendingInstances
                    .filter((i) => {
                      const tpl = store.getTemplate(i.templateId)
                      return tpl && tpl.creatorId === currentUserId
                    })
                    .map((inst) => {
                      const tpl = store.getTemplate(inst.templateId)
                      return (
                        <TaskCard
                          key={inst.id}
                          instance={inst}
                          template={tpl}
                          onComplete={store.completeInstance}
                          onDefer={store.deferInstance}
                          onSkip={store.skipInstance}
                          onCantDo={store.cantDoInstance}
                          onFeedback={store.respondWithFeedback}
                          onTapName={() => onOpenDetail?.(inst.templateId)}
                          variant={inst.status === 'deferred' ? 'deferred' : inst.status === 'awaiting' ? 'awaiting' : 'pending'}
                        />
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'todo' && (
          <div className="px-5 pb-20 space-y-5">
            {/* Pending Tasks */}
            {pendingInstances.length > 0 ? (
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">
                  待完成
                  <span className="ml-2 text-xs bg-deferred/15 text-deferred px-2 py-0.5 rounded-full font-bold">
                    {pendingInstances.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {pendingInstances.map((inst) => {
                    const tpl = store.getTemplate(inst.templateId)
                    return (
                      <TaskCard
                        key={inst.id}
                        instance={inst}
                        template={tpl}
                        onComplete={store.completeInstance}
                        onDefer={store.deferInstance}
                        onSkip={store.skipInstance}
                        onCantDo={store.cantDoInstance}
                        onFeedback={store.respondWithFeedback}
                        onTapName={() => onOpenDetail?.(inst.templateId)}
                        variant={inst.status === 'deferred' ? 'deferred' : inst.status === 'awaiting' ? 'awaiting' : 'pending'}
                      />
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm text-muted-foreground">没有待办事项~</p>
              </div>
            )}

            {/* Done Tasks */}
            {doneInstances.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">已完成</h2>
                <div className="space-y-2">
                  {doneInstances.map((inst) => {
                    const tpl = store.getTemplate(inst.templateId)
                    return (
                      <TaskCard
                        key={inst.id}
                        instance={inst}
                        template={tpl}
                        onComplete={store.completeInstance}
                        onDefer={store.deferInstance}
                        onSkip={store.skipInstance}
                        onCantDo={store.cantDoInstance}
                        onFeedback={store.respondWithFeedback}
                        onTapName={() => onOpenDetail?.(inst.templateId)}
                        variant="pending"
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Anniversaries */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">{userMode === 'dual' ? '我们的纪念日' : '我的纪念日'}</h2>
              <AnniversarySection
                anniversaries={store.space.anniversaries}
                onAdd={store.addAnniversary}
                onRemove={store.removeAnniversary}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
