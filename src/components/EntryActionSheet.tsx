import { Eye, EyeOff, Trash2, X } from 'lucide-react'

interface EntryActionSheetProps {
  isHidden: boolean
  onHide: () => void
  onDelete: () => void
  onClose: () => void
}

export function EntryActionSheet({ isHidden, onHide, onDelete, onClose }: EntryActionSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-sm mx-4 mb-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          <button
            onClick={() => { onHide(); onClose() }}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground active:bg-muted transition-colors"
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isHidden ? '取消隐藏' : '隐藏记录'}
          </button>
          <button
            onClick={() => { onClose(); setTimeout(onDelete, 200) }}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-red-500 active:bg-muted transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除记录
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-2 bg-card rounded-2xl py-3.5 text-sm text-muted-foreground font-medium active:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  )
}
