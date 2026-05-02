import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_CONFIG,
  INTENSITY_CONFIG,
  REPEAT_CONFIG,
  WEEKDAY_LABELS,
  ITEM_TYPE_CONFIG,
} from '@/types'
import type { Category, RepeatRule, FollowUpIntensity, RelationStatus } from '@/types'
import { formatDelay, formatTime } from '@/lib/time'
import type { Store } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS, getTimelineCompanionNote } from '@/lib/companion'
import { PetEmoji } from '@/components/PetEmoji'
import { ArrowLeft, Circle, CheckCircle2, Clock, SkipForward, XCircle, AlertCircle, MessageCircle } from 'lucide-react'

interface Props {
  templateId: string
  store: Store
  onBack: () => void
}

const RELATION_STATUS_LABELS: Record<RelationStatus, string> = {
  draft: '草稿',
  sent: '已发送',
  delivered: '已送达',
  seen: '已查看',
  responded: '已回应',
  resolved: '已完结',
}

export function DetailPage({ templateId, store, onBack }: Props) {
  const currentUserId = useCurrentUser()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]
  const template = store.getTemplate(templateId)

  const [editing, setEditing] = useState(false)
  const [editTime, setEditTime] = useState('')
  const [editRepeat, setEditRepeat] = useState<RepeatRule>('once')
  const [editWeeklyDays, setEditWeeklyDays] = useState<number[]>([])
  const [editCategory, setEditCategory] = useState<Category>('other')
  const [editIntensity, setEditIntensity] = useState<FollowUpIntensity>('standard')
  const [editReceiverId, setEditReceiverId] = useState('')

  function startEditing() {
    if (!template) return
    setEditTime(template.remindTime)
    setEditRepeat(template.repeatRule)
    setEditWeeklyDays([...template.weeklyDays])
    setEditCategory(template.category)
    setEditIntensity(template.followUpIntensity)
    setEditReceiverId(template.receiverId)
    setEditing(true)
  }

  function handleSave() {
    store.updateTemplate(templateId, {
      remindTime: editTime,
      repeatRule: editRepeat,
      weeklyDays: editWeeklyDays,
      category: editCategory,
      followUpIntensity: editIntensity,
      receiverId: editReceiverId,
    })
    setEditing(false)
  }

  if (!template) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <span className="block mb-3 animate-float"><PetEmoji value={character.expressions.thinking} size="w-10 h-10" /></span>
        <p>找不到这个任务</p>
        <button onClick={onBack} className="text-primary mt-2 text-sm">返回</button>
      </div>
    )
  }

  const typeConf = ITEM_TYPE_CONFIG[template.itemType]
  const intensity = INTENSITY_CONFIG[template.followUpIntensity]
  const isCreator = template.creatorId === currentUserId
  const isReceiver = template.receiverId === currentUserId
  const isSelf = template.creatorId === template.receiverId
  const otherUser = isCreator ? store.getUserProfile(template.receiverId) : store.getUserProfile(template.creatorId)

  // Current instance (deferred or awaiting)
  const currentInstance = store.instances.find(
    (i) => i.templateId === templateId && (i.status === 'deferred' || i.status === 'awaiting')
  )

  // Recent history
  const history = store.instances
    .filter(
      (i) => i.templateId === templateId && (i.status === 'completed' || i.status === 'skipped' || i.status === 'expired')
    )
    .sort((a, b) => b.scheduledTime - a.scheduledTime)
    .slice(0, 5)

  const actionIcons: Record<string, React.ReactNode> = {
    reminded: <AlertCircle className="w-3.5 h-3.5 text-awaiting" />,
    user_completed: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
    user_deferred: <Clock className="w-3.5 h-3.5 text-deferred" />,
    user_skipped: <SkipForward className="w-3.5 h-3.5 text-skip" />,
    auto_deferred: <Clock className="w-3.5 h-3.5 text-deferred" />,
    follow_up_sent: <AlertCircle className="w-3.5 h-3.5 text-deferred" />,
    expired: <XCircle className="w-3.5 h-3.5 text-expired" />,
    acknowledged: <CheckCircle2 className="w-3.5 h-3.5 text-care" />,
    feedback_sent: <MessageCircle className="w-3.5 h-3.5 text-confirm" />,
    cant_do: <XCircle className="w-3.5 h-3.5 text-muted-foreground" />,
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">事项详情</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Task info card */}
        <div className="bg-card rounded-3xl border border-border/40 overflow-hidden">
          {/* Header: name + type badge */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeConf.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{template.name}</h2>
                  <span className={`sticker sticker-${template.itemType}`}>
                    {typeConf.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Relationship info */}
            {!isSelf && (
              <div className="flex items-center gap-3 mt-3 px-3 py-2.5 bg-secondary/60 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <PetEmoji value={character.avatar} size="w-5 h-5" />
                  <span className="text-xs font-semibold text-foreground">{user.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isCreator ? '→' : '←'}
                </span>
                <div className="flex items-center gap-1.5">
                  <PetEmoji value={character.avatar} size="w-5 h-5" />
                  <span className="text-xs font-semibold text-foreground">{otherUser.name}</span>
                </div>
                <span className="text-2xs text-muted-foreground ml-auto">
                  {isCreator ? '你发起的' : '发给你的'}
                </span>
              </div>
            )}
          </div>

          {/* Note / pickup code */}
          {template.note && (
            <>
              <div className="border-t border-border/40" />
              <div className="px-5 py-3.5 flex items-start gap-2.5">
                <span className="text-sm mt-0.5">{template.actionType === 'pickup' ? '📦' : '💬'}</span>
                <div>
                  <span className="text-2xs text-muted-foreground block">{template.actionType === 'pickup' ? '取件码' : '备注'}</span>
                  <span className="text-sm font-semibold text-foreground">{template.note}</span>
                </div>
              </div>
            </>
          )}

          {/* Structured attribute list */}
          <div className="border-t border-border/40" />
          <div className="divide-y divide-border/40">
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">提醒时间</span>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">
                  {REPEAT_CONFIG[template.repeatRule].label} {template.remindTime}
                </span>
                {template.repeatRule === 'weekly' && (
                  <span className="text-2xs text-muted-foreground block mt-0.5">
                    每周{template.weeklyDays.map((d) => WEEKDAY_LABELS[d]).join('、')}
                  </span>
                )}
              </div>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">分类</span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1">
                {CATEGORY_CONFIG[template.category].emoji} {CATEGORY_CONFIG[template.category].label}
              </span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">提醒对象</span>
              <span className="text-sm font-medium text-foreground">
                {store.getUserProfile(template.receiverId).name}
              </span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">跟进强度</span>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">{intensity.label}</span>
                <span className="text-2xs text-muted-foreground block mt-0.5">
                  {intensity.interval}分钟 / 最多{intensity.maxFollowUps}次
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current instance status */}
        {currentInstance && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">当前这次</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">状态</span>
                <span className={`font-medium ${currentInstance.status === 'deferred' ? 'text-deferred-foreground' : 'text-awaiting-foreground'}`}>
                  {currentInstance.status === 'deferred' ? '还没完成' : '等待处理'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">关系状态</span>
                <span className="text-foreground">{RELATION_STATUS_LABELS[currentInstance.relationStatus] || currentInstance.relationStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">原定时间</span>
                <span className="text-foreground">{formatTime(currentInstance.scheduledTime)}</span>
              </div>
              {currentInstance.deferredSince && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">已延迟</span>
                  <span className="text-deferred-foreground font-medium">
                    {formatDelay(currentInstance.deferredSince)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">已跟进</span>
                <span className="text-foreground">
                  {currentInstance.followUpCount} / {currentInstance.maxFollowUps} 次
                </span>
              </div>
            </div>

            {/* Actions: only for receiver */}
            {isReceiver && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant={template.itemType === 'care' ? 'care' : 'success'}
                  size="sm"
                  className="flex-1"
                  onClick={() => store.completeInstance(currentInstance.id)}
                >
                  {template.itemType === 'care' ? '收到啦~ 🧡' : '搞定啦! 🍀'}
                </Button>
                <Button
                  variant="defer"
                  size="sm"
                  className="flex-1"
                  onClick={() => store.deferInstance(currentInstance.id, 10)}
                >
                  稍后
                </Button>
                <Button
                  variant="skip"
                  size="sm"
                  className="flex-1 border border-input"
                  onClick={() => store.skipInstance(currentInstance.id)}
                >
                  跳过
                </Button>
              </div>
            )}

            {/* Creator view: companion waiting message */}
            {isCreator && !isReceiver && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <PetEmoji value={character.expressions.waiting} size="w-5 h-5" />
                <p className="text-xs text-muted-foreground">{character.name}说：等{otherUser.name}处理中~</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback display */}
        {history.some(i => i.feedback) && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">反馈记录</h3>
            {history.filter(i => i.feedback).map(inst => (
              <div key={inst.id} className="flex items-start gap-2 mb-2">
                <MessageCircle className="w-3.5 h-3.5 text-confirm mt-0.5" />
                <p className="text-sm text-foreground">{inst.feedback}</p>
              </div>
            ))}
          </div>
        )}

        {/* Timeline with companion notes */}
        {currentInstance && currentInstance.actionLog.length > 0 && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">这次的时间线</h3>
              <PetEmoji value={character.avatar} size="w-4 h-4" />
            </div>
            <div className="space-y-0">
              {currentInstance.actionLog.map((log, i) => {
                const companionNote = getTimelineCompanionNote(character, log.action)
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    {i < currentInstance.actionLog.length - 1 && (
                      <div className="absolute left-[6.5px] top-5 w-px h-full bg-border" />
                    )}
                    <div className="mt-0.5 relative z-10">
                      {actionIcons[log.action] || <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{log.note}</p>
                      {companionNote && (
                        <p className="text-2xs text-muted-foreground/70 mt-0.5 italic">{companionNote}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {currentInstance.status === 'deferred' && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/40 animate-pulse-soft" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground italic">等待中...</p>
                    <p className="text-2xs text-muted-foreground/60 italic">{character.name}在耐心等待~</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <div className="bg-card rounded-3xl border border-border/40 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">最近记录</h3>
            <div className="space-y-2.5">
              {history.map((inst) => {
                const statusIcon = inst.status === 'completed'
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : inst.status === 'skipped'
                    ? <SkipForward className="w-4 h-4 text-skip" />
                    : <XCircle className="w-4 h-4 text-expired" />
                const label = inst.status === 'completed'
                  ? `完成于 ${formatTime(inst.completedAt!)}`
                  : inst.status === 'skipped'
                    ? '跳过'
                    : '没来得及'
                return (
                  <div key={inst.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatTime(inst.scheduledTime)}</span>
                    <div className="flex items-center gap-1.5">
                      {statusIcon}
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Management (only for creator) */}
        {isCreator && !editing && (
          <div className="bg-card rounded-3xl border border-border/40 divide-y divide-border/40 overflow-hidden">
            <button
              className="w-full px-5 py-3.5 text-sm text-left text-foreground hover:bg-accent/30 transition-colors rounded-t-3xl"
              onClick={startEditing}
            >
              编辑提醒规则
            </button>
            <button
              className="w-full px-5 py-3.5 text-sm text-left text-destructive hover:bg-accent/30 transition-colors rounded-b-3xl"
              onClick={() => { store.deleteTemplate(templateId); onBack() }}
            >
              删除这个提醒
            </button>
          </div>
        )}

        {/* Inline editor */}
        {isCreator && editing && (
          <div className="bg-card rounded-3xl border border-primary/30 p-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-foreground">编辑提醒规则</h3>

            {/* Time */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">提醒时间</span>
              <div className="flex items-center gap-2 bg-secondary rounded-xl py-2.5 px-3">
                <select
                  value={parseInt(editTime.split(':')[0])}
                  onChange={(e) => setEditTime(`${String(Number(e.target.value)).padStart(2, '0')}:${editTime.split(':')[1]}`)}
                  className="text-base font-semibold text-foreground bg-transparent appearance-none focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-base font-bold text-muted-foreground">:</span>
                <select
                  value={parseInt(editTime.split(':')[1])}
                  onChange={(e) => setEditTime(`${editTime.split(':')[0]}:${String(Number(e.target.value)).padStart(2, '0')}`)}
                  className="text-base font-semibold text-foreground bg-transparent appearance-none focus:outline-none cursor-pointer"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((v) => (
                    <option key={v} value={v}>{String(v).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receiver */}
            {store.users.length > 1 && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">提醒对象</span>
                <div className="flex gap-1.5 flex-wrap">
                  {store.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setEditReceiverId(u.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        editReceiverId === u.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent'
                      }`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Repeat */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">重复</span>
              <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
                {(Object.entries(REPEAT_CONFIG) as [RepeatRule, { label: string }][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setEditRepeat(key)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      editRepeat === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              {editRepeat === 'weekly' && (
                <div className="flex gap-1 justify-center mt-2">
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => setEditWeeklyDays(
                        editWeeklyDays.includes(idx)
                          ? editWeeklyDays.filter((d) => d !== idx)
                          : [...editWeeklyDays, idx]
                      )}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        editWeeklyDays.includes(idx)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">分类</span>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(CATEGORY_CONFIG) as [Category, { emoji: string; label: string }][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setEditCategory(key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editCategory === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">跟进强度</span>
              <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
                {(Object.entries(INTENSITY_CONFIG) as [FollowUpIntensity, typeof INTENSITY_CONFIG[FollowUpIntensity]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setEditIntensity(key)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      editIntensity === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              <p className="text-2xs text-muted-foreground text-center mt-1.5">
                {INTENSITY_CONFIG[editIntensity].desc} · {INTENSITY_CONFIG[editIntensity].interval}分钟/{INTENSITY_CONFIG[editIntensity].maxFollowUps}次
              </p>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-muted-foreground bg-secondary hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white bg-primary shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
