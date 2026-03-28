import { useStore } from '@/store'
import { UserContext } from '@/contexts/UserContext'
import { PhoneFrame } from '@/components/PhoneFrame'
import { COMPANION_CHARACTERS } from '@/lib/companion'

function App() {
  const store = useStore()
  const character = COMPANION_CHARACTERS[store.space.companion]

  return (
    <div className="min-h-screen bg-muted flex items-start justify-center gap-8 p-6 pt-10">
      {store.users.map((user) => (
        <UserContext.Provider key={user.id} value={user.id}>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card border border-border/50 shadow-card-default">
              <span className="text-lg">{character.avatar}</span>
              <span className="text-sm font-bold text-foreground">{user.name}的视角</span>
            </div>
            <PhoneFrame store={store} />
          </div>
        </UserContext.Provider>
      ))}
    </div>
  )
}

export default App
