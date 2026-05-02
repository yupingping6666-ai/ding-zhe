export function SectionHeader({ emoji, title, count, color }: {
  emoji: string
  title: string
  count?: number
  color?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <h2 className={`text-sm font-bold ${
          color === 'deferred' ? 'text-deferred-foreground' :
          color === 'awaiting' ? 'text-awaiting-foreground' :
          'text-foreground'
        }`}>
          {title}
        </h2>
      </div>
      {count !== undefined && count > 0 && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          color === 'deferred' ? 'bg-deferred/10 text-deferred' :
          color === 'awaiting' ? 'bg-awaiting/10 text-awaiting' :
          'bg-secondary text-muted-foreground'
        }`}>
          {count} 件
        </span>
      )}
    </div>
  )
}
