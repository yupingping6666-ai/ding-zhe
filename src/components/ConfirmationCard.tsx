import { useState } from 'react'
import {
  CATEGORY_CONFIG,
  INTENSITY_CONFIG,
  REPEAT_CONFIG,
  WEEKDAY_LABELS,
  ITEM_TYPE_CONFIG,
} from '@/types'
import type {
  ParsedTask,
  CreateTaskInput,
  Category,
  RepeatRule,
  FollowUpIntensity,
  ItemType,
} from '@/types'
import { USERS } from '@/store'
import { UserAvatar } from '@/components/UserAvatar'
import { useCurrentUser } from '@/contexts/UserContext'
import { Clock, Repeat, FolderOpen, Gauge, User, Tag } from 'lucide-react'

interface Props {
  parsed: ParsedTask
  defaults: CreateTaskInput
  overrides: Partial<CreateTaskInput>
  onOverride: (field: string, value: unknown) => void
  userMode: 'single' | 'dual'
}

type EditField = 'time' | 'category' | 'repeat' | 'intensity' | 'receiver' | 'itemType' | null

export function ConfirmationCard({ parsed, defaults, overrides, onOverride, userMode }: Props) {
  const [editing, setEditing] = useState<EditField>(null)
  const currentUserId = useCurrentUser()

  // Resolved values (override > parsed > default)
  const resolvedTime = (overrides.remindTime ?? defaults.remindTime)
  const resolvedCategory = (overrides.category ?? defaults.category)
  const resolvedRepeat = (overrides.repeatRule ?? defaults.repeatRule)
  const resolvedWeeklyDays = (overrides.weeklyDays ?? defaults.weeklyDays)
  const resolvedIntensity = (overrides.followUpIntensity ?? defaults.followUpIntensity)
  const resolvedName = (overrides.name ?? defaults.name)
  const resolvedItemType = (overrides.itemType ?? defaults.itemType) as ItemType
  const resolvedReceiverId = (overrides.receiverId ?? defaults.receiverId) || currentUserId

  const cat = CATEGORY_CONFIG[resolvedCategory]
  const typeConf = ITEM_TYPE_CONFIG[resolvedItemType]
  const receiverUser = USERS.find(u => u.id === resolvedReceiverId)
  const isSelf = resolvedReceiverId === currentUserId

  // Determine if a field was auto-defaulted
  const timeIsInferred = !parsed.confidence.time && !overrides.remindTime
  const repeatIsInferred = !parsed.confidence.repeat && !overrides.repeatRule
  const categoryIsInferred = !parsed.confidence.category && !overrides.category

  function toggleEdit(field: EditField) {
    setEditing(editing === field ? null : field)
  }

  function repeatText(): string {
    if (resolvedRepeat === 'daily') return '每天'
    if (resolvedRepeat === 'once') return '仅一次'
    if (resolvedRepeat === 'weekly' && resolvedWeeklyDays.length > 0) {
      const dayLabels = resolvedWeeklyDays
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_LABELS[d])
        .join('')
      return `每周${dayLabels}`
    }
    return REPEAT_CONFIG[resolvedRepeat].label
  }

  function timeText(): string {
    const [h, m] = resolvedTime.split(':').map(Number)
    const period = h < 6 ? '凌晨' : h < 12 ? '上午' : h < 14 ? '中午' : h < 18 ? '下午' : '晚上'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${period} ${displayH}:${String(m).padStart(2, '0')}`
  }

  return (
    <div className="bg-card rounded-2xl border shadow-card-default overflow-hidden animate-fade-in">
      {/* Header: emoji + name */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <span className="text-2xl">{cat.emoji}</span>
        <div className="flex-1 min-w-0">
          {resolvedName ? (
            <h3 className="text-base font-semibold text-foreground truncate">{resolvedName}</h3>
          ) : (
            <p className="text-sm text-destructive font-medium">还没说做什么事</p>
          )}
        </div>
      </div>

      {/* Field chips grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {/* Receiver */}
        <FieldChip
          icon={<User className="w-3.5 h-3.5" />}
          label={userMode === 'single' ? '自己' : (isSelf ? '自己' : (receiverUser ? <><span className="w-3.5 h-3.5 rounded-full overflow-hidden inline-flex items-center justify-center align-middle"><UserAvatar avatar={receiverUser.avatar} imgClass="w-3.5 h-3.5" /></span> {receiverUser.name}</> : '自己'))}
          inferred={!overrides.receiverId}
          active={editing === 'receiver'}
          onClick={userMode === 'dual' ? () => toggleEdit('receiver') : undefined}
        />
        {/* Item Type */}
        <FieldChip
          icon={<Tag className="w-3.5 h-3.5" />}
          label={typeConf.label}
          inferred={!overrides.itemType}
          active={editing === 'itemType'}
          onClick={() => toggleEdit('itemType')}
        />
        {/* Time */}
        <FieldChip
          icon={<Clock className="w-3.5 h-3.5" />}
          label={timeText()}
          inferred={timeIsInferred}
          active={editing === 'time'}
          onClick={() => toggleEdit('time')}
        />
        {/* Repeat */}
        <FieldChip
          icon={<Repeat className="w-3.5 h-3.5" />}
          label={repeatText()}
          inferred={repeatIsInferred}
          active={editing === 'repeat'}
          onClick={() => toggleEdit('repeat')}
        />
        {/* Category */}
        <FieldChip
          icon={<FolderOpen className="w-3.5 h-3.5" />}
          label={cat.label}
          inferred={categoryIsInferred}
          active={editing === 'category'}
          onClick={() => toggleEdit('category')}
        />
        {/* Intensity */}
        <FieldChip
          icon={<Gauge className="w-3.5 h-3.5" />}
          label={`${INTENSITY_CONFIG[resolvedIntensity].label}跟进`}
          inferred={false}
          active={editing === 'intensity'}
          onClick={() => toggleEdit('intensity')}
        />
      </div>

      {/* Inline editors */}
      {editing === 'receiver' && userMode === 'dual' && (
        <InlineReceiverEditor
          value={resolvedReceiverId}
          currentUserId={currentUserId}
          onChange={(v) => { onOverride('receiverId', v); setEditing(null) }}
        />
      )}
      {editing === 'itemType' && (
        <InlineItemTypeEditor
          value={resolvedItemType}
          onChange={(v) => { onOverride('itemType', v); setEditing(null) }}
        />
      )}
      {editing === 'time' && (
        <InlineTimeEditor
          value={resolvedTime}
          onChange={(v) => { onOverride('remindTime', v); setEditing(null) }}
        />
      )}
      {editing === 'category' && (
        <InlineCategoryEditor
          value={resolvedCategory}
          onChange={(v) => { onOverride('category', v); setEditing(null) }}
        />
      )}
      {editing === 'repeat' && (
        <InlineRepeatEditor
          repeatRule={resolvedRepeat}
          weeklyDays={resolvedWeeklyDays}
          onChangeRepeat={(r) => onOverride('repeatRule', r)}
          onChangeDays={(d) => onOverride('weeklyDays', d)}
          onDone={() => setEditing(null)}
        />
      )}
      {editing === 'intensity' && (
        <InlineIntensityEditor
          value={resolvedIntensity}
          onChange={(v) => { onOverride('followUpIntensity', v); setEditing(null) }}
        />
      )}
    </div>
  )
}

// ========== Field Chip ==========

function FieldChip({ icon, label, inferred, active, onClick }: {
  icon: React.ReactNode
  label: React.ReactNode
  inferred: boolean
  active: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
        ${active
          ? 'bg-primary/10 border-primary/30 border text-foreground'
          : inferred
            ? 'border border-dashed border-border text-muted-foreground hover:bg-accent'
            : 'border border-border text-foreground hover:bg-accent'
        }
      `}
    >
      <span className={active ? 'text-primary' : inferred ? 'text-muted-foreground' : 'text-foreground/70'}>{icon}</span>
      <span className="truncate">{label}</span>
      {inferred && !active && (
        <span className="text-2xs text-muted-foreground/60 flex-shrink-0">自动</span>
      )}
    </button>
  )
}

