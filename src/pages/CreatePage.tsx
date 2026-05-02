import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_CONFIG,
  INTENSITY_CONFIG,
  REPEAT_CONFIG,
  WEEKDAY_LABELS,
  ITEM_TYPE_CONFIG,
  inferTaskActionType,
} from '@/types'
import type { Category, RepeatRule, FollowUpIntensity, ItemType, FeelingEntryType } from '@/types'
import type { Store } from '@/store'
import { UserAvatar } from '@/components/UserAvatar'
import { useCurrentUser } from '@/contexts/UserContext'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { PetEmoji } from '@/components/PetEmoji'
import { ArrowLeft, Camera, MapPin, Video, X, Search, ChevronRight, Loader2, Navigation } from 'lucide-react'

interface Props {
  store: Store
  userMode: 'single' | 'dual'
  createPreset?: string | null
  onBack: () => void
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '😌', label: '平静' },
  { emoji: '😔', label: '低落' },
  { emoji: '😤', label: '烦躁' },
  { emoji: '🥰', label: '幸福' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '🌿', label: '放松' },
  { emoji: '💭', label: '思考' },
]

export function CreatePage({ store, userMode, createPreset, onBack }: Props) {
  const currentUserId = useCurrentUser()

  // 记录类功能（照片记录/瞬间感受）在双人模式下也使用 SingleModeForm
  if (userMode === 'single' || createPreset === 'photo-journal' || createPreset === 'mood-capture') {
    return <SingleModeForm store={store} preset={createPreset} onBack={onBack} />
  }

  return <DualModeForm store={store} currentUserId={currentUserId} onBack={onBack} />
}

// ======== Location Picker (WeChat Moments style) ========

interface PlaceResult {
  name: string
  addr: string
  lat: number
  lng: number
}

