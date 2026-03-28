import { MessageSquareText, PenLine, X } from 'lucide-react'

interface Props {
  onVoice: () => void
  onManual: () => void
  onClose: () => void
}

export function CreateChooser({ onVoice, onManual, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full bg-card rounded-t-3xl shadow-chooser animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-5 pt-3 pb-6">
          <h2 className="text-base font-semibold text-foreground mb-4">新建提醒</h2>

          <div className="space-y-2.5">
            {/* Voice / NL input option */}
            <button
              onClick={onVoice}
              className="w-full flex items-center gap-4 p-4 bg-secondary rounded-2xl hover:bg-accent transition-all active:scale-[0.98] text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquareText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground block">
                  说一句话
                </span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  用自然语言快速创建，如"每天8点吃药"
                </span>
              </div>
            </button>

            {/* Manual form option */}
            <button
              onClick={onManual}
              className="w-full flex items-center gap-4 p-4 bg-secondary rounded-2xl hover:bg-accent transition-all active:scale-[0.98] text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <PenLine className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground block">
                  手动填写
                </span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  逐项设置提醒详情
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}