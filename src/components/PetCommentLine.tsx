import { PetEmoji } from '@/components/PetEmoji'

interface PetCommentLineProps {
  comment: string
  avatar?: string
  className?: string
}

export default function PetCommentLine({ comment, avatar, className }: PetCommentLineProps) {
  return (
    <div className={`flex items-start gap-1.5 px-1 ${className || ''}`}>
      {avatar && <PetEmoji value={avatar} size="w-4 h-4" className="flex-shrink-0 mt-0.5" />}
      <p className="text-xs text-gray-500 leading-relaxed italic">{comment}</p>
    </div>
  )
}
