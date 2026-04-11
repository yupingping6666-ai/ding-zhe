interface DeleteConfirmDialogProps {
  photoCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ photoCount, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card rounded-2xl p-6 mx-8 max-w-sm w-full shadow-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="text-base font-semibold text-foreground mb-1">确定删除这条记录吗？</h3>
          <p className="text-xs text-muted-foreground">
            {photoCount > 0
              ? `包含 ${photoCount} 张照片，删除后无法恢复`
              : '删除后无法恢复'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border text-sm font-medium text-foreground active:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-medium text-white active:bg-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
