import { useState, useMemo, useRef } from 'react'
import { AiInsightCard } from '@/components/AiInsightCard'
import { isImageAvatar } from '@/components/UserAvatar'
import { CityPicker } from '@/components/CityPicker'
import { COMPANION_CHARACTERS } from '@/lib/companion'
import { useCurrentUser } from '@/contexts/UserContext'
import { useApi } from '@/contexts/ApiContext'
import { InvitePairCard } from '@/components/InvitePairCard'
import { CheckCircle2, ClipboardList, BarChart3, Star, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import catHeroImg from '@/assets/pets/cat/mypage-cat.png'
import type { Store } from '@/store'

interface MyPageProps {
  store: Store
  userMode: 'single' | 'dual'
  onEditProfile?: (userId: string) => void
}

const AVATAR_EMOJIS = [
  '👧', '👦', '👩', '👨', '🧒', '👶', '👸', '🤴', '🧔', '👩\u200d🦰', '👨\u200d🦱', '🧑',
  '🐱', '🐶', '🦊', '🐻', '🐰', '🐼', '🌸', '🌻', '⭐', '🌙', '🔥', '🦋',
]

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 200
      let w = img.width
      let h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas unsupported')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = dataUrl
  })
}

function parseBirthday(birthday?: string) {
  if (!birthday) return { year: '', month: '', day: '' }
  const parts = birthday.split('-')
  if (parts.length !== 3) return { year: '', month: '', day: '' }
  return {
    year: parts[0] === '0000' ? '' : parts[0],
    month: parts[1].replace(/^0/, ''),
    day: parts[2].replace(/^0/, ''),
  }
}