function LocationPickerOverlay({ onSelectWithCoords, onClear, onClose }: {
  onSelectWithCoords: (loc: { lat: number; lng: number; name: string }) => void
  onClear: () => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [gpsPlace, setGpsPlace] = useState<PlaceResult | null>(null)
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gpsCoords = useRef<{ lat: number; lng: number } | null>(null)

  // GPS locate on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        gpsCoords.current = { lat: latitude, lng: longitude }
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=zh`,
            { headers: { 'User-Agent': 'DingZheApp/1.0' } }
          )
          if (resp.ok) {
            const data = await resp.json()
            const name = data.name || data.display_name?.split(',')[0] || '当前位置'
            const addr = data.address
              ? [data.address.road, data.address.suburb, data.address.city].filter(Boolean).join(' ')
              : data.display_name?.split(',').slice(0, 3).join(', ') || ''
            setGpsPlace({ lat: latitude, lng: longitude, name, addr: addr || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
          } else {
            setGpsPlace({ lat: latitude, lng: longitude, name: '当前位置', addr: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
          }
        } catch {
          setGpsPlace({ lat: latitude, lng: longitude, name: '当前位置', addr: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
        }
        setGpsStatus('success')
      },
      () => { setGpsStatus('error') },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // Debounced search via Nominatim
  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!value.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const coords = gpsCoords.current
        const viewbox = coords
          ? `&viewbox=${coords.lng - 0.1},${coords.lat - 0.1},${coords.lng + 0.1},${coords.lat + 0.1}&bounded=0`
          : ''
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value.trim())}&limit=10&accept-language=zh${viewbox}`,
          { headers: { 'User-Agent': 'DingZheApp/1.0' } }
        )
        if (resp.ok) {
          const data = await resp.json()
          const results: PlaceResult[] = data.map((item: { display_name?: string; lat?: string; lon?: string; name?: string; type?: string }) => ({
            name: item.name || item.display_name?.split(',')[0] || value.trim(),
            addr: item.display_name?.split(',').slice(0, 3).join(', ') || '',
            lat: parseFloat(item.lat || '0'),
            lng: parseFloat(item.lon || '0'),
          }))
          setSearchResults(results)
        }
      } catch { /* ignore */ }
      setSearching(false)
    }, 500)
  }

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b">
        <button onClick={onClose} className="text-sm text-muted-foreground">取消</button>
        <h2 className="text-sm font-semibold text-foreground">所在位置</h2>
        <div className="w-8" />
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
          <Search className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索地点"
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => handleSearchChange('')} className="text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Location list */}
      <div className="flex-1 overflow-y-auto">
        {/* "不显示位置" option */}
        <button
          onClick={onClear}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-accent transition-colors text-left border-b"
        >
          <X className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">不显示位置</span>
        </button>

        {/* GPS location — show when not searching */}
        {!search.trim() && (
          <>
            {gpsStatus === 'loading' && (
              <div className="w-full flex items-center gap-3 px-5 py-3 border-b border-border/30">
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <p className="text-sm text-muted-foreground">正在定位...</p>
              </div>
            )}
            {gpsStatus === 'success' && gpsPlace && (
              <button
                onClick={() => onSelectWithCoords({ lat: gpsPlace.lat, lng: gpsPlace.lng, name: gpsPlace.name })}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-accent transition-colors text-left border-b border-border/30"
              >
                <Navigation className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{gpsPlace.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{gpsPlace.addr}</p>
                </div>
                <span className="text-2xs text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">GPS</span>
              </button>
            )}
            {gpsStatus === 'error' && (
              <div className="w-full flex items-center gap-3 px-5 py-3 border-b border-border/30">
                <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <p className="text-sm text-muted-foreground">无法获取定位，请搜索地点</p>
              </div>
            )}
          </>
        )}

        {/* Search results */}
        {search.trim() && (
          <>
            {searching && (
              <div className="w-full flex items-center gap-3 px-5 py-3 border-b border-border/30">
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <p className="text-sm text-muted-foreground">搜索中...</p>
              </div>
            )}
            {!searching && searchResults.map((place, idx) => (
              <button
                key={`${place.name}-${idx}`}
                onClick={() => onSelectWithCoords({ lat: place.lat, lng: place.lng, name: place.name })}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-accent transition-colors text-left border-b border-border/30"
              >
                <MapPin className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{place.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{place.addr}</p>
                </div>
              </button>
            ))}
            {!searching && searchResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">未找到相关地点</div>
            )}
          </>
        )}

        {/* Empty state when no GPS and no search */}
        {!search.trim() && gpsStatus === 'error' && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            输入关键词搜索附近地点
          </div>
        )}
      </div>
    </div>
  )
}

// ======== Single Mode Form ========

