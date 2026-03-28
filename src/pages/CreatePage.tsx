import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_CONFIG,
  INTENSITY_CONFIG,
  REPEAT_CONFIG,
  WEEKDAY_LABELS,
  ITEM_TYPE_CONFIG,
} from '@/types'
import type { Category, RepeatRule, FollowUpIntensity, ItemType } from '@/types'
import type { Store } from '@/store'
import { getPartner } from '@/store'
import { useCurrentUser } from '@/contexts/UserContext'
import { ArrowLeft } from 'lucide-react'

interface Props {
  store: Store
  onBack: () => void
}

export function CreatePage({ store, onBack }: Props) {
  const currentUserId = useCurrentUser()
  const partner = getPartner(currentUserId)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('life')
  const [hours, setHours] = useState(9)
  const [minutes, setMinutes] = useState(0)
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('daily')
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 3, 5])
  const [intensity, setIntensity] = useState<FollowUpIntensity>('standard')
  const [itemType, setItemType] = useState<ItemType>('todo')
  const [receiverIsSelf, setReceiverIsSelf] = useState(false)
  const [note, setNote] = useState('')

  const categories = Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]
  const repeats = Object.entries(REPEAT_CONFIG) as [RepeatRule, typeof REPEAT_CONFIG[RepeatRule]][]
  const intensities = Object.entries(INTENSITY_CONFIG) as [FollowUpIntensity, typeof INTENSITY_CONFIG[FollowUpIntensity]][]
  const itemTypes = Object.entries(ITEM_TYPE_CONFIG) as [ItemType, typeof ITEM_TYPE_CONFIG[ItemType]][]

  function handleItemTypeChange(type: ItemType) {
    setItemType(type)
    setIntensity(ITEM_TYPE_CONFIG[type].defaultIntensity)
    if (type === 'care' || type === 'confirm') {
      setReceiverIsSelf(false) // care/confirm usually for partner
    }
  }

  function toggleDay(d: number) {
    setWeeklyDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  function handleCreate() {
    if (!name.trim()) return
    const remindTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    const receiverId = receiverIsSelf ? currentUserId : partner.id
    store.createTask({
      name: name.trim(),
      category,
      remindTime,
      repeatRule,
      weeklyDays: repeatRule === 'weekly' ? weeklyDays : [],
      followUpIntensity: intensity,
      itemType,
      creatorId: currentUserId,
      receiverId,
      note: note.trim(),
    })
    onBack()
  }

  const submitLabel = receiverIsSelf
    ? '创建提醒'
    : itemType === 'care'
      ? `给 ${partner.name} 一个关心`
      : itemType === 'confirm'
        ? `请 ${partner.name} 反馈`
        : `发给 ${partner.name}`

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">创建提醒</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Receiver toggle */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">发给谁？</label>
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            <button
              onClick={() => setReceiverIsSelf(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                !receiverIsSelf ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <span>{partner.avatar}</span> {partner.name}
            </button>
            <button
              onClick={() => setReceiverIsSelf(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                receiverIsSelf ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              自己
            </button>
          </div>
        </div>

        {/* Item type (only when sending to partner) */}
        {!receiverIsSelf && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">类型</label>
            <div className="flex gap-2">
              {itemTypes.map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleItemTypeChange(key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                    itemType === key
                      ? key === 'care'
                        ? 'bg-care-surface border-care/30 text-care-foreground'
                        : key === 'confirm'
                          ? 'bg-confirm-surface border-confirm/30 text-confirm-foreground'
                          : 'bg-primary/5 border-primary/30 text-primary'
                      : 'bg-secondary border-transparent text-muted-foreground'
                  }`}
                >
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="text-xs">{cfg.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1.5">
              {ITEM_TYPE_CONFIG[itemType].desc}
            </p>
          </div>
        )}

        {/* Task name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            {itemType === 'confirm' ? '想问什么？' : '做什么事？'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              itemType === 'care' ? '如：记得喝水、早点睡觉' :
              itemType === 'confirm' ? '如：今天面试怎么样' :
              '输入任务名称...'
            }
            maxLength={30}
            className="w-full h-12 px-4 rounded-xl border bg-card text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Note (only for partner) */}
        {!receiverIsSelf && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">附一句话（可选）</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="加一句暖心的话..."
              maxLength={50}
              className="w-full h-10 px-4 rounded-xl border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">分类</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">什么时间提醒？</label>
          <div className="flex items-center gap-2 justify-center bg-secondary rounded-2xl py-4">
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="text-3xl font-semibold text-foreground bg-transparent text-center appearance-none focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-3xl font-bold text-muted-foreground">:</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="text-3xl font-semibold text-foreground bg-transparent text-center appearance-none focus:outline-none cursor-pointer"
            >
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Repeat rule */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">重复</label>
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            {repeats.map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setRepeatRule(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  repeatRule === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          {repeatRule === 'weekly' && (
            <div className="flex gap-1.5 mt-3 justify-center">
              {WEEKDAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    weeklyDays.includes(idx)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Intensity */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">跟进强度</label>
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            {intensities.map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setIntensity(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  intensity === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {INTENSITY_CONFIG[intensity].desc} · {INTENSITY_CONFIG[intensity].interval}分钟/{INTENSITY_CONFIG[intensity].maxFollowUps}次
          </p>
        </div>

        {/* Submit */}
        <Button
          size="xl"
          className="w-full mt-2"
          variant={itemType === 'care' ? 'care' : itemType === 'confirm' ? 'confirm' : 'default'}
          disabled={!name.trim()}
          onClick={handleCreate}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
