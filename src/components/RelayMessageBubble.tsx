import { useEffect, useRef, useState } from 'react'
import type { RelayMessage } from '@/types'
import type { CompanionAnimal } from '@/lib/companion'
import PetSvg from '@/components/pet/PetSvg'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  message: RelayMessage
  companionAnimal: CompanionAnimal
  senderName: string
  onRead: () => void
}

export function RelayMessageBubble({ message, companionAnimal, senderName, onRead }: Props) {
  const readRef = useRef(false)
  const [showOriginal, setShowOriginal] = useState(false)

  useEffect(() => {
    if (!readRef.current) {
      readRef.current = true
      const timer = setTimeout(onRead, 2000)
      return () => clearTimeout(timer)
    }
  }, [onRead])

  return (
    <div className="flex items-end gap-2 animate-msg-appear">
      <div className="relative w-7 h-7 flex-shrink-0">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary/50">
          <PetSvg animal={companionAnimal} expression="love" className="w-full h-full" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 text-2xs">💌</span>
      </div>
      <div
        className="max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2.5"
        style={{ background: 'linear-gradient(135deg, hsl(32 80% 96%), hsl(25 70% 94%))' }}
      >
        <p className="text-2xs text-muted-foreground/70 mb-1">{senderName}让我悄悄跟你说...</p>
        <p className="text-xs text-foreground leading-relaxed">{message.relayText}</p>
        {message.originalText && (
          <>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="mt-1.5 flex items-center gap-0.5 text-2xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <span>查看原话</span>
              {showOriginal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showOriginal && (
              <div className="mt-1 pl-2 border-l-2 border-foreground/10">
                <p className="text-2xs text-muted-foreground/70 leading-relaxed">"{message.originalText}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface SenderProps {
  relay: RelayMessage
  companionAnimal: CompanionAnimal
  companionName: string
  receiverName: string
}

export function SenderRelayBubble({ relay, companionAnimal, companionName, receiverName }: SenderProps) {
  const [showRelay, setShowRelay] = useState(false)

  return (
    <div className="flex items-end gap-2 animate-msg-appear">
      <div className="relative w-7 h-7 flex-shrink-0">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary/50">
          <PetSvg animal={companionAnimal} expression="love" className="w-full h-full" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 text-2xs">✉️</span>
      </div>
      <div
        className="max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2.5"
        style={{ background: 'linear-gradient(135deg, hsl(210 60% 96%), hsl(220 50% 94%))' }}
      >
        <p className="text-2xs text-muted-foreground/70 mb-1">{companionName}已帮你传达给{receiverName}</p>
        <p className="text-xs text-foreground leading-relaxed">"{relay.originalText}"</p>
        {relay.relayText && (
          <>
            <button
              onClick={() => setShowRelay(!showRelay)}
              className="mt-1.5 flex items-center gap-0.5 text-2xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <span>{companionName}的转述</span>
              {showRelay ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showRelay && (
              <div className="mt-1 pl-2 border-l-2 border-foreground/10">
                <p className="text-2xs text-muted-foreground/70 leading-relaxed">"{relay.relayText}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
