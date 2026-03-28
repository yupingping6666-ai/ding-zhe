import { useEffect, useState } from 'react'

interface NarrativeTextProps {
  text: string
}

export function NarrativeText({ text }: NarrativeTextProps) {
  const [visible, setVisible] = useState(false)
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    // Fade out, swap text, fade in
    setVisible(false)
    const timer = setTimeout(() => {
      setDisplayText(text)
      setVisible(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <p
      className={`
        text-xs text-center leading-relaxed px-4
        text-foreground/70
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {displayText}
    </p>
  )
}
