/**
 * Renders a companion expression — image asset or emoji text.
 *
 * Vite-imported images resolve to URL strings (e.g. "/src/assets/..." in dev,
 * "/assets/xxx.png" in prod). Emoji strings are short unicode text.
 */

interface PetEmojiProps {
  value: string
  /** Tailwind size class for img, e.g. "w-5 h-5". Ignored for emoji. */
  size?: string
  /** Extra classes applied to both img and emoji span */
  className?: string
}

export function isImageExpression(value: string): boolean {
  return (
    value.startsWith('/') ||
    value.startsWith('data:') ||
    value.startsWith('http') ||
    value.startsWith('blob:')
  )
}

export function PetEmoji({ value, size = 'w-5 h-5', className = '' }: PetEmojiProps) {
  if (isImageExpression(value)) {
    return (
      <img
        src={value}
        alt=""
        className={`${size} object-contain inline-block ${className}`}
        draggable={false}
      />
    )
  }
  return <span className={className}>{value}</span>
}
