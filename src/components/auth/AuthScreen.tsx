import { useState } from 'react'
import { WelcomePage } from './WelcomePage'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { FindPasswordPage } from './FindPasswordPage'

type Screen = 'welcome' | 'login' | 'register' | 'find-password'

export function AuthScreen() {
  const [screen, setScreen] = useState<Screen>('welcome')

  return (
    <div className="w-[375px] min-h-[812px] max-h-[812px] rounded-[44px] shadow-2xl border-[6px] border-foreground/8 overflow-hidden flex flex-col relative bg-background">
      {screen === 'welcome' && <WelcomePage onNavigate={setScreen} />}
      {screen === 'login' && <LoginPage onNavigate={setScreen} />}
      {screen === 'register' && <RegisterPage onNavigate={setScreen} />}
      {screen === 'find-password' && <FindPasswordPage onNavigate={setScreen} />}
    </div>
  )
}