function buildBirthday(year: string, month: string, day: string): string | undefined {
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)
  if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) return undefined
  const y = parseInt(year, 10)
  const currentYear = new Date().getFullYear()
  const yearStr = (y && y >= 1900 && y <= currentYear) ? String(y) : '0000'
  return `${yearStr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function MyPage({ store, userMode }: MyPageProps) {
  const currentUserId = useCurrentUser()
  const { logout } = useApi()
  const user = store.getUserProfile(currentUserId)
  const character = COMPANION_CHARACTERS[store.space.companion]

  // Profile editing state
  const [editName, setEditName] = useState(user.name)
  const [editAvatar, setEditAvatar] = useState(user.avatar)
  const [editCity, setEditCity] = useState(user.userCity || '')
  const parsed = parseBirthday(user.birthday)
  const [editBirthYear, setEditBirthYear] = useState(parsed.year)
  const [editBirthMonth, setEditBirthMonth] = useState(parsed.month)
  const [editBirthDay, setEditBirthDay] = useState(parsed.day)
  const [editBio, setEditBio] = useState(user.bio || '')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [profileExpanded, setProfileExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Feelings
  const feelings = store.getFeelings(currentUserId)

  // Stats
  const todayCompleted = store.todayCompletedCount
  const todayPending = store.pending.length + store.awaiting.length + store.deferred.length
  const todayTotal = store.todayTotalCount

  // Check if profile changed
  const hasChanges = useMemo(() => {
    const newBirthday = buildBirthday(editBirthYear, editBirthMonth, editBirthDay)
    return (
      editName.trim() !== user.name ||
      editAvatar !== user.avatar ||
      editCity !== (user.userCity || '') ||
      newBirthday !== user.birthday ||
      editBio.trim() !== (user.bio || '')
    )
  }, [editName, editAvatar, editCity, editBirthYear, editBirthMonth, editBirthDay, editBio, user])

  const isValid = editName.trim().length > 0

  function handleSaveProfile() {
    if (!isValid) return
    const birthday = buildBirthday(editBirthYear, editBirthMonth, editBirthDay)
    store.updateUserProfile(currentUserId, {
      name: editName.trim(),
      avatar: editAvatar,
      userCity: editCity || undefined,
      birthday,
      bio: editBio.trim() || undefined,
    })
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('仅支持 JPG, PNG, GIF, WebP 格式')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('图片不能超过 2MB')
      e.target.value = ''
      return
    }
    setUploadError('')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result as string)
        setEditAvatar(compressed)
        setShowAvatarPicker(false)
      } catch {
        setUploadError('图片处理失败，请换一张试试')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Top: Avatar centered (clickable to edit) */}
      <div className="shrink-0 flex flex-col items-center pt-6 pb-3">
        <button
          onClick={() => { setShowAvatarPicker(!showAvatarPicker); setUploadError('') }}
          className="w-20 h-20 rounded-full bg-card flex items-center justify-center text-4xl shadow-sm border-2 border-border/30 hover:border-primary/40 transition-all active:scale-95 relative overflow-hidden"
        >
          {isImageAvatar(editAvatar)
            ? <img src={editAvatar} alt="" className="w-full h-full object-cover" draggable={false} />
            : editAvatar}
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
            <span className="text-[10px] text-white">✏️</span>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="px-5 pb-20 space-y-4">

          {/* Avatar picker (when open) */}
          {showAvatarPicker && (
            <div className="bg-secondary/50 rounded-2xl p-3 animate-fade-in space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-primary/10 text-sm font-medium text-primary hover:bg-primary/15 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="text-base">📷</span>
                上传照片
              </button>
              <p className="text-2xs text-center text-muted-foreground/50">
                支持 JPG, PNG, GIF, WebP，不超过 2MB
              </p>
              {uploadError && (
                <p className="text-xs text-red-500 text-center font-medium">{uploadError}</p>
              )}
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { setEditAvatar(emoji); setShowAvatarPicker(false); setUploadError('') }}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all active:scale-90 ${
                      editAvatar === emoji
                        ? 'bg-primary/15 ring-2 ring-primary/40 scale-110'
                        : 'bg-card/80 hover:bg-card'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cat Hero Section (dual only) */}
          {userMode === 'dual' && (
          <div className="relative flex flex-col items-center py-5 bg-secondary/30 rounded-3xl">
            <Star className="absolute top-3 left-6 w-3 h-3 text-primary/25 animate-pulse" style={{ animationDelay: '0s' }} />
            <Star className="absolute top-8 right-8 w-4 h-4 text-care/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Star className="absolute bottom-10 left-10 w-3.5 h-3.5 text-primary/20 animate-pulse" style={{ animationDelay: '1s' }} />
            <Star className="absolute bottom-6 right-12 w-3 h-3 text-care/25 animate-pulse" style={{ animationDelay: '1.5s' }} />
            <Star className="absolute top-12 left-16 w-2.5 h-2.5 text-primary/15 animate-pulse" style={{ animationDelay: '2s' }} />
            <img
              src={catHeroImg}
              alt={character.name}
              className="w-24 h-24 object-contain select-none pointer-events-none"
              draggable={false}
            />
            <p className="text-base font-bold text-foreground mt-2">
              一起 {store.relationDays} 天
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              一起庆祝吧！{character.name}很开心！
            </p>
          </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-3 text-center border border-border/30">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--success))]/15 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                </div>
                <div className="text-xl font-bold text-foreground">{todayCompleted}</div>
                <div className="text-2xs text-muted-foreground">今日完成</div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-3 text-center border border-border/30">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--awaiting))]/15 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-[hsl(var(--awaiting))]" />
                </div>
                <div className="text-xl font-bold text-foreground">{todayPending}</div>
                <div className="text-2xs text-muted-foreground">今日待办</div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-3 text-center border border-border/30">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--care))]/15 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[hsl(var(--care))]" />
                </div>
                <div className="text-xl font-bold text-foreground">{todayTotal}</div>
                <div className="text-2xs text-muted-foreground">今日总计</div>
              </div>
            </div>
          </div>

          {/* AI Insight Card */}
          <AiInsightCard recordCount={feelings.length} />

          {/* ===== Personal Info (collapsible) ===== */}
          <div className="bg-card rounded-3xl border border-border/40 overflow-hidden">
            {/* Header - click to toggle */}
            <button
              onClick={() => { setProfileExpanded(!profileExpanded); setShowAvatarPicker(false); setUploadError('') }}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
            >
              <span className="text-sm text-foreground font-bold">个人信息</span>
              <div className="flex items-center gap-2">
                {!profileExpanded && (
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user.name}{user.userCity ? ` · ${user.userCity}` : ''}</span>
                )}
                {profileExpanded
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </button>

            {profileExpanded && (
              <>
                <div className="border-t border-border/40" />

                {/* Name */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium shrink-0">昵称</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={10}
                    placeholder="输入昵称"
                    className="text-right bg-transparent text-sm text-foreground outline-none w-0 flex-1 ml-4 placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="border-t border-border/40" />

                {/* City */}
                <CityPicker value={editCity} onChange={setEditCity} />
                <div className="border-t border-border/40" />

                {/* Birthday */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium shrink-0">生日</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editBirthYear}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          if (v.length === 4) {
                            const n = parseInt(v, 10)
                            const currentYear = new Date().getFullYear()
                            setEditBirthYear(n > currentYear ? String(currentYear) : n < 1900 ? '1900' : v)
                          } else {
                            setEditBirthYear(v)
                          }
                        }}
                        placeholder="年"
                        className="w-[4.5rem] px-2 py-1.5 rounded-xl bg-muted/50 text-sm text-center text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                      />
                      <span className="text-muted-foreground/40 text-xs">-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editBirthMonth}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                          const n = parseInt(v, 10)
                          setEditBirthMonth(v && n > 12 ? '12' : v)
                        }}
                        placeholder="月"
                        className="w-12 px-2 py-1.5 rounded-xl bg-muted/50 text-sm text-center text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                      />
                      <span className="text-muted-foreground/40 text-xs">-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editBirthDay}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                          const n = parseInt(v, 10)
                          setEditBirthDay(v && n > 31 ? '31' : v)
                        }}
                        placeholder="日"
                        className="w-12 px-2 py-1.5 rounded-xl bg-muted/50 text-sm text-center text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/40" />

                {/* Bio */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium shrink-0">签名</span>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={50}
                    placeholder="一句话介绍自己~"
                    className="text-right bg-transparent text-sm text-foreground outline-none w-0 flex-1 ml-4 placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* Save button (inside card) */}
                <div className="px-5 pb-4 pt-1">
                  <button
                    onClick={() => { handleSaveProfile(); setProfileExpanded(false) }}
                    disabled={!hasChanges || !isValid}
                    className={`w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                      hasChanges && isValid
                        ? 'bg-primary text-white shadow-md hover:shadow-lg'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    保存修改
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Invite Pair Card (single mode only) */}
          {userMode === 'single' && (
            <InvitePairCard store={store} variant="compact" />
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border/40 text-sm text-muted-foreground hover:bg-secondary/30 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            退出账号
          </button>
        </div>
      </div>
    </div>
  )
}
