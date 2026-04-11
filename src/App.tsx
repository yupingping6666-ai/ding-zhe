import { useStore } from '@/store'
import { UserContext } from '@/contexts/UserContext'
import { useApi } from '@/contexts/ApiContext'
import { PhoneFrame } from '@/components/PhoneFrame'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { COMPANION_CHARACTERS } from '@/lib/companion'

function App() {
  const { isAuthenticated, isLoading, user: apiUser } = useApi()
  const store = useStore({ apiMode: false })
  const character = COMPANION_CHARACTERS[store.space.companion]
  const userMode = (apiUser?.mode || 'dual') as 'single' | 'dual'

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

  // Authenticated: show main app
  if (userMode === 'dual') {
    return (
      <div className="min-h-screen bg-muted flex items-start justify-center gap-8 p-6 pt-10">
        {store.users.map((u) => (
          <UserContext.Provider key={u.id} value={u.id}>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card border border-border/50 shadow-card-default">
                <span className="text-lg">{u.avatar}</span>
                <span className="text-sm font-bold text-foreground">{u.name}的视角</span>
              </div>
              <PhoneFrame store={store} />
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
      <UserContext.Provider value={singleUser.id}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card border border-border/50 shadow-card-default">
            <span className="text-lg">{character.avatar}</span>
            <span className="text-sm font-bold text-foreground">{singleUser.name}的视角（单人模式）</span>
          </div>
          <PhoneFrame store={store} />
        </div>
      </UserContext.Provider>
    </div>
  )
}

export default App
