import { useState, useEffect, useRef } from 'react'
import type { PetExpression } from '@/types'
import idleImg from '@/assets/pets/cat/idle.png'
import happyImg from '@/assets/pets/cat/happy.png'
import sleepingImg from '@/assets/pets/cat/sleeping.png'
import loveImg from '@/assets/pets/cat/love.png'
import eatingImg from '@/assets/pets/cat/eating.png'
import thinkingImg from '@/assets/pets/cat/thinking.png'
import curiousImg from '@/assets/pets/cat/curious.png'
import angryImg from '@/assets/pets/cat/angry.png'
import playingImg from '@/assets/pets/cat/playing.png'
import sittingImg from '@/assets/pets/cat/sitting.png'
import lyingImg from '@/assets/pets/cat/lying.png'
import standingImg from '@/assets/pets/cat/standing.png'
import errorImg from '@/assets/pets/cat/error.png'
import achievementImg from '@/assets/pets/cat/achievement.png'
import notificationImg from '@/assets/pets/cat/notification.png'
import emptyImg from '@/assets/pets/cat/empty.png'
import blinkHalfImg from '@/assets/pets/cat/blink-half.png'
import blinkClosedImg from '@/assets/pets/cat/blink-closed.png'

interface CatPngProps {
  expression: PetExpression
  className?: string
  blink?: boolean
}

const CAT_IMAGES: Record<PetExpression, string> = {
  idle: idleImg,
  happy: happyImg,
  sleeping: sleepingImg,
  love: loveImg,
  eating: eatingImg,
  thinking: thinkingImg,
  curious: curiousImg,
  angry: angryImg,
  playing: playingImg,
  sitting: sittingImg,
  lying: lyingImg,
  standing: standingImg,
  error: errorImg,
  achievement: achievementImg,
  notification: notificationImg,
  empty: emptyImg,
}

// 支持眨眼的表情 (正面朝前、眼睛张开)
const BLINKABLE = new Set<PetExpression>(['idle', 'sitting'])

export default function CatPng({ expression, className, blink }: CatPngProps) {
  const imageSrc = CAT_IMAGES[expression] || CAT_IMAGES.idle
  const canBlink = blink && BLINKABLE.has(expression)

  const [blinkPhase, setBlinkPhase] = useState<'open' | 'half' | 'closed'>('open')
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    if (!canBlink) {
      setBlinkPhase('open')
      return
    }

    const clearTimers = () => {
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current = []
    }

    let intervalId: number

    const doBlink = () => {
      setBlinkPhase('half')
      timersRef.current.push(
        window.setTimeout(() => setBlinkPhase('closed'), 80),
        window.setTimeout(() => setBlinkPhase('half'), 200),
        window.setTimeout(() => setBlinkPhase('open'), 280),
      )
    }

    const firstDelay = window.setTimeout(() => {
      doBlink()
      intervalId = window.setInterval(doBlink, 3000 + Math.random() * 2000)
    }, 2000 + Math.random() * 1000)

    return () => {
      clearTimeout(firstDelay)
      clearInterval(intervalId)
      clearTimers()
    }
  }, [canBlink])

  const displaySrc = canBlink && blinkPhase === 'half'
    ? blinkHalfImg
    : canBlink && blinkPhase === 'closed'
      ? blinkClosedImg
      : imageSrc

  return (
    <div className={`relative ${className || ''}`}>
      <img
        src={displaySrc}
        alt={`Cat ${expression}`}
        className="w-full h-full object-contain"
        onError={(e) => {
          if (displaySrc !== CAT_IMAGES.idle) {
            e.currentTarget.src = CAT_IMAGES.idle
          }
        }}
      />
    </div>
  )
}
