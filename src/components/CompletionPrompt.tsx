import { Camera, X } from 'lucide-react'

interface CompletionPromptProps {
  onPhoto: () => void
  onDismiss: () => void
}

export default function CompletionPrompt({ onPhoto, onDismiss }: CompletionPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onDismiss} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl px-6 py-8 mx-6 max-w-[320px] w-full text-center shadow-xl animate-completion-pop">
        <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">完成啦！</h3>
        <p className="text-sm text-gray-500 mb-5">要不要记录一下这一刻？</p>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            稍后
          </button>
          <button
            onClick={onPhoto}
            className="flex-1 py-2.5 rounded-xl text-sm text-white bg-pink-500 hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            拍照
          </button>
        </div>
      </div>
    </div>
  )
}
