import { useState, useRef, useCallback, useEffect } from 'react'

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'

interface UseSpeechRecognitionReturn {
  status: SpeechStatus
  transcript: string
  interimTranscript: string
  isSupported: boolean
  start: () => void
  stop: () => void
  reset: () => void
  error: string | null
}

/**
 * Web Speech API hook with fallback awareness.
 * If the browser doesn't support SpeechRecognition, isSupported = false
 * and the consumer should show a text input fallback.
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null

  const isSupported = SpeechRecognitionAPI != null

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setStatus('unsupported')
      return
    }

    // Clean up previous instance
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setStatus('listening')
      setError(null)
      setInterimTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        setTranscript(final)
        setInterimTranscript('')
        setStatus('done')
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('没有检测到语音，请再试一次')
      } else if (event.error === 'not-allowed') {
        setError('请允许麦克风权限')
      } else {
        setError('语音识别出错，请用文字输入')
      }
      setStatus('error')
    }

    recognition.onend = () => {
      if (status === 'listening') {
        // Ended without getting a final result
        setStatus((prev) => prev === 'listening' ? 'idle' : prev)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setStatus('listening')
    } catch {
      setError('无法启动语音识别')
      setStatus('error')
    }
  }, [SpeechRecognitionAPI, status])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setStatus((prev) => {
      if (prev === 'listening') return 'processing'
      return prev
    })
  }, [])

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setStatus('idle')
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return {
    status,
    transcript,
    interimTranscript,
    isSupported,
    start,
    stop,
    reset,
    error,
  }
}
