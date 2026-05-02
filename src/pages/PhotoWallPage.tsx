import { useState } from 'react'
import type { Store } from '@/store'
import type { Photo } from '@/api/photos'
import type { FeelingEntry } from '@/types'
import { BookHeart, ChevronLeft, Sparkles, Loader2 } from 'lucide-react'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { PhotoFeedCard } from '@/components/PhotoFeedCard'
import { PhotoDetailView } from '@/components/PhotoDetailView'
import { EntryActionSheet } from '@/components/EntryActionSheet'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { PrivacyLockScreen } from '@/components/PrivacyLockScreen'

interface PhotoWallPageProps {
  store: Store
  userMode: 'single' | 'dual'
  currentUserId: string
  onBack: () => void
  onOpenFeelingDetail?: (feelingId: string) => void
  /** Generate AI narrative from the available feelings; returns true if one was created. */
  onGenerateNarrative?: () => Promise<boolean>
}

/** Normalize a FeelingEntry's photos into a flat URL array (backward compat) */
function getEntryPhotos(entry: FeelingEntry): string[] {
  return entry.photoUrls ?? (entry.photoUrl ? [entry.photoUrl] : [])
}

export function PhotoWallPage({ store, userMode, currentUserId, onBack, onOpenFeelingDetail, onGenerateNarrative }: PhotoWallPageProps) {
  const [detailPhotos, setDetailPhotos] = useState<Photo[] | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)
  const [showHidden, setShowHidden] = useState(false)
  const [actionTarget, setActionTarget] = useState<FeelingEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FeelingEntry | null>(null)
  const [privacyLockVisible, setPrivacyLockVisible] = useState(false)
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [storyHint, setStoryHint] = useState<string | null>(null)
  const userName = store.getUserProfile(currentUserId).name
  const companion = COMPANION_CHARACTERS[store.space.companion]

  // Directly compute from store.feelings
  // Dual mode: show both users' feelings; single mode: only current user
  const allEntries = (userMode === 'dual'
    ? store.feelings.filter((f) => {
        // Show own entries (including hidden toggle), exclude other's hidden
        if (f.userId === currentUserId) return true
        return !f.isHidden
      })
    : store.feelings.filter((f) => f.userId === currentUserId)
  ).sort((a, b) => b.createdAt - a.createdAt)

  const visibleEntries = allEntries.filter((f) => !f.isHidden)
  // Hidden entries: only show current user's hidden ones
  const hiddenEntries = allEntries.filter((f) => !!f.isHidden && f.userId === currentUserId)

  // Switch entries based on showHidden state - this creates a page toggle effect
  const currentEntries = showHidden ? hiddenEntries : visibleEntries
  const pageTitle = showHidden ? '隐藏记录' : '纪念'

  // Group helper
  function groupByDate(entries: FeelingEntry[]) {
    return entries.reduce<Record<string, FeelingEntry[]>>((acc, entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString('zh-CN')
      if (!acc[date]) acc[date] = []
      acc[date].push(entry)
      return acc
    }, {})
  }

  const groupedCurrent = groupByDate(currentEntries)

  // Open photo detail for a specific entry + photo index
  function openDetail(entry: FeelingEntry, photoIndex: number) {
    const urls = getEntryPhotos(entry)
    const photos: Photo[] = urls.map((url, i) => ({
      id: `${entry.id}-photo-${i}`,
      userId: entry.userId,
      mode: 'single',
      url,
      description: i === 0 ? entry.content || null : null,
      relatedTaskId: null,
      tags: i === 0 ? [entry.mood] : [],
      createdAt: new Date(entry.createdAt).toISOString(),
      mediaType: entry.mediaTypes?.[i] ?? 'image',
    }))
    setDetailPhotos(photos)
    setDetailIndex(photoIndex)
  }

  function handleDelete() {
    if (deleteTarget) {
      store.deleteFeeling(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const emptyMessage = showHidden ? '还没有隐藏的记录' : '还没有任何纪念'
  const emptySubMessage = showHidden ? '长按记录可隐藏' : '记录你的感受和照片，留住珍贵回忆'

  if (privacyLockVisible) {
    return (
      <PrivacyLockScreen
        hiddenCount={hiddenEntries.length}
        onUnlocked={() => {
          setPrivacyLockVisible(false)
          setShowHidden(true)
        }}
        onCancel={() => setPrivacyLockVisible(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!showHidden && onGenerateNarrative && (
              <button
                onClick={async () => {
                  if (isGeneratingStory) return
                  if (visibleEntries.length === 0) {
                    setStoryHint('先记录一条心情，小橘才能帮你写故事哦')
                    setTimeout(() => setStoryHint(null), 2400)
                    return
                  }
                  setIsGeneratingStory(true)
                  try {
                    const ok = await onGenerateNarrative()
                    if (!ok) {
                      setStoryHint('生成失败，稍后再试试')
                      setTimeout(() => setStoryHint(null), 2400)
                    }
                  } finally {
                    setIsGeneratingStory(false)
                  }
                }}
                disabled={isGeneratingStory}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 active:scale-95 transition disabled:opacity-60"
              >
                {isGeneratingStory ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingStory ? '生成中…' : '今日故事'}</span>
              </button>
            )}
            <button
              onClick={() => {
                if (showHidden) {
                  setShowHidden(false)
                } else {
                  setPrivacyLockVisible(true)
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showHidden ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-secondary hover:bg-accent'}`}
            >
              {showHidden ? '隐藏' : '显示隐藏'}
            </button>
          </div>
        </div>
        {storyHint && (
          <div className="mt-2 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-1.5 animate-fade-in">
            {storyHint}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-2 pb-20">
        {currentEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookHeart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground/70">
              {emptySubMessage}
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedCurrent).map(([date, entries], groupIdx) => (
              <div key={date}>
                <div className={`text-2xs text-muted-foreground/70 tracking-wide ${groupIdx === 0 ? 'pt-1' : 'pt-3'} pb-1`}>
                  {date}
                </div>
                <div className={`divide-y divide-border/30 ${showHidden ? 'opacity-70' : ''}`}>
                  {entries.map((entry) => {
                    const isOwnEntry = entry.userId === currentUserId
                    const entryAuthor = store.getUserProfile(entry.userId)
                    return (
                      <PhotoFeedCard
                        key={entry.id}
                        entry={entry}
                        photos={getEntryPhotos(entry)}
                        mediaTypes={entry.mediaTypes}
                        comments={store.getComments(entry.id)}
                        onAddComment={(text) => store.addComment(entry.id, text, 'user', currentUserId)}
                        onPhotoTap={(idx) => openDetail(entry, idx)}
                        onLongPress={isOwnEntry ? () => setActionTarget(entry) : undefined}
                        onClick={() => onOpenFeelingDetail?.(entry.id)}
                        onDelete={isOwnEntry ? () => setDeleteTarget(entry) : undefined}
                        onHidePhoto={isOwnEntry ? (idx) => store.toggleHidePhoto(entry.id, idx) : undefined}
                        onToggleLike={() => store.toggleLikeFeeling(entry.id, currentUserId)}
                        currentUserId={currentUserId}
                        showHidden={showHidden}
                        isHidden={showHidden}
                        currentUserName={userName}
                        petName={companion.name}
                        petAvatar={companion.avatar}
                        authorName={entryAuthor.name}
                        authorAvatar={entryAuthor.avatar}
                        resolveUserName={(userId?: string) => {
                          if (!userId) return { name: userName, avatar: store.getUserProfile(currentUserId).avatar }
                          const profile = store.getUserProfile(userId)
                          return { name: profile.name, avatar: profile.avatar }
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Detail Lightbox */}
      {detailPhotos && (
        <PhotoDetailView
          photos={detailPhotos}
          initialIndex={detailIndex}
          onClose={() => setDetailPhotos(null)}
        />
      )}

      {/* Action Sheet */}
      {actionTarget && (
        <EntryActionSheet
          isHidden={!!actionTarget.isHidden}
          onHide={() => store.toggleHideFeeling(actionTarget.id)}
          onDelete={() => setDeleteTarget(actionTarget)}
          onClose={() => setActionTarget(null)}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          photoCount={getEntryPhotos(deleteTarget).length}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
