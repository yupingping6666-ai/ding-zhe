interface PetCommentLineProps {
  comment: string
  className?: string
}

export default function PetCommentLine({ comment, className }: PetCommentLineProps) {
  return (
    <div className={`flex items-start gap-1.5 px-1 ${className || ''}`}>
      <p className="text-xs text-gray-500 leading-relaxed italic">{comment}</p>
    </div>
  )
}
