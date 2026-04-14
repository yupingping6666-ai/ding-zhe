import { useState } from 'react'
import { useStore } from '@/store'
import { UserContext } from '@/contexts/UserContext'
import { useApi } from '@/contexts/ApiContext'
import { PhoneFrame } from '@/components/PhoneFrame'
import { UserAvatar } from '@/components/UserAvatar'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { COMPANION_CHARACTERS } from '@/lib/companion'

function App() {
  const { isAuthenticated, isLoading } = useApi()
  const store = useStore({ apiMode: false })
  const character = COMPANION_CHARACTERS[store.space.companion]
  const [demoMode, setDemoMode] = useState<'single' | 'dual'>('dual')

  // Derive actual mode: if relationship dissolved (no partnerId), force single
  const hasPartner = store.users.some(u => u.partnerId && u.partnerId.length > 0)
  const userMode = hasPartner ? demoMode : 'single'

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // Not authenticated: show auth screens
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted flex items-start justify-center p-6 pt-10">
        <AuthScreen />
      </div>
    )
  }

  // Demo mode toggle
  const modeToggle = (
    <button
      onClick={() => setDemoMode(demoMode === 'dual' ? 'single' : 'dual')}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all active:scale-95"
    >
      <span className="text-sm">{demoMode === 'dual' ? '👫' : '👤'}</span>
      <span className="text-xs font-semibold text-foreground">
        {demoMode === 'dual' ? '双人模式' : '单人模式'}
      </span>
      <span className="text-2xs text-muted-foreground">点击切换</span>
    </button>
  )

  // Authenticated: show main app
  if (userMode === 'dual') {
    return (
      <div className="min-h-screen bg-muted flex items-start justify-center gap-8 p-6 pt-10">
        {modeToggle}
        {store.users.map((u) => (
          <UserContext.Provider key={u.id} value={u.id}>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card border border-border/50 shadow-card-default">
                <span className="w-5 h-5 rounded-full overflow-hidden inline-flex items-center justify-center text-lg"><UserAvatar avatar={u.avatar} imgClass="w-5 h-5" /></span>
                <span className="text-sm font-bold text-foreground">{u.name}的视角</span>
              </div>
              <PhoneFrame store={store} userMode={userMode} />
            </div>
          </UserContext.Provider>
        ))}
      </div>
    )
  }

  // Single mode
  const singleUser = store.users[0]
  return (
    <div className="min-h-screen bg-muted flex items-start justify-center gap-8 p-6 pt-10">
      {modeToggle}
      <UserContext.Provider value={singleUser.id}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card border border-border/50 shadow-card-default">
            <span className="text-lg">{character.avatar}</span>
            <span className="text-sm font-bold text-foreground">{singleUser.name}的视角</span>
          </div>
          <PhoneFrame store={store} userMode={userMode} />
        </div>
      </UserContext.Provider>
    </div>
  )
}

export default App
