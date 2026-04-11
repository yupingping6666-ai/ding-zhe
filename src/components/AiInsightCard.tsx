import { Sparkles } from 'lucide-react'

interface AiInsightCardProps {
  recordCount: number
}

export function AiInsightCard({ recordCount }: AiInsightCardProps) {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-[hsl(var(--care))]/10 rounded-2xl p-4 border border-primary/10">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">AI 对你的理解</h3>
          <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
            AI 发现你在关系里更在意"被回应"
          </p>
          {recordCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              基于你最近 {recordCount} 条记录
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
