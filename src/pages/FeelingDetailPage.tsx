import { useState } from 'react'
import type { FeelingEntry, NarrativeEntry } from '@/types'
import type { Store } from '@/store'
import { CommentSection } from '@/components/CommentSection'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import PetCommentLine from '@/components/PetCommentLine'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { ArrowLeft, MapPin, Pencil, Trash2, Video, Eye, EyeOff, X, Check, Sparkles } from 'lucide-react'

interface Props {
  store: Store
  feelingId: string
  currentUserId: string
  onBack: () => void
  onOpenNarrative?: (narrativeId: string) => void
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '😌', label: '平静' },
  { emoji: '😔', label: '低落' },
  { emoji: '😤', label: '烦躁' },
  { emoji: '🥰', label: '幸福' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '🌿', label: '放松' },
  { emoji: '💭', label: '思考' },
]

function getEntryPhotos(entry: FeelingEntry): string[] {
  return entry.photoUrls ?? (entry.photoUrl ? [entry.photoUrl] : [])
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FeelingDetailPage({ store, feelingId, currentUserId, onBack, onOpenNarrative }: Props) {
  const entry = store.feelings.find((f) => f.id === feelingId)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editMood, setEditMood] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [generatingNarrative, setGeneratingNarrative] = useState(false)

  // Check if narrative already exists in store for this feeling
  const existingNarrative = store.narratives.find((n) => n.feelingIds.includes(feelingId)) ?? null
  const [narrativeResult, setNarrativeResult] = useState<NarrativeEntry | null>(null)
  const narrative = narrativeResult ?? existingNarrative

  const userName = store.getUserProfile(currentUserId).name
  const comments = store.getComments(feelingId)

  if (!entry) {
    return (
      <div className="pb-8">
        <div className="flex items-center gap-3 px-4 pt-3 pb-4">
          <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">记录详情</h1>
        </div>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">该记录已被删除</p>
        </div>
      </div>
    )
  }

  const photos = getEntryPhotos(entry)
  const mediaTypes = entry.mediaTypes

  function startEdit() {
    setEditContent(entry!.content)
    setEditMood(entry!.mood)
    setEditing(true)
  }

  function saveEdit() {
    store.updateFeeling(feelingId, {
      content: editContent,
      mood: editMood,
    })
    setEditing(false)
  }

  function handleDelete() {
    store.deleteFeeling(feelingId)
    onBack()
  }

  const entryTypeLabel =
    entry.entryType === 'photo' ? '照片记录'
    : entry.entryType === 'mood' ? '瞬间感受'
    : entry.entryType === 'reminder' ? '提醒记录'
    : '记录'

  const isReminder = entry.entryType === 'reminder'

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{entryTypeLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              onClick={saveEdit}
              className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
          ) : !isReminder && (
            <>
              <button
                onClick={startEdit}
                className="p-2 rounded-full text-muted-foreground hover:bg-accent transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Mood */}
        {editing ? (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">心情</label>
            <div className="flex gap-2 flex-wrap">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.emoji}
                  onClick={() => setEditMood(opt.emoji)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    editMood === opt.emoji
                      ? 'bg-primary/10 ring-2 ring-primary/30 scale-105'
                      : 'bg-secondary hover:bg-accent'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-2xs text-muted-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{entry.mood}</span>
            <span className="text-sm text-muted-foreground">
              {MOOD_OPTIONS.find((m) => m.emoji === entry.mood)?.label}
            </span>
          </div>
        )}

        {/* Photo/Video grid */}
        {photos.length > 0 && (
          <div className={`grid ${photos.length === 1 ? 'grid-cols-1' : photos.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 rounded-xl overflow-hidden`}>
            {photos.map((url, idx) => {
              const isVideo = mediaTypes?.[idx] === 'video'
              const isPhotoHidden = (entry.hiddenPhotoIndices ?? []).includes(idx)
              return (
                <div
                  key={idx}
                  className={`relative ${photos.length === 1 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden rounded-lg`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    store.toggleHidePhoto(feelingId, idx)
                  }}
                >
                  {isVideo ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isPhotoHidden && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                      <EyeOff className="w-5 h-5 text-white/80" />
                      <span className="text-2xs text-white/70">已隐藏</span>
                    </div>
                  )}
                  {isVideo && !isPhotoHidden && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-2xs flex items-center gap-0.5">
                      <Video className="w-3 h-3" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Content */}
        {editing ? (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">内容</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
            />
          </div>
        ) : (
          entry.content && (
            <p className="text-sm text-foreground leading-relaxed">{entry.content}</p>
          )
        )}

        {/* Location */}
        {entry.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{entry.location.name || `${entry.location.lat.toFixed(4)}, ${entry.location.lng.toFixed(4)}`}</span>
          </div>
        )}

        {/* Date */}
        <div className="text-xs text-muted-foreground">
          {formatDate(entry.createdAt)}
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Pet comment - hide when narrative is generated (narrative includes pet summary) */}
        {!narrative && (() => {
          const petComment = store.getPetComment(feelingId)
          if (!petComment) return null
          return <PetCommentLine comment={petComment} className="py-1" />
        })()}

        {/* Narrative CTA / Result - hide for reminder entries */}
        {!editing && !isReminder && (
          narrative ? (
            <div className="animate-fade-in space-y-2">
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-200/40 p-4">
                <p className="text-xs text-amber-600/70 font-medium mb-2">✨ 这一天的意义</p>
                <p className="text-sm text-foreground leading-relaxed">{narrative.bodyText}</p>
              </div>
              <div className="flex items-start gap-1.5 px-1">
                <p className="text-xs text-gray-500 leading-relaxed italic">{narrative.petSummary}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={async () => {
                setGeneratingNarrative(true)
                const result = await store.generateNarrativeEntry([feelingId])
                setGeneratingNarrative(false)
                if (result) setNarrativeResult(result)
              }}
              disabled={generatingNarrative}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-sm text-amber-700 font-medium hover:from-amber-100 hover:to-orange-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generatingNarrative ? '正在生成...' : '生成这一天的意义'}
            </button>
          )
        )}

        {/* Comments */}
        <CommentSection
          comments={comments}
          onAddComment={(text) => store.addComment(feelingId, text, 'user')}
          currentUserName={userName}
          petName={COMPANION_CHARACTERS[store.space.companion].name}
          petAvatar={COMPANION_CHARACTERS[store.space.companion].avatar}
          resolveUserName={(userId?: string) => {
            if (!userId) return { name: userName, avatar: store.getUserProfile(currentUserId).avatar }
            const profile = store.getUserProfile(userId)
            return { name: profile.name, avatar: profile.avatar }
          }}
        />

        {/* Hide toggle */}
        {!editing && (
          <button
            onClick={() => store.toggleHideFeeling(feelingId)}
            className="w-full py-3 rounded-xl bg-secondary text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
          >
            {entry.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {entry.isHidden ? '取消隐藏' : '隐藏记录'}
          </button>
        )}
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          photoCount={photos.length}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