// ========== Inline Editors ==========

function InlineTimeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':').map(Number)
  return (
    <div className="px-4 pb-3 animate-fade-in">
      <div className="flex items-center gap-2 justify-center bg-secondary rounded-xl py-3">
        <select
          value={h}
          onChange={(e) => onChange(`${String(Number(e.target.value)).padStart(2, '0')}:${String(m).padStart(2, '0')}`)}
          className="text-xl font-semibold text-foreground bg-transparent text-center appearance-none focus:outline-none cursor-pointer"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
          ))}
        </select>
        <span className="text-xl font-bold text-muted-foreground">:</span>
        <select
          value={m}
          onChange={(e) => onChange(`${String(h).padStart(2, '0')}:${String(Number(e.target.value)).padStart(2, '0')}`)}
          className="text-xl font-semibold text-foreground bg-transparent text-center appearance-none focus:outline-none cursor-pointer"
        >
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((v) => (
            <option key={v} value={v}>{String(v).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function InlineCategoryEditor({ value, onChange }: { value: Category; onChange: (v: Category) => void }) {
  const categories = Object.entries(CATEGORY_CONFIG) as [Category, { emoji: string; label: string }][]
  return (
    <div className="px-4 pb-3 animate-fade-in">
      <div className="flex gap-1.5 flex-wrap">
        {categories.map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${value === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }
            `}
          >
            <span>{cfg.emoji}</span>
            {cfg.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function InlineRepeatEditor({ repeatRule, weeklyDays, onChangeRepeat, onChangeDays, onDone }: {
  repeatRule: RepeatRule
  weeklyDays: number[]
  onChangeRepeat: (v: RepeatRule) => void
  onChangeDays: (v: number[]) => void
  onDone: () => void
}) {
  const repeats = Object.entries(REPEAT_CONFIG) as [RepeatRule, { label: string }][]

  function toggleDay(d: number) {
    const next = weeklyDays.includes(d) ? weeklyDays.filter((x) => x !== d) : [...weeklyDays, d]
    onChangeDays(next)
  }

  return (
    <div className="px-4 pb-3 animate-fade-in space-y-2">
      <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
        {repeats.map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { onChangeRepeat(key); if (key !== 'weekly') onDone() }}
            className={`
              flex-1 py-1.5 rounded-md text-xs font-medium transition-all
              ${repeatRule === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}
            `}
          >
            {cfg.label}
          </button>
        ))}
      </div>
      {repeatRule === 'weekly' && (
        <div className="flex gap-1 justify-center">
          {WEEKDAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`
                w-8 h-8 rounded-lg text-xs font-medium transition-all
                ${weeklyDays.includes(idx)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {repeatRule === 'weekly' && (
        <button onClick={onDone} className="w-full text-xs text-primary font-medium py-1">确定</button>
      )}
    </div>
  )
}

function InlineIntensityEditor({ value, onChange }: { value: FollowUpIntensity; onChange: (v: FollowUpIntensity) => void }) {
  const intensities = Object.entries(INTENSITY_CONFIG) as [FollowUpIntensity, typeof INTENSITY_CONFIG[FollowUpIntensity]][]
  return (
    <div className="px-4 pb-3 animate-fade-in">
      <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
        {intensities.map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex-1 py-1.5 rounded-md text-xs font-medium transition-all
              ${value === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}
            `}
          >
            {cfg.label}
          </button>
        ))}
      </div>
      <p className="text-2xs text-muted-foreground text-center mt-1.5">
        {INTENSITY_CONFIG[value].desc} · {INTENSITY_CONFIG[value].interval}分钟/{INTENSITY_CONFIG[value].maxFollowUps}次
      </p>
    </div>
  )
}

function InlineReceiverEditor({ value, currentUserId, onChange }: { value: string; currentUserId: string; onChange: (v: string) => void }) {
  const partner = USERS.find(u => u.id !== currentUserId)
  return (
    <div className="px-4 pb-3 animate-fade-in">
      <div className="flex gap-2">
        {partner && (
          <button
            onClick={() => onChange(partner.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              value === partner.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            <span className="w-4 h-4 rounded-full overflow-hidden inline-flex items-center justify-center"><UserAvatar avatar={partner.avatar} imgClass="w-4 h-4" /></span> {partner.name}
          </button>
        )}
        <button
          onClick={() => onChange(currentUserId)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            value === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          自己
        </button>
      </div>
    </div>
  )
}

function InlineItemTypeEditor({ value, onChange }: { value: ItemType; onChange: (v: ItemType) => void }) {
  const types = Object.entries(ITEM_TYPE_CONFIG) as [ItemType, typeof ITEM_TYPE_CONFIG[ItemType]][]
  return (
    <div className="px-4 pb-3 animate-fade-in">
      <div className="flex gap-2">
        {types.map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all ${
              value === key
                ? key === 'care' ? 'bg-care-surface text-care-foreground border border-care/30'
                  : key === 'confirm' ? 'bg-confirm-surface text-confirm-foreground border border-confirm/30'
                    : 'bg-primary/5 text-primary border border-primary/30'
                : 'bg-secondary text-muted-foreground border border-transparent'
            }`}
          >
            <span>{cfg.emoji}</span>
            <span className="text-2xs">{cfg.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
