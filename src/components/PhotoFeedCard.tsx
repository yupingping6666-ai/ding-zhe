import { useRef, useCallback } from 'react'
import type { FeelingEntry, Comment } from '@/types'
import { CommentSection } from '@/components/CommentSection'
import { UserAvatar } from '@/components/UserAvatar'
import { Video, MapPin, Trash2, EyeOff, Heart } from 'lucide-react'

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
  onToggleLike?: () => void
  currentUserId?: string
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
  onLongPress, onClick, onDelete, onHidePhoto, onToggleLike, currentUserId,
  showHidden, isHidden, currentUserName,
  petName, petAvatar, authorName, authorAvatar, resolveUserName,
}: PhotoFeedCardProps) {
  const moodTag = entry.mood
  const isLiked = currentUserId ? (entry.likedBy ?? []).includes(currentUserId) : false
  const likedBy = entry.likedBy ?? []
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
    <article
      className={`flex gap-3 py-4 animate-fade-in transition-opacity ${isHidden ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={() => { if (!didLongPress.current) onClick?.() }}
    >
      {/* Left: avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center text-2xl">
          <UserAvatar avatar={authorAvatar || '👧'} imgClass="w-10 h-10" />
        </div>
      </div>

      {/* Right: content column */}
      <div className="flex-1 min-w-0">
        {/* Nickname + hidden badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[hsl(var(--primary))] leading-tight truncate">
            {authorName || currentUserName || '我'}
          </span>
          {isHidden && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-2xs text-muted-foreground">已隐藏</span>
          )}
        </div>

        {/* Content text */}
        {(entry.content || moodTag) && (
          <div className="mt-1">
            {entry.content && (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
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
          <div className={`mt-2 grid ${gridCols} gap-1`}>
            {visiblePhotos.map(({ url, idx, isPhotoHidden }) => {
              const isVideo = mediaTypes?.[idx] === 'video'
              return (
                <div
                  key={idx}
                  className={`relative cursor-pointer ${visiblePhotos.length === 1 ? 'aspect-[4/3] max-w-[70%]' : 'aspect-square'} overflow-hidden rounded-md`}
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

        {/* Time + Actions */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(entry.createdAt)}
          </span>
          <div className="flex items-center gap-0.5">
            {onToggleLike && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLike() }}
                className={`p-1.5 rounded-full transition-colors ${
                  isLiked
                    ? 'text-red-400 hover:bg-red-50'
                    : 'text-muted-foreground/50 hover:text-red-400 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-1.5 -mr-1 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Likes */}
        {likedBy.length > 0 && (
          <div className="mt-1.5 bg-secondary/50 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-red-400 fill-current flex-shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              {likedBy.map((uid) => resolveUserName?.(uid)?.name ?? uid).join(', ')}
            </span>
          </div>
        )}

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
    </article>
  )
}
