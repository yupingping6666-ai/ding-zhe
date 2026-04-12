import { useState } from 'react'
import type { Comment } from '@/types'
import { UserAvatar } from '@/components/UserAvatar'
import { Send } from 'lucide-react'

interface CommentSectionProps {
  comments: Comment[]
  onAddComment: (content: string) => void
  currentUserName?: string
  petName?: string
  petAvatar?: string
  resolveUserName?: (userId?: string) => { name: string; avatar: string }
}

export function CommentSection({ comments, onAddComment, currentUserName, petName, petAvatar, resolveUserName }: CommentSectionProps) {
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)

  const visibleComments = expanded ? comments : comments.slice(0, 3)
  const hasMore = comments.length > 3 && !expanded

  function handleSubmit() {
    const text = input.trim()
    if (!text) return
    onAddComment(text)
    setInput('')
  }

  return (
    <div className="mt-2">
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="bg-secondary/50 rounded-xl px-3 py-2 space-y-1.5">
          {visibleComments.map((c) => {
            const resolved = c.author !== 'ai' && resolveUserName ? resolveUserName(c.userId) : null
            const displayName = c.author === 'ai' ? (petName || '小叮') : (resolved?.name || currentUserName || '我')
            const displayAvatar = c.author === 'ai' ? petAvatar : (resolved?.avatar || '👧')
            return (
              <div key={c.id} className="flex items-start gap-1.5 text-xs">
                <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full overflow-hidden inline-flex items-center justify-center">
                  <UserAvatar avatar={displayAvatar || '👧'} imgClass="w-4 h-4" />
                </span>
                <span className={c.author === 'ai' ? 'text-muted-foreground' : 'text-foreground'}>
                  <span className="font-semibold">
                    {displayName}
                  </span>
                  ：{c.content}
                </span>
              </div>
            )
          })}
          {hasMore && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-primary hover:underline"
            >
              展开更多 ({comments.length - 3} 条)
            </button>
          )}
        </div>
      )}

      {/* Comment input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="说点什么..."
          maxLength={200}
          className="flex-1 h-8 px-3 rounded-full border bg-card text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="w-7 h-7 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <Send className="w-3.5 h-3.5 text-primary-foreground" />
        </button>
      </div>
    </div>
  )
}
