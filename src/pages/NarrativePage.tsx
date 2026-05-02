import { ArrowLeft } from 'lucide-react'
import type { Store } from '@/store'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { stripPetSpeakerPrefix } from '@/lib/narrative'
import PetSvg from '@/components/pet/PetSvg'

interface NarrativePageProps {
  store: Store
  narrativeId: string
  onBack: () => void
}

export function NarrativePage({ store, narrativeId, onBack }: NarrativePageProps) {
  const narrative = store.getNarrative(narrativeId)
  const companion = COMPANION_CHARACTERS[store.space.companion]

  if (!narrative) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <p className="text-center text-gray-400 mt-20">叙事内容未找到</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-8">
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-800 mb-4 animate-narrative-reveal">
          {narrative.title}
        </h1>

        {/* Photos */}
        {narrative.photoUrls.length > 0 && (
          <div className="mb-5 animate-narrative-reveal" style={{ animationDelay: '0.15s' }}>
            <div className={`grid gap-2 ${
              narrative.photoUrls.length === 1 ? 'grid-cols-1' :
              narrative.photoUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {narrative.photoUrls.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body text */}
        <p className="text-sm leading-relaxed text-gray-700 mb-6 animate-narrative-reveal" style={{ animationDelay: '0.3s' }}>
          {narrative.bodyText}
        </p>

        {/* Divider */}
        <div className="w-12 h-px bg-gray-200 mx-auto mb-5 animate-narrative-reveal" style={{ animationDelay: '0.45s' }} />

        {/* Pet summary */}
        <div
          className="flex items-start gap-2.5 bg-amber-50/80 rounded-2xl px-3.5 py-3 animate-narrative-reveal"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/70">
            <PetSvg animal={store.space.companion} expression="happy" className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900 mb-0.5">{companion.name}</p>
            <p className="text-sm text-amber-800 italic leading-relaxed">
              “{stripPetSpeakerPrefix(narrative.petSummary)}”
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 text-center animate-narrative-reveal" style={{ animationDelay: '0.75s' }}>
          <p className="text-xs text-gray-400">
            {new Date(narrative.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            {' '}
            {new Date(narrative.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}
