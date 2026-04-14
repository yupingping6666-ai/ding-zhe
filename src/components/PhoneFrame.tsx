import { useState, useEffect, useRef } from 'react'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { HomePage } from '@/pages/HomePage'
import { CreatePage } from '@/pages/CreatePage'
import { VoiceCreatePage } from '@/pages/VoiceCreatePage'
import { DetailPage } from '@/pages/DetailPage'
import { RecordsPage } from '@/pages/RecordsPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { RelationshipPage } from '@/pages/RelationshipPage'
import { MyPage } from '@/pages/MyPage'
import { ReminderOverlay } from '@/components/ReminderOverlay'
import { CreateChooser } from '@/components/CreateChooser'
import { Toast } from '@/components/Toast'
import { Home, Plus, Share2, LayoutGrid, Users } from 'lucide-react'
import { PhotoWallPage } from '@/pages/PhotoWallPage'
import { FeelingDetailPage } from '@/pages/FeelingDetailPage'
import { NarrativePage } from '@/pages/NarrativePage'
import { PetPage } from '@/pages/PetPage'
import { ProfileEditPage } from '@/pages/ProfileEditPage'
import CompletionPrompt from '@/components/CompletionPrompt'

type Page = 'home' | 'create' | 'voice' | 'records' | 'detail' | 'relationship' | 'my' | 'photowall' | 'feeling-detail' | 'narrative' | 'pet' | 'profile-edit'

interface PhoneFrameProps {
  store: Store
  userMode: 'single' | 'dual'
}

