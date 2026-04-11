import type { TaskTemplate, TaskInstance } from '@/types'
import { ITEM_TYPE_CONFIG } from '@/types'
import { Send, Clock, Edit } from 'lucide-react'

interface DraftPromotionPromptProps {
  template: TaskTemplate
  instance: TaskInstance
  onSend: () => void
  onWait: () => void
  onEdit?: () => void
}

export function DraftPromotionPrompt({ template, instance, onSend, onWait, onEdit }: DraftPromotionPromptProps) {
  const itemType = ITEM_TYPE_CONFIG[template.itemType]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-background rounded-2xl p-6 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">{itemType.emoji}</span>
          </div>
          <h3 className="text-lg font-bold mb-1">这个草稿准备好了</h3>
          <p className="text-sm text-muted-foreground">要不要发给 TA？</p>
        </div>

        {/* Draft Preview */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">{itemType.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{template.name}</p>
              {template.note && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {template.note}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{template.remindTime}</span>
                <span>·</span>
                <span>{itemType.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onSend}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            发给 TA
          </button>

          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
              >
                <Edit className="w-4 h-4" />
                修改一下
              </button>
            )}
            <button
              onClick={onWait}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              再等等
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
