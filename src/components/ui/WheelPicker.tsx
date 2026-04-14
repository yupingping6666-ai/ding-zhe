import { useRef, useEffect, useCallback, useState } from 'react'

interface WheelPickerProps {
  items: string[]
  value: string
  onChange: (val: string) => void
  visibleCount?: number
}

const ITEM_HEIGHT = 36

export function WheelPicker({ items, value, onChange, visibleCount = 5 }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const moved = useRef(false)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const velocityRef = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animFrame = useRef<number>(0)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [offset, setOffset] = useState(0)
  const offsetRef = useRef(0)

  const halfVisible = Math.floor(visibleCount / 2)
  const containerHeight = ITEM_HEIGHT * visibleCount

  useEffect(() => { offsetRef.current = offset }, [offset])

  // Sync offset from external value/items changes
  useEffect(() => {
    const idx = items.indexOf(value)
    const targetIdx = idx >= 0 ? idx : 0
    const val = -targetIdx * ITEM_HEIGHT
    setOffset(val)
    offsetRef.current = val
  }, [value, items])

  const clampOffset = useCallback((y: number) => {
    return Math.max(-(items.length - 1) * ITEM_HEIGHT, Math.min(0, y))
  }, [items.length])

  const emitChange = useCallback((off: number) => {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(-off / ITEM_HEIGHT)))
    if (items[idx] !== value) onChange(items[idx])
  }, [items, value, onChange])

  const snapToNearest = useCallback((cur: number) => {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(-cur / ITEM_HEIGHT)))
    const target = -idx * ITEM_HEIGHT

    if (Math.abs(target - cur) < 1) {
      setOffset(target)
      offsetRef.current = target
      emitChange(target)
      return
    }

    const from = cur
    const dist = target - from
    const t0 = performance.now()

    const tick = (now: number) => {
      const p = Math.min((now - t0) / 180, 1)
      const v = from + dist * (1 - Math.pow(1 - p, 3))
      setOffset(v)
      offsetRef.current = v
      if (p < 1) {
        animFrame.current = requestAnimationFrame(tick)
      } else {
        setOffset(target)
        offsetRef.current = target
        emitChange(target)
      }
    }

    cancelAnimationFrame(animFrame.current)
    animFrame.current = requestAnimationFrame(tick)
  }, [items.length, emitChange])

  const momentum = useCallback((vel: number, from: number) => {
    let v = vel, pos = from
    const tick = () => {
      v *= 0.94
      pos = clampOffset(pos + v)
      setOffset(pos)
      offsetRef.current = pos
      if (Math.abs(v) > 0.5) {
        animFrame.current = requestAnimationFrame(tick)
      } else {
        snapToNearest(pos)
      }
    }
    cancelAnimationFrame(animFrame.current)
    animFrame.current = requestAnimationFrame(tick)
  }, [clampOffset, snapToNearest])

  // --- Pointer down (unified) ---
  const pointerDown = useCallback((y: number) => {
    cancelAnimationFrame(animFrame.current)
    if (snapTimer.current) clearTimeout(snapTimer.current)
    dragging.current = true
    moved.current = false
    startY.current = y
    startOffset.current = offsetRef.current
    lastY.current = y
    lastTime.current = performance.now()
    velocityRef.current = 0
  }, [])

  const pointerMove = useCallback((y: number) => {
    if (!dragging.current) return
    const dy = y - startY.current
    if (Math.abs(dy) > 2) moved.current = true
    const now = performance.now()
    const dt = now - lastTime.current
    if (dt > 0) velocityRef.current = (y - lastY.current) / dt * 16
    lastY.current = y
    lastTime.current = now
    const val = clampOffset(startOffset.current + dy)
    setOffset(val)
    offsetRef.current = val
  }, [clampOffset])

  const pointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    if (Math.abs(velocityRef.current) > 2) {
      momentum(velocityRef.current, offsetRef.current)
    } else {
      snapToNearest(offsetRef.current)
    }
  }, [momentum, snapToNearest])

  // Touch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    pointerDown(e.touches[0].clientY)
  }, [pointerDown])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    pointerMove(e.touches[0].clientY)
  }, [pointerMove])
  const onTouchEnd = useCallback(() => pointerUp(), [pointerUp])

  // Mouse down on container
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    pointerDown(e.clientY)
  }, [pointerDown])

  // Global mouse move/up
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      e.preventDefault()
      pointerMove(e.clientY)
    }
    const onUp = () => pointerUp()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [pointerMove, pointerUp])

  // Wheel
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    cancelAnimationFrame(animFrame.current)
    if (snapTimer.current) clearTimeout(snapTimer.current)
    const val = clampOffset(offsetRef.current - e.deltaY * 0.8)
    setOffset(val)
    offsetRef.current = val
    snapTimer.current = setTimeout(() => snapToNearest(val), 120)
  }, [clampOffset, snapToNearest])

  // Click item to select
  const onItemClick = useCallback((i: number) => {
    if (moved.current) return
    snapToNearest(-i * ITEM_HEIGHT)
  }, [snapToNearest])

  useEffect(() => () => {
    cancelAnimationFrame(animFrame.current)
    if (snapTimer.current) clearTimeout(snapTimer.current)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: containerHeight }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-1 right-1 pointer-events-none z-10 border-y border-primary/25 bg-primary/5 rounded-md"
        style={{ top: halfVisible * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      {/* Fades */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-20" style={{ height: halfVisible * ITEM_HEIGHT, background: 'linear-gradient(to bottom, rgba(255,255,255,0.85), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20" style={{ height: halfVisible * ITEM_HEIGHT, background: 'linear-gradient(to top, rgba(255,255,255,0.85), transparent)' }} />

      {/* Items */}
      <div className="absolute inset-x-0" style={{ transform: `translateY(${offset + halfVisible * ITEM_HEIGHT}px)` }}>
        {items.map((item, i) => {
          const d = Math.abs(i * ITEM_HEIGHT + offset) / ITEM_HEIGHT
          return (
            <div
              key={`${item}-${i}`}
              className="flex items-center justify-center text-sm font-medium text-foreground"
              style={{ height: ITEM_HEIGHT, opacity: Math.max(0.25, 1 - d * 0.25), transform: `scale(${Math.max(0.88, 1 - d * 0.04)})` }}
              onClick={() => onItemClick(i)}
            >
              {item}
            </div>
          )
        })}
      </div>
    </div>
  )
}
