import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import type { Store } from '@/store'
import type { PetExpression, ChatMessage, ChatQuickAction } from '@/types'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { canInteract, getInteractionCooldownRemaining, PET_COOLDOWNS } from '@/lib/pet-state'
import { useCurrentUser } from '@/contexts/UserContext'
import PetSvg from '@/components/pet/PetSvg'
import petHeroImg from '@/assets/pets/cat/pet-hero.png'
import {
  generateCatReply,
  getWelcomeMessage,
  getQuickActionUserText,
  inferExpression,
} from '@/lib/pet-chat'
import { chatWithPet } from '@/api/pet-chat'
import { EmotionRelayOverlay } from '@/components/EmotionRelayOverlay'
import { RelayMessageBubble } from '@/components/RelayMessageBubble'

interface PetPageProps {
  store: Store
  onTodayStory: () => void
  onFeelingCreate?: () => void
  onBack?: () => void
}

let msgIdCounter = 0
function nextMsgId() {
  return `msg-${Date.now()}-${++msgIdCounter}`
}

export function PetPage({ store, onTodayStory, onFeelingCreate, onBack }: PetPageProps) {
  const currentUserId = useCurrentUser()
  const companion = COMPANION_CHARACTERS[store.space.companion]

  // ---- Chat state ----
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [expression, setExpression] = useState<PetExpression>('idle')
  const [inputFocused, setInputFocused] = useState(false)
  const [, setTick] = useState(0)
  const [showRelaySheet, setShowRelaySheet] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const insightRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initRef = useRef(false)
  const chatHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])

  // Helper: push to chat history sliding window (max 6)
  const pushHistory = (role: 'user' | 'assistant', content: string) => {
    chatHistoryRef.current = [...chatHistoryRef.current, { role, content }].slice(-6)
  }

  // ---- Cooldowns ----
  const petReady = canInteract(store.currentPetState.lastPetted, PET_COOLDOWNS.pet)
  const feedReady = canInteract(store.currentPetState.lastFed, PET_COOLDOWNS.feed)
  const petCooldown = getInteractionCooldownRemaining(store.currentPetState.lastPetted, PET_COOLDOWNS.pet)
  const feedCooldown = getInteractionCooldownRemaining(store.currentPetState.lastFed, PET_COOLDOWNS.feed)

  useEffect(() => {
    if (petReady && feedReady) return
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [petReady, feedReady])

  // ---- Reply context ----
  const replyContext = useMemo(() => ({
    companionName: companion.name,
    petMood: store.currentPetState.mood,
    energy: store.currentPetState.energy,
    todayInteractions: store.currentPetState.todayInteractions,
    canPet: petReady,
    petCooldown,
    canFeed: feedReady,
    feedCooldown,
    relationDays: store.relationDays,
  }), [companion.name, store.currentPetState, petReady, petCooldown, feedReady, feedCooldown, store.relationDays])

  // ---- Recent photo URLs for AI vision (max 3, public http(s) URLs only) ----
  const recentPhotoUrls = useMemo(() => {
    const feelings = store.getFeelings(currentUserId)
    return feelings
      .filter(f => f.photoUrls && f.photoUrls.length > 0)
      .sort((a, b) => b.createdAt - a.createdAt)
      .flatMap(f => f.photoUrls || [])
      .filter(url => /^https?:\/\//.test(url)) // Only keep valid public URLs, skip blob: and relative
      .slice(0, 3)
  }, [store, currentUserId])

  // ---- Welcome message on mount ----
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const welcome = getWelcomeMessage(companion.name, store.currentPetState.mood)
    setExpression(welcome.expression)
    setMessages([{
      id: nextMsgId(),
      role: 'cat',
      content: welcome.text,
      timestamp: Date.now(),
      expression: welcome.expression,
    }])
  }, [companion.name, store.currentPetState.mood])

  // ---- Auto scroll ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ---- Inject relay messages from partner ----
  useEffect(() => {
    const unread = store.getUnreadRelays(currentUserId)
    if (unread.length === 0) return
    setMessages((prev) => {
      let updated = prev
      for (const relay of unread) {
        const relayMsgId = `relay-${relay.id}`
        if (updated.some((m) => m.id === relayMsgId)) continue
        updated = [
          ...updated,
          {
            id: relayMsgId,
            role: 'cat' as const,
            content: relay.relayText,
            timestamp: relay.createdAt,
            expression: 'love' as PetExpression,
            isRelay: true,
            relayId: relay.id,
          },
        ]
      }
      return updated
    })
  }, [store.relayMessages, currentUserId, store])

  // ---- Inject sender-side relay records (so sender can see what they sent) ----
  useEffect(() => {
    const sentRelays = store.relayMessages.filter(
      (m) => m.senderId === currentUserId
    )
    if (sentRelays.length === 0) return
    setMessages((prev) => {
      let updated = prev
      for (const relay of sentRelays) {
        const sentMsgId = `relay-sent-${relay.id}`
        if (updated.some((m) => m.id === sentMsgId)) continue
        updated = [
          ...updated,
          {
            id: sentMsgId,
            role: 'cat' as const,
            content: relay.relayText,
            timestamp: relay.createdAt,
            expression: 'love' as PetExpression,
            isRelay: true,
            relayId: relay.id,
          },
        ]
      }
      return updated
    })
  }, [store.relayMessages, currentUserId, companion.name])

  // ---- Send message ----
  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isTyping) return

    const userMsg: ChatMessage = {
      id: nextMsgId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)
    setExpression('thinking')
    pushHistory('user', text)

    // Minimum visual delay
    const minDelay = new Promise(r => setTimeout(r, 600))

    // Only send photos when user mentions photo-related keywords
    const wantsPhotos = /照片|图片|纪念|相册|看看|拍的/.test(text)

    // Try AI, fallback to local
    const aiPromise = chatWithPet(text, chatHistoryRef.current.slice(0, -1), {
      companionName: companion.name,
      mood: store.currentPetState.mood,
      energy: store.currentPetState.energy,
      relationDays: store.relationDays,
    }, wantsPhotos && recentPhotoUrls.length > 0 ? recentPhotoUrls : undefined)

    const [aiResult] = await Promise.all([aiPromise, minDelay])
    console.log('[PetChat] handleSend AI result:', aiResult)

    let replyText: string
    let replyExpr: PetExpression
    if (!aiResult.fallback && aiResult.text) {
      replyText = aiResult.text
      replyExpr = inferExpression(replyText)
    } else {
      const local = generateCatReply({ content: text }, replyContext)
      replyText = local.text
      replyExpr = local.expression
    }

    pushHistory('assistant', replyText)
    setExpression(replyExpr)
    setIsTyping(false)
    setMessages(prev => [...prev, {
      id: nextMsgId(),
      role: 'cat',
      content: replyText,
      timestamp: Date.now(),
      expression: replyExpr,
    }])
    setTimeout(() => setExpression('idle'), 5000)
  }, [inputText, isTyping, replyContext, companion.name, store.currentPetState, store.relationDays, recentPhotoUrls])

  // ---- Quick action ----
  const handleQuickAction = useCallback(async (action: ChatQuickAction) => {
    if (isTyping) return

    const userText = getQuickActionUserText(action, companion.name)
    const userMsg: ChatMessage = {
      id: nextMsgId(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      actionType: action,
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setExpression('thinking')

    if (action === 'pet' && petReady) store.petInteraction('pet')
    if (action === 'play' && feedReady) store.petInteraction('feed')

    // pet/play always local; advice tries AI first
    if (action === 'advice') {
      pushHistory('user', userText)
      const minDelay = new Promise(r => setTimeout(r, 600))
      const aiPromise = chatWithPet(userText, chatHistoryRef.current.slice(0, -1), {
        companionName: companion.name,
        mood: store.currentPetState.mood,
        energy: store.currentPetState.energy,
        relationDays: store.relationDays,
      }, undefined) // Quick actions don't send photos
      const [aiResult] = await Promise.all([aiPromise, minDelay])

      let replyText: string
      let replyExpr: PetExpression
      if (!aiResult.fallback && aiResult.text) {
        replyText = aiResult.text
        replyExpr = inferExpression(replyText)
      } else {
        const local = generateCatReply({ content: userText, actionType: action }, replyContext)
        replyText = local.text
        replyExpr = local.expression
      }

      pushHistory('assistant', replyText)
      setExpression(replyExpr)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: nextMsgId(),
        role: 'cat',
        content: replyText,
        timestamp: Date.now(),
        expression: replyExpr,
      }])
      setTimeout(() => setExpression('idle'), 5000)
    } else {
      setTimeout(() => {
        const reply = generateCatReply({ content: userText, actionType: action }, replyContext)
        setExpression(reply.expression)
        setIsTyping(false)
        setMessages(prev => [...prev, {
          id: nextMsgId(),
          role: 'cat',
          content: reply.text,
          timestamp: Date.now(),
          expression: reply.expression,
        }])
        setTimeout(() => setExpression('idle'), 5000)
      }, 600 + Math.random() * 500)
    }
  }, [isTyping, companion.name, petReady, feedReady, store, replyContext, recentPhotoUrls])

  // ---- Mood text ----
  const getMoodText = () => {
    const mood = store.currentPetState.mood
    switch (mood) {
      case 'happy': return '心情很好'
      case 'content': return '很满足'
      case 'sleepy': return '困困的'
      case 'lonely': return '想你了'
      default: return '正在发呆'
    }
  }

  // ---- Insight data ----
  const insightStats = useMemo(() => {
    const feelings = store.getFeelings(currentUserId)
    const recentFeelings = feelings.filter(f => Date.now() - f.createdAt < 7 * 86_400_000)
    const completedCount = store.todayCompletedCount
    const totalCount = store.todayTotalCount
    const interactions = store.currentPetState.todayInteractions
    const energy = store.currentPetState.energy
    const moodEmojis = recentFeelings.map(f => f.mood)
    const uniqueMoods = new Set(moodEmojis).size
    const emotionStability = Math.max(20, Math.min(100,
      recentFeelings.length === 0 ? 60 : Math.round(100 - (uniqueMoods / Math.max(recentFeelings.length, 1)) * 60)
    ))
    const careLevel = Math.max(15, Math.min(100, Math.round(
      (completedCount / Math.max(totalCount, 1)) * 50 + interactions * 10 + (recentFeelings.length > 0 ? 20 : 0)
    )))
    const stressResilience = Math.max(20, Math.min(100, Math.round(
      energy * 0.5 + (completedCount / Math.max(totalCount, 1)) * 30 + (recentFeelings.length >= 3 ? 20 : recentFeelings.length * 7)
    )))
    return { emotionStability, careLevel, stressResilience }
  }, [store, currentUserId])

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background overflow-hidden">
      {/* ===== Fixed Top: Subtitle + Cat Hero ===== */}
      <div
        className="flex flex-col items-center pt-2 pb-2 flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, hsl(32 70% 96%) 0%, hsl(32 50% 98%) 100%)' }}
      >
        <p className="text-xs font-medium text-muted-foreground mb-1">我们的状态 - 深度对话与分析</p>
        <div className="w-32 h-32">
          <img src={petHeroImg} alt={companion.name} className="w-full h-full object-contain drop-shadow-lg" draggable={false} />
        </div>
        <p className="text-sm font-bold text-foreground mt-1">{companion.name}</p>
        <p className="text-2xs text-muted-foreground">{getMoodText()}</p>
      </div>

      {/* ===== Scrollable: Chat Messages only ===== */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ---- Chat Messages ---- */}
        <div className="px-4 pt-3 pb-2 space-y-3">
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end animate-msg-appear">
                <div
                  className="max-w-[78%] rounded-2xl rounded-tr-md px-3.5 py-2.5"
                  style={{ background: 'hsl(32 60% 94%)' }}
                >
                  <p className="text-xs text-foreground leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ) : msg.isRelay && msg.relayId ? (
              (() => {
                const relay = store.relayMessages.find((r) => r.id === msg.relayId)
                if (!relay) return null
                const isSender = relay.senderId === currentUserId
                if (isSender) {
                  // Sender side: show original text + what was relayed
                  return (
                    <div key={msg.id} className="flex items-end gap-2 animate-msg-appear">
                      <div className="relative w-7 h-7 flex-shrink-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary/50">
                          <PetSvg animal={store.space.companion} expression="love" className="w-full h-full" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 text-2xs">✉️</span>
                      </div>
                      <div
                        className="max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2.5"
                        style={{ background: 'linear-gradient(135deg, hsl(210 60% 96%), hsl(220 50% 94%))' }}
                      >
                        <p className="text-2xs text-muted-foreground/70 mb-1.5">{companion.name}已帮你传达给{store.getUserProfile(relay.receiverId).name}</p>
                        <div className="mb-1.5 pl-2 border-l-2 border-primary/30">
                          <p className="text-2xs text-muted-foreground/60 mb-0.5">你的原话</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">"{relay.originalText}"</p>
                        </div>
                        <div className="pl-2 border-l-2 border-accent-foreground/20">
                          <p className="text-2xs text-muted-foreground/60 mb-0.5">{companion.name}的转述</p>
                          <p className="text-xs text-foreground leading-relaxed">"{relay.relayText}"</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                // Receiver side: existing RelayMessageBubble
                return (
                  <RelayMessageBubble
                    key={msg.id}
                    message={relay}
                    companionAnimal={store.space.companion}
                    senderName={store.getUserProfile(relay.senderId).name}
                    onRead={() => msg.relayId && store.markRelayRead(msg.relayId)}
                  />
                )
              })()
            ) : (
              <div key={msg.id} className="flex items-end gap-2 animate-msg-appear">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-secondary/50">
                  <PetSvg
                    animal={store.space.companion}
                    expression={msg.expression || 'happy'}
                    className="w-full h-full"
                  />
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-secondary/60">
                  <p className="text-xs text-foreground leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ),
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 animate-msg-appear">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-secondary/50">
                <PetSvg animal={store.space.companion} expression="thinking" className="w-full h-full" />
              </div>
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-secondary/60">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-typing-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={chatEndRef} />
      </div>

      {/* ===== Fixed Bottom: Insight + Quick Actions + Input ===== */}
      <div className="flex-shrink-0 bg-white border-t border-border/20">
        {/* Compact Insight Summary */}
        <div ref={insightRef} className="mx-3 mt-1.5 mb-1 bg-white/80 rounded-xl px-3 py-2 border border-border/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-care" />
            <span className="text-2xs font-semibold text-muted-foreground">AI 心理洞察</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-foreground">{insightStats.emotionStability}%</p>
              <p className="text-2xs text-muted-foreground">情绪稳定</p>
            </div>
            <div className="w-px h-5 bg-border/30" />
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-foreground">{insightStats.careLevel}%</p>
              <p className="text-2xs text-muted-foreground">关爱度</p>
            </div>
            <div className="w-px h-5 bg-border/30" />
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-foreground">{insightStats.stressResilience}%</p>
              <p className="text-2xs text-muted-foreground">抗压力</p>
            </div>
            <div className="w-px h-5 bg-border/30" />
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-foreground">{store.currentPetState.energy}%</p>
              <p className="text-2xs text-muted-foreground">活力值</p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-3 px-4 py-1.5">
          <button
            onClick={() => handleQuickAction('pet')}
            disabled={isTyping || !petReady}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/40 bg-white text-xs font-medium text-foreground hover:bg-secondary/30 active:scale-95 transition-all disabled:opacity-40"
          >
            <span className="text-sm">❤️</span>
            <span>{petReady ? '抚摸' : `${petCooldown}s`}</span>
          </button>
          <button
            onClick={() => handleQuickAction('play')}
            disabled={isTyping || !feedReady}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/40 bg-white text-xs font-medium text-foreground hover:bg-secondary/30 active:scale-95 transition-all disabled:opacity-40"
          >
            <span className="text-sm">🍖</span>
            <span>{feedReady ? '喂食' : `${Math.ceil(feedCooldown / 60)}min`}</span>
          </button>
          <button
            onClick={() => setShowRelaySheet(true)}
            disabled={isTyping}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/40 bg-white text-xs font-medium text-foreground hover:bg-secondary/30 active:scale-95 transition-all disabled:opacity-40"
          >
            <span className="text-sm">💌</span>
            <span>帮我说</span>
          </button>
        </div>

        {/* Input bar */}
        <div className="px-3 py-1.5 border-t border-border/30 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-secondary/30 rounded-full px-3 py-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="请输入..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-1.5"
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                inputText.trim() && !isTyping
                  ? 'bg-primary text-white active:scale-95'
                  : 'bg-secondary/60 text-muted-foreground/40'
              }`}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* Emotion Relay Overlay */}
      {showRelaySheet && (
        <EmotionRelayOverlay
          store={store}
          onClose={() => setShowRelaySheet(false)}
        />
      )}
    </div>
  )
}
