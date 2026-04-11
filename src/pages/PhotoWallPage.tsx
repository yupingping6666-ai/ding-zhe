import { useState } from 'react'
import type { Store } from '@/store'
import type { Photo } from '@/api/photos'
import type { FeelingEntry } from '@/types'
import { BookHeart, Calendar } from 'lucide-react'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { PhotoFeedCard } from '@/components/PhotoFeedCard'
import { PhotoDetailView } from '@/components/PhotoDetailView'
import { EntryActionSheet } from '@/components/EntryActionSheet'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import PetCommentLine from '@/components/PetCommentLine'
import { PrivacyLockScreen } from '@/components/PrivacyLockScreen'

interface PhotoWallPageProps {
  store: Store
  userMode: 'single' | 'dual'
  currentUserId: string
  onBack: () => void
  onOpenFeelingDetail?: (feelingId: string) => void
}

/** Normalize a FeelingEntry's photos into a flat URL array (backward compat) */
function getEntryPhotos(entry: FeelingEntry): string[] {
  return entry.photoUrls ?? (entry.photoUrl ? [entry.photoUrl] : [])
}

export function PhotoWallPage({ store, userMode, currentUserId, onOpenFeelingDetail }: PhotoWallPageProps) {
  const [detailPhotos, setDetailPhotos] = useState<Photo[] | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)
  const [showHidden, setShowHidden] = useState(false)
  const [actionTarget, setActionTarget] = useState<FeelingEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FeelingEntry | null>(null)
  const [privacyLockVisible, setPrivacyLockVisible] = useState(false)
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
          <h1 className="text-lg font-bold">{pageTitle}</h1>
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

      {/* Content */}
      <div className="px-4 py-4 pb-20">
        {currentEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookHeart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground/70">
              {emptySubMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCurrent).map(([date, entries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{date}</span>
                  <span className="text-xs">({entries.length} 条)</span>
                </div>
                <div className={`space-y-4 ${showHidden ? 'opacity-70' : ''}`}>
                  {entries.map((entry) => {
                    const petComment = store.getPetComment(entry.id)
                    const isOwnEntry = entry.userId === currentUserId
                    const entryAuthor = store.getUserProfile(entry.userId)
                    return (
                      <div key={entry.id}>
                        <PhotoFeedCard
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
                          showHidden={showHidden}
                          isHidden={showHidden}
                          currentUserName={userName}
                          petName={companion.name}
                          petAvatar={companion.avatar}
                          authorName={userMode === 'dual' ? entryAuthor.name : undefined}
                          authorAvatar={userMode === 'dual' ? entryAuthor.avatar : undefined}
                          resolveUserName={userMode === 'dual' ? (userId?: string) => {
                            if (!userId) return { name: userName, avatar: store.getUserProfile(currentUserId).avatar }
                            const profile = store.getUserProfile(userId)
                            return { name: profile.name, avatar: profile.avatar }
                          } : undefined}
                        />
                        {petComment && !showHidden && (
                          <PetCommentLine comment={petComment} className="mt-1.5 ml-1" />
                        )}
                      </div>
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
