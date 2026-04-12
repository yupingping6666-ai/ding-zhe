import { useRef, useCallback } from 'react'
import type { FeelingEntry, Comment } from '@/types'
import { CommentSection } from '@/components/CommentSection'
import { UserAvatar } from '@/components/UserAvatar'
import { Video, MapPin, Trash2, EyeOff } from 'lucide-react'

interface PhotoFeedCardProps {
  entry: FeelingEntry
  photos: string[]
  mediaTypes?: ('image' | 'video')[]
  comments: Comment[]
  onAddComment: (content: string) => void
  onPhotoTap: (photoIndex: number) => void
  onLongPress?: () => void
  onClick?: () => void
  onDelete?: () => void
  onHidePhoto?: (photoIndex: number) => void
  showHidden?: boolean
  isHidden?: boolean
  currentUserName?: string
  petName?: string
  petAvatar?: string
  authorName?: string
  authorAvatar?: string
  resolveUserName?: (userId?: string) => { name: string; avatar: string }
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export function PhotoFeedCard({
  entry, photos, mediaTypes, comments, onAddComment, onPhotoTap,
  onLongPress, onClick, onDelete, onHidePhoto, showHidden, isHidden, currentUserName,
  petName, petAvatar, authorName, authorAvatar, resolveUserName,
}: PhotoFeedCardProps) {
  const moodTag = entry.mood
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)
  const photoLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      onLongPress?.()
    }, 600)
  }, [onLongPress])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (photoLongPressTimer.current) {
      clearTimeout(photoLongPressTimer.current)
      photoLongPressTimer.current = null
    }
  }, [])

  const hiddenIndices = entry.hiddenPhotoIndices ?? []

  // Filter photos: in normal mode hide hidden photos; in showHidden mode show all
  const visiblePhotos = showHidden
    ? photos.map((url, idx) => ({ url, idx, isPhotoHidden: hiddenIndices.includes(idx) }))
    : photos.map((url, idx) => ({ url, idx, isPhotoHidden: hiddenIndices.includes(idx) })).filter((p) => !p.isPhotoHidden)

  const gridCols =
    visiblePhotos.length === 1 ? 'grid-cols-1'
    : visiblePhotos.length === 2 ? 'grid-cols-2'
    : visiblePhotos.length === 4 ? 'grid-cols-2'
    : 'grid-cols-3'

  return (
    <div
      className={`bg-card rounded-2xl border p-4 animate-fade-in transition-opacity ${isHidden ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={() => { if (!didLongPress.current) onClick?.() }}
    >
      {/* Hidden badge */}
      {isHidden && (
        <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          <span>已隐藏</span>
        </div>
      )}

      {/* Author line (dual mode) */}
      {authorName && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-5 h-5 rounded-full overflow-hidden inline-flex items-center justify-center text-base"><UserAvatar avatar={authorAvatar || '👧'} imgClass="w-5 h-5" /></span>
          <span className="text-xs font-medium text-muted-foreground">{authorName}</span>
        </div>
      )}

      {/* Header: mood + content */}
      {(entry.content || moodTag) && (
        <div className="mb-3">
          {entry.content && (
            <p className="text-sm text-foreground leading-relaxed">
              {moodTag && <span className="mr-1">{moodTag}</span>}
              {entry.content}
            </p>
          )}
          {!entry.content && moodTag && (
            <span className="text-lg">{moodTag}</span>
          )}
        </div>
      )}

      {/* Photo/Video grid */}
      {visiblePhotos.length > 0 && (
        <div className={`grid ${gridCols} gap-1 rounded-xl overflow-hidden`}>
          {visiblePhotos.map(({ url, idx, isPhotoHidden }) => {
            const isVideo = mediaTypes?.[idx] === 'video'
            return (
              <div
                key={idx}
                className={`relative cursor-pointer ${visiblePhotos.length === 1 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!didLongPress.current) onPhotoTap(idx)
                }}
                onContextMenu={(e) => {
                  if (onHidePhoto) {
                    e.preventDefault()
                    e.stopPropagation()
                    onHidePhoto(idx)
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  if (onHidePhoto) {
                    photoLongPressTimer.current = setTimeout(() => {
                      didLongPress.current = true
                      onHidePhoto(idx)
                    }, 600)
                  }
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  if (photoLongPressTimer.current) {
                    clearTimeout(photoLongPressTimer.current)
                    photoLongPressTimer.current = null
                  }
                }}
              >
                {isVideo ? (
                  <video src={url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                {/* Hidden overlay */}
                {isPhotoHidden && showHidden && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-white/80" />
                  </div>
                )}
                {isVideo && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-2xs flex items-center gap-0.5">
                    <Video className="w-3 h-3" />
                  </div>
                )}
                {visiblePhotos.length > 9 && idx === 8 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">+{visiblePhotos.length - 9}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Location */}
      {entry.location && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{entry.location.name || `${entry.location.lat.toFixed(4)}, ${entry.location.lng.toFixed(4)}`}</span>
        </div>
      )}

      {/* Date + Delete */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(entry.createdAt)}
        </span>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 -mr-1 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Comments */}
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
        <CommentSection
          comments={comments}
          onAddComment={onAddComment}
          currentUserName={currentUserName}
          petName={petName}
          petAvatar={petAvatar}
          resolveUserName={resolveUserName}
        />
      </div>
    </div>
  )
}
