import { Link2 } from 'lucide-react'
import authBg from '@/assets/pets/cat/auth-bg.png'

interface WelcomePageProps {
  onNavigate: (screen: 'login' | 'register' | 'find-password') => void
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Full-screen background */}
      <img
        src={authBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pb-[100px]">
        {/* Fake status bar */}
        <div className="flex items-center justify-between pt-3 pb-1 px-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">✿</span>
            <span className="text-xs font-semibold text-foreground">小红</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex gap-[3px]">
              <div className="w-[3px] h-[6px] bg-foreground rounded-sm" />
              <div className="w-[3px] h-[8px] bg-foreground rounded-sm" />
              <div className="w-[3px] h-[10px] bg-foreground rounded-sm" />
              <div className="w-[3px] h-[12px] bg-foreground rounded-sm" />
            </div>
            <span className="text-[10px] font-medium text-foreground ml-1">100%</span>
            <div className="w-6 h-3 border border-foreground rounded-sm ml-0.5 relative">
              <div className="absolute inset-[1.5px] bg-foreground rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Greeting text - centered, pushed down closer to cat */}
        <div className="pt-14 text-center">
          <h1 className="text-xl font-extrabold text-foreground leading-tight">
            你好，我是小橘，<br />你的情绪守护者
          </h1>
        </div>

        {/* Spacer - let the cat image show through */}
        <div className="flex-1" />

        {/* Subtitle */}
        <p className="text-base font-bold text-foreground mb-3 text-center">
          连接心跳，Link 你的生活
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('login')}
            className="w-full h-12 rounded-2xl font-semibold text-sm bg-foreground/10 text-foreground/80 border border-border/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <Link2 className="w-4 h-4" />
            我有档案（登录）
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="w-full h-12 rounded-2xl font-semibold text-sm text-white shadow-float active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, hsl(14 80% 78%), hsl(14 90% 65%))' }}
          >
            <Link2 className="w-4 h-4" />
            开启新 Link（手机注册）
          </button>
        </div>

        {/* Bottom links */}
        <div className="flex items-center justify-center gap-8 mt-3">
          <button className="text-xs font-medium text-muted-foreground underline underline-offset-2">
            隐私政策
          </button>
          <button
            onClick={() => onNavigate('find-password')}
            className="text-xs font-medium text-muted-foreground underline underline-offset-2"
          >
            忘记密码?
          </button>
        </div>
      </div>
    </div>
  )
}
