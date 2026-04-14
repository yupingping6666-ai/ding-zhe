import { useState, useMemo, useRef } from 'react'
import type { Store } from '@/store'
import { CityPicker } from '@/components/CityPicker'
import { isImageAvatar } from '@/components/UserAvatar'
import { ArrowLeft } from 'lucide-react'

interface ProfileEditPageProps {
  store: Store
  userId: string
  onBack: () => void
}

const AVATAR_EMOJIS = [
  // People
  '👧', '👦', '👩', '👨', '🧒', '👶', '👸', '🤴', '🧔', '👩‍🦰', '👨‍🦱', '🧑',
  // Fun
  '🐱', '🐶', '🦊', '🐻', '🐰', '🐼', '🌸', '🌻', '⭐', '🌙', '🔥', '🦋',
]

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_LABEL = 'JPG, PNG, GIF, WebP'

/** Resize image to max 200x200 and compress as JPEG to keep data URL small */
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

function parseBirthday(birthday?: string): { year: string; month: string; day: string } {
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

export function ProfileEditPage({ store, userId, onBack }: ProfileEditPageProps) {
  const user = store.getUserProfile(userId)

  // Editable state initialized from current user
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if anything changed
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

  function handleSave() {
    if (!isValid) return
    const birthday = buildBirthday(editBirthYear, editBirthMonth, editBirthDay)
    store.updateUserProfile(userId, {
      name: editName.trim(),
      avatar: editAvatar,
      userCity: editCity || undefined,
      birthday,
      bio: editBio.trim() || undefined,
    })
    onBack()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate format
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`仅支持 ${ALLOWED_LABEL} 格式`)
      e.target.value = ''
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`图片不能超过 2MB（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`)
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
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">编辑资料</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Avatar section */}
        <div className="flex flex-col items-center py-4">
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
          <p className="text-xs text-muted-foreground mt-2">点击更换头像</p>

          {/* Avatar picker: upload + emoji grid */}
          {showAvatarPicker && (
            <div className="mt-3 w-full bg-secondary/50 rounded-2xl p-3 animate-fade-in space-y-3">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-primary/10 text-sm font-medium text-primary hover:bg-primary/15 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="text-base">📷</span>
                上传照片
              </button>
              <p className="text-2xs text-center text-muted-foreground/50">
                支持 {ALLOWED_LABEL}，不超过 2MB
              </p>

              {uploadError && (
                <p className="text-xs text-red-500 text-center font-medium">{uploadError}</p>
              )}

              {/* Emoji grid */}
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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Form card */}
        <div className="bg-card rounded-3xl border border-border/40 overflow-hidden">
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

          {/* City — reuse CityPicker */}
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
        </div>

        {/* Save button */}
        <div className="pt-2 pb-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || !isValid}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
              hasChanges && isValid
                ? 'bg-primary text-white shadow-md hover:shadow-lg'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}