export function PhoneFrame({ store, userMode }: PhoneFrameProps) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  const [page, setPage] = useState<Page>('home')
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null)
  const [reminderInstanceId, setReminderInstanceId] = useState<string | null>(null)
  const [showChooser, setShowChooser] = useState(false)
  const [createPreset, setCreatePreset] = useState<string | null>(null)
  const [feelingDetailId, setFeelingDetailId] = useState<string | null>(null)
  const [feelingDetailBackPage, setFeelingDetailBackPage] = useState<Page>('home')
  const [narrativeId, setNarrativeId] = useState<string | null>(null)
  const [narrativeBackPage, setNarrativeBackPage] = useState<Page>('home')
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [profileEditBackPage, setProfileEditBackPage] = useState<Page>('home')
  const [anniversaryDotDismissed, setAnniversaryDotDismissed] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)

  // Reset anniversary dot dismissed state when the anniversary list changes (new day / new anniversary)
  const anniversaryKey = store.todayAnniversaries.map(a => a.title).join(',')
  useEffect(() => {
    setAnniversaryDotDismissed(false)
  }, [anniversaryKey])

  // When relationship is dissolved (mode switches from dual → single),
  // redirect away from the relationship page
  useEffect(() => {
    if (userMode === 'single' && page === 'relationship') {
      setPage('my')
    }
  }, [userMode, page])

  // Mark relay messages as read when leaving pet page
  const prevPageRef = useRef(page)
  useEffect(() => {
    if (prevPageRef.current === 'pet' && page !== 'pet') {
      store.getUnreadRelays(currentUserId).forEach(r => store.markRelayRead(r.id))
    }
    prevPageRef.current = page
  }, [page, currentUserId, store])

  function openDetail(templateId: string) {
    setDetailTemplateId(templateId)
    setPage('detail')
  }

  function openFeelingDetail(feelingId: string) {
    setFeelingDetailBackPage(page)
    setFeelingDetailId(feelingId)
    setPage('feeling-detail')
  }

  function openNarrative(id: string) {
    setNarrativeBackPage(page)
    setNarrativeId(id)
    setPage('narrative')
  }

  function openProfileEdit(userId: string) {
    setProfileEditBackPage(page)
    setEditingUserId(userId)
    setPage('profile-edit')
  }

  function triggerReminder(instanceId: string) {
    setReminderInstanceId(instanceId)
  }

  function handlePlusClick() {
    setShowChooser(true)
  }

  const reminderInstance = reminderInstanceId
    ? store.instances.find((i) => i.id === reminderInstanceId)
    : null
  const reminderTemplate = reminderInstance
    ? store.getTemplate(reminderInstance.templateId)
    : undefined

  // Show onboarding if user hasn't completed it
  if (!user.onboarded) {
    return (
      <div className="w-[375px] min-h-[812px] max-h-[812px] bg-background rounded-[44px] shadow-2xl border-[6px] border-foreground/8 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <OnboardingPage store={store} onComplete={() => setPage('home')} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-[375px] min-h-[812px] max-h-[812px] bg-background rounded-[44px] shadow-2xl border-[6px] border-foreground/8 overflow-hidden flex flex-col relative">
      {/* Status bar with user & companion indicator */}
      <div className="flex items-center justify-between px-8 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{character.avatar}</span>
          <span className="text-xs font-semibold text-foreground">{user.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-[3px]">
            <div className="w-[3px] h-[6px] bg-foreground rounded-sm" />
            <div className="w-[3px] h-[8px] bg-foreground rounded-sm" />
            <div className="w-[3px] h-[10px] bg-foreground rounded-sm" />
            <div className="w-[3px] h-[12px] bg-foreground rounded-sm" />
          </div>
          <span className="text-2xs font-medium text-foreground ml-1">100%</span>
          <div className="w-6 h-3 border border-foreground rounded-sm ml-0.5 relative">
            <div className="absolute inset-[1.5px] bg-foreground rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className={`flex-1 min-h-0 ${(page === 'pet' || page === 'my') ? 'overflow-hidden flex flex-col' : 'overflow-y-auto scrollbar-hide'}`}>
        {page === 'home' && (
          <HomePage
            store={store}
            userMode={userMode}
            onOpenDetail={openDetail}
            onOpenFeelingDetail={openFeelingDetail}
            onTriggerReminder={triggerReminder}
            onVoiceCreate={() => setPage('voice')}
            onOpenPetPanel={() => setPage('pet')}
            onOpenCreate={() => { setCreatePreset('photo-journal'); setPage('create') }}
            onOpenNotifications={() => setShowNotifPanel(true)}
          />
        )}
        {page === 'pet' && (
          <PetPage
            store={store}
            onTodayStory={async () => {
              const entry = await store.generateNarrativeEntry()
              if (entry) openNarrative(entry.id)
            }}
            onFeelingCreate={() => { setCreatePreset('mood-capture'); setPage('create') }}
            onBack={() => setPage('home')}
          />
        )}
        {page === 'create' && (
          <CreatePage
            store={store}
            userMode={userMode}
            createPreset={createPreset}
            onBack={() => { setCreatePreset(null); setPage('home') }}
          />
        )}
        {page === 'voice' && (
          <VoiceCreatePage store={store} userMode={userMode} onBack={() => setPage('home')} />
        )}
        {page === 'detail' && detailTemplateId && (
          <DetailPage
            templateId={detailTemplateId}
            store={store}
            onBack={() => setPage('home')}
          />
        )}
        {page === 'records' && (
          <RecordsPage store={store} onBack={() => setPage('home')} />
        )}
        {page === 'relationship' && (
          <RelationshipPage store={store} onBack={() => setPage('home')} onEditProfile={openProfileEdit} />
        )}
        {page === 'my' && (
          <MyPage
            store={store}
            userMode={userMode}
            onEditProfile={openProfileEdit}
          />
        )}
        {page === 'profile-edit' && editingUserId && (
          <ProfileEditPage
            store={store}
            userId={editingUserId}
            onBack={() => { setEditingUserId(null); setPage(profileEditBackPage) }}
          />
        )}
        {page === 'photowall' && (
          <PhotoWallPage
            store={store}
            userMode={userMode}
            currentUserId={currentUserId}
            onBack={() => setPage('home')}
            onOpenFeelingDetail={openFeelingDetail}
          />
        )}
        {page === 'feeling-detail' && feelingDetailId && (
          <FeelingDetailPage
            store={store}
            feelingId={feelingDetailId}
            currentUserId={currentUserId}
            onBack={() => { setFeelingDetailId(null); setPage(feelingDetailBackPage) }}
            onOpenNarrative={openNarrative}
          />
        )}
        {page === 'narrative' && narrativeId && (
          <NarrativePage
            store={store}
            narrativeId={narrativeId}
            onBack={() => { setNarrativeId(null); setPage(narrativeBackPage) }}
          />
        )}
      </div>

      {/* Tab bar — 首页 | 纪念 | + | 小橘 | 用户中心 */}
      <div className="border-t bg-card/80 backdrop-blur-lg safe-bottom">
        <div className="flex items-center justify-around py-2 pb-3">
          <button
            onClick={() => setPage('home')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
              page === 'home' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-2xs font-medium">首页</span>
          </button>
          <button
            onClick={() => setPage('photowall')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
              page === 'photowall' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-2xs font-medium">纪念</span>
          </button>
          <button
            onClick={handlePlusClick}
            className="flex flex-col items-center gap-0.5 px-2 py-1"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center -mt-5 shadow-float" style={{ background: 'linear-gradient(180deg, hsl(14 80% 78%), hsl(14 90% 65%))' }}>
              <Plus className="w-5 h-5 text-white" />
            </div>
          </button>
          <button
            onClick={() => setPage('pet')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative ${
              page === 'pet' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-2xs font-medium">小橘</span>
            {page !== 'pet' && store.getUnreadRelays(currentUserId).length > 0 && (
              <div className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-soft" />
            )}
          </button>
          <button
            onClick={() => { setAnniversaryDotDismissed(true); userMode === 'single' ? setPage('my') : setPage('relationship') }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative ${
              page === 'my' || page === 'relationship' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-2xs font-medium">{userMode === 'dual' ? '我们' : '我的'}</span>
            {userMode === 'dual' && store.todayAnniversaries.length > 0 && !anniversaryDotDismissed && (
              <div className="absolute top-0 right-0.5 w-2 h-2 bg-[hsl(var(--anniversary))] rounded-full animate-pulse-soft" />
            )}
          </button>
        </div>
      </div>

      {/* Create chooser overlay */}
      {showChooser && (
        <CreateChooser
          userMode={userMode}
          onSelectType={(type) => {
            setShowChooser(false)
            if (type === 'voice') {
              setPage('voice')
            } else if (type === 'manual') {
              setPage('create')
              setCreatePreset(null)
            } else {
              // Single-mode types: text-journal, mood-capture, photo-journal
              setCreatePreset(type)
              setPage('create')
            }
          }}
          onClose={() => setShowChooser(false)}
        />
      )}

      {/* Reminder overlay */}
      {reminderInstance && reminderTemplate && (
        <ReminderOverlay
          instance={reminderInstance}
          template={reminderTemplate}
          store={store}
          onComplete={store.completeInstance}
          onDefer={store.deferInstance}
          onSkip={store.skipInstance}
          onCantDo={store.cantDoInstance}
          onFeedback={store.respondWithFeedback}
          onClose={() => setReminderInstanceId(null)}
        />
      )}

      {/* Completion prompt overlay */}
      {showCompletionPrompt && (
        <CompletionPrompt
          onPhoto={() => { setShowCompletionPrompt(false); setPage('create'); setCreatePreset('photo-journal') }}
          onDismiss={() => setShowCompletionPrompt(false)}
        />
      )}

      {/* Notification panel overlay */}
      {showNotifPanel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" onClick={() => setShowNotifPanel(false)} />
          <div className="relative w-full max-w-xs max-h-[50%] overflow-y-auto bg-white rounded-2xl shadow-xl border border-border/40 animate-fade-in">
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2 border-b border-border/20 rounded-t-2xl flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">通知</p>
              <button
                onClick={() => setShowNotifPanel(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-full"
              >
                关闭
              </button>
            </div>
            <div className="py-1">
              {store.getUserNotifications(currentUserId).length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">暂无通知</div>
              ) : (
                store.getUserNotifications(currentUserId).map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 px-4 py-3 border-b border-border/10 last:border-b-0">
                    <span className="text-sm mt-0.5 flex-shrink-0">💌</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                    </div>
                    <button
                      onClick={() => store.dismissNotification(n.id)}
                      className="text-2xs text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10 flex-shrink-0 active:bg-primary/20"
                    >
                      知道了
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast toast={store.toast} />
    </div>
  )
}