function SingleModeForm({ store, preset, onBack }: { store: Store; preset?: string | null; onBack: () => void }) {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('😊')
  const [photos, setPhotos] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video')[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const entryType: FeelingEntryType =
    preset === 'photo-journal' ? 'photo' : 'mood'

  const title = entryType === 'photo' ? '照片记录' : '瞬间感受'

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const remaining = 9 - photos.length
    const picked = Array.from(files).slice(0, remaining)
    const urls = picked.map((f) => URL.createObjectURL(f))
    const types = picked.map((f): 'image' | 'video' =>
      f.type.startsWith('video/') ? 'video' : 'image'
    )
    setPhotos((prev) => [...prev, ...urls])
    setMediaTypes((prev) => [...prev, ...types])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeMedia(index: number) {
    setPhotos((prev) => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
    setMediaTypes((prev) => prev.filter((_, i) => i !== index))
  }

  function selectLocationWithCoords(loc: { lat: number; lng: number; name: string }) {
    setLocation(loc)
    setShowLocationPicker(false)
  }

  function handleSave() {
    if (entryType === 'mood' && !mood) return
    if (entryType === 'photo' && photos.length === 0) return

    const finalContent = entryType === 'mood' && !content.trim()
      ? MOOD_OPTIONS.find((m) => m.emoji === mood)?.label || mood
      : content.trim()

    store.saveFeeling(
      currentUserId, finalContent, mood, undefined, entryType,
      photos.length > 0 ? photos : undefined,
      location ?? undefined,
      mediaTypes.length > 0 ? mediaTypes : undefined
    )
    onBack()
  }

  const canSubmit = entryType === 'mood' ? !!mood : photos.length > 0

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>

      {/* Pet suggestion banner */}
      <div className="mx-4 mb-4 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-center gap-3">
        <PetEmoji value={COMPANION_CHARACTERS[store.space.companion].avatar} size="w-6 h-6" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-700">记录一下吧，让TA也看到你的这一刻</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Mood picker */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            {entryType === 'mood' ? '此刻的心情' : '心情标签'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.emoji}
                onClick={() => setMood(opt.emoji)}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all ${
                  mood === opt.emoji
                    ? 'bg-primary/10 ring-2 ring-primary/30 scale-105'
                    : 'bg-secondary hover:bg-accent'
                }`}
              >
                <span className={entryType === 'mood' ? 'text-2xl' : 'text-lg'}>{opt.emoji}</span>
                <span className="text-2xs text-muted-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Media upload area (photo + video) */}
        {entryType === 'photo' && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              照片/视频 {photos.length > 0 && <span className="text-muted-foreground font-normal">({photos.length}/9)</span>}
            </label>
            {photos.length === 0 ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
              >
                <div className="flex gap-3">
                  <Camera className="w-7 h-7 text-muted-foreground/50" />
                  <Video className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <span className="text-sm">点击选择照片或视频（最多 9 个）</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                    {mediaTypes[idx] === 'video' ? (
                      <video src={url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    {mediaTypes[idx] === 'video' && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-2xs flex items-center gap-0.5">
                        <Video className="w-3 h-3" />
                      </div>
                    )}
                    <button
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 9 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-muted-foreground/40" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}

        {/* Content textarea */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            {entryType === 'mood' ? '想说点什么？（可选）' : '写下你的想法'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              entryType === 'mood' ? '此刻的感受...' : '这些照片的故事...'
            }
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
          />
          <div className="text-right text-2xs text-muted-foreground mt-1">
            {content.length}/500
          </div>
        </div>

        {/* Location — WeChat-style row trigger */}
        <button
          onClick={() => setShowLocationPicker(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-left"
        >
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className={`flex-1 text-sm truncate ${location ? 'text-foreground' : 'text-muted-foreground'}`}>
            {location?.name || '所在位置'}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        </button>

        <Button
          size="xl"
          className="w-full"
          disabled={!canSubmit}
          onClick={handleSave}
        >
          保存记录
        </Button>
      </div>

      {/* Location Picker Overlay — WeChat Moments style */}
      {showLocationPicker && (
        <LocationPickerOverlay
          onSelectWithCoords={selectLocationWithCoords}
          onClear={() => { setLocation(null); setShowLocationPicker(false) }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  )
}

// ======== Dual Mode Form (original logic) ========

function DualModeForm({ store, currentUserId, onBack }: { store: Store; currentUserId: string; onBack: () => void }) {
  const partner = store.getUserProfile(store.getUserProfile(currentUserId).partnerId)

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
      setReceiverIsSelf(false)
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
      actionType: inferTaskActionType(name.trim()),
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
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">创建提醒</h1>
      </div>

      <div className="px-5 space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">发给谁？</label>
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            <button
              onClick={() => setReceiverIsSelf(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                !receiverIsSelf ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <span className="w-5 h-5 rounded-full overflow-hidden inline-flex items-center justify-center"><UserAvatar avatar={partner.avatar} imgClass="w-5 h-5" /></span> {partner.name}
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

        <div className="space-y-2 mt-2">
          <Button
            size="xl"
            className="w-full"
            variant={itemType === 'care' ? 'care' : itemType === 'confirm' ? 'confirm' : 'default'}
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
