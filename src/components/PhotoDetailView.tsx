import { useState, useRef, useCallback, useEffect } from 'react'
import type { Photo } from '@/api/photos'
import { X } from 'lucide-react'

interface PhotoDetailViewProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
}

export function PhotoDetailView({ photos, initialIndex, onClose }: PhotoDetailViewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [offsetX, setOffsetX] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const touchRef = useRef<{
    startX: number
    startY: number
    isSwiping: boolean | null // null = undecided, true = horizontal, false = vertical
  }>({ startX: 0, startY: 0, isSwiping: null })

  const containerRef = useRef<HTMLDivElement>(null)

  const photo = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  // Auto-focus for keyboard events
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= photos.length) return
      setIsTransitioning(true)
      setCurrentIndex(index)
      setOffsetX(0)
      // Allow transition to finish before removing the flag
      setTimeout(() => setIsTransitioning(false), 200)
    },
    [photos.length]
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchRef.current = { startX: touch.clientX, startY: touch.clientY, isSwiping: null }
    setIsTransitioning(false)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchRef.current.startX
      const deltaY = touch.clientY - touchRef.current.startY

      // Decide swipe direction if not yet decided
      if (touchRef.current.isSwiping === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          touchRef.current.isSwiping = Math.abs(deltaX) > Math.abs(deltaY)
        }
        return
      }

      if (!touchRef.current.isSwiping) return

      e.preventDefault()

      // Apply rubber-band resistance at edges
      let newOffset = deltaX
      if ((!hasPrev && deltaX > 0) || (!hasNext && deltaX < 0)) {
        newOffset = deltaX * 0.3
      }
      setOffsetX(newOffset)
    },
    [hasPrev, hasNext]
  )

  const handleTouchEnd = useCallback(() => {
    const ref = touchRef.current

    // If not a horizontal swipe, check for tap-to-close
    if (ref.isSwiping !== true) {
      // Tap on image area → close
      if (ref.isSwiping === null) {
        onClose()
      }
      return
    }

    if (Math.abs(offsetX) > 60) {
      // Swipe threshold met → navigate
      if (offsetX > 0 && hasPrev) {
        goTo(currentIndex - 1)
      } else if (offsetX < 0 && hasNext) {
        goTo(currentIndex + 1)
      } else {
        // At edge, snap back
        setIsTransitioning(true)
        setOffsetX(0)
        setTimeout(() => setIsTransitioning(false), 200)
      }
    } else if (Math.abs(offsetX) < 5) {
      // Negligible movement → tap to close
      setOffsetX(0)
      onClose()
    } else {
      // Snap back
      setIsTransitioning(true)
      setOffsetX(0)
      setTimeout(() => setIsTransitioning(false), 200)
    }
  }, [offsetX, hasPrev, hasNext, currentIndex, goTo, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && hasPrev) goTo(currentIndex - 1)
      else if (e.key === 'ArrowRight' && hasNext) goTo(currentIndex + 1)
    },
    [onClose, hasPrev, hasNext, currentIndex, goTo]
  )

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const transitionClass = isTransitioning ? 'transition-transform duration-200 ease-out' : ''

  // Get mood tag (first tag that's 1-2 chars, typically an emoji)
  const moodTag = photo.tags.length > 0 && photo.tags[0].length <= 2 ? photo.tags[0] : null

  function renderMedia(p: Photo) {
    if (p.mediaType === 'video') {
      return (
        <video
          src={p.url}
          className="max-w-full max-h-full object-contain"
          controls
          playsInline
          autoPlay={p === photo}
        />
      )
    }
    return (
      <img
        src={p.url}
        alt={p.description || ''}
        className="max-w-full max-h-full object-contain"
        draggable={false}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 bg-black animate-fade-in outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <span className="text-sm text-white/70">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>
      </div>

      {/* Image carousel area */}
      <div
        className="absolute inset-0 flex items-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous image */}
        {hasPrev && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${transitionClass}`}
            style={{ transform: `translateX(calc(-100% + ${offsetX}px))` }}
          >
            {renderMedia(photos[currentIndex - 1])}
          </div>
        )}

        {/* Current image */}
        <div
          className={`absolute inset-0 flex items-center justify-center ${transitionClass}`}
          style={{ transform: `translateX(${offsetX}px)` }}
        >
          {renderMedia(photo)}
        </div>

        {/* Next image */}
        {hasNext && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${transitionClass}`}
            style={{ transform: `translateX(calc(100% + ${offsetX}px))` }}
          >
            {renderMedia(photos[currentIndex + 1])}
          </div>
        )}
      </div>

      {/* Bottom info panel */}
      {(photo.description || moodTag) && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent pt-12 pb-6 px-4">
          <div className="flex items-start gap-2">
            {moodTag && (
              <span className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-sm">
                {moodTag}
              </span>
            )}
            <div className="flex-1 min-w-0">
              {photo.description && (
                <p className="text-sm text-white line-clamp-3">{photo.description}</p>
              )}
              <p className="text-xs text-white/50 mt-1">{formatDate(photo.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Date-only fallback when no description/mood */}
      {!photo.description && !moodTag && (
        <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
          <p className="text-xs text-white/50">{formatDate(photo.createdAt)}</p>
        </div>
      )}
    </div>
  )
}
