import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmationCard } from '@/components/ConfirmationCard'
import { parseNaturalLanguage, applySmartDefaults, getFollowUpQuestion } from '@/lib/nlp'
import type { ParsedTask, CreateTaskInput } from '@/types'
import type { FollowUpQuestion } from '@/lib/nlp'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { ArrowLeft, Mic, Keyboard, Sparkles, Send } from 'lucide-react'

interface Props {
  store: Store
  userMode: 'single' | 'dual'
  onBack: () => void
}

type InputMode = 'voice' | 'text'
type Phase = 'input' | 'confirm' | 'followup'

const EXAMPLE_HINTS = [
  '每天早上8点吃药',
  '明天下午3点开会',
  '晚上提醒我喝水',
  '半小时后取快递',
  '今晚八点遛狗',
  '睡前吃维生素',
]

export function VoiceCreatePage({ store, userMode, onBack }: Props) {
  const currentUserId = useCurrentUser()
  const speech = useSpeechRecognition()
  const [inputMode, setInputMode] = useState<InputMode>(speech.isSupported ? 'voice' : 'text')
  const [textInput, setTextInput] = useState('')
  const [parsed, setParsed] = useState<ParsedTask | null>(null)
  const [overrides, setOverrides] = useState<Partial<CreateTaskInput>>({})
  const [phase, setPhase] = useState<Phase>('input')
  const [followUp, setFollowUp] = useState<FollowUpQuestion | null>(null)
  const [followUpAnswer, setFollowUpAnswer] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const followUpRef = useRef<HTMLInputElement>(null)
  const [hintIndex] = useState(() => Math.floor(Math.random() * EXAMPLE_HINTS.length))

  // The displayed text (from speech or text input)
  const displayText = inputMode === 'voice'
    ? (speech.transcript || speech.interimTranscript)
    : textInput

  // When speech recognition is done, auto-parse and go to confirm
  useEffect(() => {
    if (speech.status === 'done' && speech.transcript) {
      const result = parseNaturalLanguage(speech.transcript, store.users, currentUserId)
      setParsed(result)
      setOverrides({})
      const q = getFollowUpQuestion(result)
      if (q) {
        setFollowUp(q)
        setPhase('followup')
      } else {
        setPhase('confirm')
      }
    }
  }, [speech.status, speech.transcript, store.users, currentUserId])

  // Debounced parsing for text input mode
  useEffect(() => {
    if (inputMode !== 'text' || !textInput.trim()) {
      if (inputMode === 'text' && !textInput.trim()) {
        setParsed(null)
        setPhase('input')
      }
      return
    }
    const timer = setTimeout(() => {
      const result = parseNaturalLanguage(textInput, store.users, currentUserId)
      setParsed(result)
      setOverrides({})
      // Don't auto-transition in text mode — user presses confirm
    }, 200)
    return () => clearTimeout(timer)
  }, [textInput, inputMode, store.users, currentUserId])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 100) + 'px'
    }
  }, [textInput])

  // Focus follow-up input
  useEffect(() => {
    if (phase === 'followup' && followUpRef.current) {
      followUpRef.current.focus()
    }
  }, [phase])

  const defaults = parsed ? applySmartDefaults(parsed) : null
  const resolvedName = overrides.name ?? defaults?.name ?? ''
  const canCreate = resolvedName.length > 0

  function handleOverride(field: string, value: unknown) {
    setOverrides((prev) => ({ ...prev, [field]: value }))
  }

  function handleFollowUpSubmit() {
    if (!followUp || !followUpAnswer.trim()) return
    // Apply the answer to overrides
    handleOverride(followUp.field, followUpAnswer.trim())
    // Re-check if there are more follow-ups needed
    setFollowUp(null)
    setPhase('confirm')
  }

  function handleCreate() {
    if (!defaults || !canCreate) return
    const finalReceiverId = overrides.receiverId ?? (defaults.receiverId || currentUserId)
    const final: CreateTaskInput = {
      ...defaults,
      ...overrides,
      name: resolvedName,
      creatorId: currentUserId,
      receiverId: finalReceiverId,
      itemType: overrides.itemType ?? (finalReceiverId === currentUserId ? 'todo' : 'care'),
    }
    store.createTask(final)
    onBack()
  }

  const handleStartOver = useCallback(() => {
    speech.reset()
    setTextInput('')
    setParsed(null)
    setOverrides({})
    setPhase('input')
    setFollowUp(null)
    setFollowUpAnswer('')
  }, [speech])

  function handleMicToggle() {
    if (speech.status === 'listening') {
      speech.stop()
    } else {
      speech.reset()
      setParsed(null)
      setOverrides({})
      setPhase('input')
      speech.start()
    }
  }

  function switchToText() {
    speech.reset()
    setInputMode('text')
    setPhase('input')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  function switchToVoice() {
    if (!speech.isSupported) return
    setInputMode('voice')
    setTextInput('')
    setParsed(null)
    setPhase('input')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {inputMode === 'voice' ? '语音创建' : '说一句话'}
          </h1>
        </div>
        {/* Mode switch */}
        <button
          onClick={inputMode === 'voice' ? switchToText : switchToVoice}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          {inputMode === 'voice'
            ? <><Keyboard className="w-3.5 h-3.5" /> 打字</>
            : speech.isSupported
              ? <><Mic className="w-3.5 h-3.5" /> 语音</>
              : null
          }
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">

        {/* === Voice Input Mode === */}
        {inputMode === 'voice' && phase === 'input' && (
          <div className="flex flex-col items-center pt-8">
            {/* Voice feedback area */}
            <div className="relative mb-6">
              {/* Pulse rings when listening */}
              {speech.status === 'listening' && (
                <>
                  <div className="absolute inset-0 -m-3 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute inset-0 -m-6 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: '2s' }} />
                </>
              )}
              <button
                onClick={handleMicToggle}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  speech.status === 'listening'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                    : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}
              >
                {speech.status === 'listening'
                  ? <Mic className="w-8 h-8 animate-pulse" />
                  : <Mic className="w-8 h-8" />
                }
              </button>
            </div>

            {/* Status text */}
            <p className={`text-sm font-medium mb-2 ${
              speech.status === 'listening' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {speech.status === 'idle' && '点击开始说话'}
              {speech.status === 'listening' && '正在听...'}
              {speech.status === 'processing' && '正在识别...'}
              {speech.status === 'error' && (speech.error || '出错了')}
            </p>

            {/* Interim transcript */}
            {speech.interimTranscript && (
              <div className="bg-secondary rounded-2xl px-4 py-3 max-w-full animate-fade-in">
                <p className="text-sm text-foreground">{speech.interimTranscript}</p>
              </div>
            )}

            {/* Example hints */}
            {speech.status === 'idle' && (
              <div className="mt-6 w-full">
                <div className="flex items-center gap-1.5 mb-3 px-1">
                  <Sparkles className="w-3 h-3 text-primary/50" />
                  <span className="text-2xs text-muted-foreground">试试这样说</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_HINTS.map((hint, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputMode('text')
                        setTextInput(hint)
                      }}
                      className="px-3 py-1.5 rounded-full bg-secondary text-xs text-muted-foreground hover:bg-accent transition-colors"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === Text Input Mode === */}
        {inputMode === 'text' && phase === 'input' && (
          <div className="mt-2">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              想提醒自己什么？
            </label>
            <div className="bg-secondary rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-ring">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={EXAMPLE_HINTS[hintIndex] + '...'}
                rows={2}
                className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Hint */}
            {!textInput && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <Sparkles className="w-3 h-3 text-primary/50" />
                  <span className="text-2xs text-muted-foreground">快速输入</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_HINTS.map((hint, i) => (
                    <button
                      key={i}
                      onClick={() => setTextInput(hint)}
                      className="px-3 py-1.5 rounded-full bg-secondary text-xs text-muted-foreground hover:bg-accent transition-colors"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed preview */}
            {parsed && defaults && textInput.trim() && (
              <div className="mt-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium text-muted-foreground">识别结果</span>
                </div>
                <ConfirmationCard
                  parsed={parsed}
                  defaults={defaults}
                  overrides={overrides}
                  onOverride={handleOverride}
                  userMode={userMode}
                  users={store.users}
                />
              </div>
            )}
          </div>
        )}

        {/* === Follow-up Phase === */}
        {phase === 'followup' && followUp && (
          <div className="mt-4 animate-fade-in">
            {/* Show what was recognized */}
            <div className="bg-secondary rounded-2xl px-4 py-3 mb-4">
              <p className="text-xs text-muted-foreground mb-1">你说的是</p>
              <p className="text-sm font-medium text-foreground">{displayText}</p>
            </div>

            {/* Conversational follow-up bubble */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border rounded-2xl rounded-tl-md px-4 py-3 flex-1">
                <p className="text-sm text-foreground font-medium">{followUp.prompt}</p>
              </div>
            </div>

            {/* Answer input */}
            <div className="flex items-center gap-2 pl-11">
              <input
                ref={followUpRef}
                type="text"
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFollowUpSubmit() }}
                placeholder={followUp.placeholder}
                className="flex-1 h-10 px-4 rounded-full border bg-card text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleFollowUpSubmit}
                disabled={!followUpAnswer.trim()}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* === Confirmation Phase === */}
        {phase === 'confirm' && parsed && defaults && (
          <div className="mt-4 animate-fade-in">
            {/* What was said */}
            <div className="bg-secondary rounded-2xl px-4 py-3 mb-4">
              <p className="text-xs text-muted-foreground mb-1">你说的是</p>
              <p className="text-sm font-medium text-foreground">{displayText}</p>
            </div>

            {/* Confirmation card */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-muted-foreground">确认提醒</span>
                <button
                  onClick={handleStartOver}
                  className="text-2xs text-primary font-medium"
                >
                  重新说
                </button>
              </div>
              <ConfirmationCard
                parsed={parsed}
                defaults={defaults}
                overrides={overrides}
                onOverride={handleOverride}
                userMode={userMode}
                users={store.users}
              />
            </div>

            {/* Missing name warning */}
            {!resolvedName && (
              <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3 animate-fade-in">
                <label className="text-xs font-medium text-destructive/80 mb-1.5 block">
                  做什么事？
                </label>
                <input
                  type="text"
                  value={overrides.name ?? ''}
                  onChange={(e) => handleOverride('name', e.target.value)}
                  placeholder="输入任务名称..."
                  className="w-full h-9 px-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 px-5 pb-4 pt-2">
        {/* Text input mode: show parse & confirm button */}
        {inputMode === 'text' && phase === 'input' && parsed && defaults && textInput.trim() && (
          <Button
            variant="success-lg"
            size="xl"
            className="w-full"
            disabled={!canCreate}
            onClick={() => {
              const q = getFollowUpQuestion(parsed)
              if (q && !resolvedName) {
                setFollowUp(q)
                setPhase('followup')
              } else {
                handleCreate()
              }
            }}
          >
            {canCreate ? '创建提醒' : '请补充信息'}
          </Button>
        )}

        {/* Confirm phase: create button */}
        {phase === 'confirm' && parsed && defaults && (
          <Button
            variant="success-lg"
            size="xl"
            className="w-full"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            创建提醒
          </Button>
        )}
      </div>
    </div>
  )
}
