import { useState } from 'react'
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
import { ReminderOverlay } from '@/components/ReminderOverlay'
import { CreateChooser } from '@/components/CreateChooser'
import { Toast } from '@/components/Toast'
import { Home, PlusCircle, BarChart3, Heart } from 'lucide-react'

type Page = 'home' | 'create' | 'voice' | 'records' | 'detail' | 'relationship'

interface PhoneFrameProps {
  store: Store
}

export function PhoneFrame({ store }: PhoneFrameProps) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  const [page, setPage] = useState<Page>('home')
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null)
  const [reminderInstanceId, setReminderInstanceId] = useState<string | null>(null)
  const [showChooser, setShowChooser] = useState(false)

  function openDetail(templateId: string) {
    setDetailTemplateId(templateId)
    setPage('detail')
  }

  function triggerReminder(instanceId: string) {
    setReminderInstanceId(instanceId)
  }

  function handlePlusClick() {
    setShowChooser(true)
  }

  function handleChooserVoice() {
    setShowChooser(false)
    setPage('voice')
  }

  function handleChooserManual() {
    setShowChooser(false)
    setPage('create')
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
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {page === 'home' && (
          <HomePage
            store={store}
            onOpenDetail={openDetail}
            onTriggerReminder={triggerReminder}
            onVoiceCreate={() => setPage('voice')}
          />
        )}
        {page === 'create' && (
          <CreatePage store={store} onBack={() => setPage('home')} />
        )}
        {page === 'voice' && (
          <VoiceCreatePage store={store} onBack={() => setPage('home')} />
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
          <RelationshipPage store={store} onBack={() => setPage('home')} />
        )}
      </div>

      {/* Tab bar — 4 tabs */}
      <div className="border-t bg-card/80 backdrop-blur-lg safe-bottom">
        <div className="flex items-center justify-around py-2 pb-3">
          <button
            onClick={() => setPage('home')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
              page === 'home' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-2xs font-medium">首页</span>
          </button>
          <button
            onClick={handlePlusClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-primary"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-4 shadow-lg">
              <PlusCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xs font-medium">新建</span>
          </button>
          <button
            onClick={() => setPage('relationship')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${
              page === 'relationship' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-2xs font-medium">我们</span>
            {store.todayAnniversaries.length > 0 && (
              <div className="absolute top-0 right-1.5 w-2 h-2 bg-[hsl(var(--anniversary))] rounded-full animate-pulse-soft" />
            )}
          </button>
          <button
            onClick={() => setPage('records')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
              page === 'records' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-2xs font-medium">记录</span>
          </button>
        </div>
      </div>

      {/* Create chooser overlay */}
      {showChooser && (
        <CreateChooser
          onVoice={handleChooserVoice}
          onManual={handleChooserManual}
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

      {/* Toast */}
      <Toast toast={store.toast} />
    </div>
  )
}
