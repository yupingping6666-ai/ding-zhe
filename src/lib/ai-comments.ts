const POSITIVE_COMMENTS = [
  '看起来今天是美好的一天！',
  '开心的时刻值得被记住 ✨',
  '继续保持好心情哦～',
  '笑容是最好的装饰 🌸',
  '这份快乐也感染到我了！',
  '生活因为这些小确幸而闪闪发光 💫',
]

const NEUTRAL_COMMENTS = [
  '每个瞬间都值得被珍惜 💫',
  '记录下来就是最好的礼物',
  '安静的时刻也很美好',
  '给自己一些慢下来的时间',
  '平淡中也有属于你的小美好',
  '这样的日子刚刚好 ☁️',
]

const NEGATIVE_COMMENTS = [
  '抱抱你，一切都会好起来的 🤗',
  '不开心的时候也要好好吃饭哦',
  '你已经很棒了，给自己一些温柔 💛',
  '难过的时候，记得有人在乎你',
  '明天又是新的一天，会更好的',
  '偶尔难过也没关系，慢慢来～',
]

const PHOTO_COMMENTS = [
  '好美的画面！📸',
  '这个瞬间好温暖 🧡',
  '值得珍藏的一刻！',
  '用照片留住美好 ✨',
  '生活中的小确幸 📷',
  '每张照片都有一个故事',
]

const POSITIVE_MOODS = new Set(['😊', '🥰', '🌿', '😌'])
const NEGATIVE_MOODS = new Set(['😔', '😤', '😴'])

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateWarmComment(content: string, mood: string, hasPhotos: boolean): string {
  // Negative mood always gets comforting comments, never cheerful photo comments
  if (NEGATIVE_MOODS.has(mood)) return pickRandom(NEGATIVE_COMMENTS)

  // Photo comments only for positive/neutral moods
  if (hasPhotos && Math.random() < 0.5) return pickRandom(PHOTO_COMMENTS)

  if (POSITIVE_MOODS.has(mood)) return pickRandom(POSITIVE_COMMENTS)
  return pickRandom(NEUTRAL_COMMENTS)
}

// ---- Pet persona comments ----

const PET_RELATIONSHIP_COMMENTS = [
  '你们今天的氛围很轻松',
  '感觉你们最近越来越默契了',
  '这样的互动我很喜欢看到',
  '你们在一起的时光总是很温暖',
  '能感受到你们之间的默契',
  '你们的关系让我觉得很安心',
  '今天的你们看起来很放松',
  '这种小日常才是最珍贵的',
  '你们的相处方式让我很舒服',
  '能陪着你们一起，我很开心',
  '这份温柔的互动真好',
  '你们之间的信任感越来越强了',
  '日子平淡但你们在一起就够了',
  '看到你们这样我就放心了',
  '你们的默契是时间酿出来的',
  '这种安静的陪伴最动人',
]

const PET_RELATIONSHIP_PHOTO_COMMENTS = [
  '用镜头记录下的瞬间更珍贵',
  '这个画面让我想收藏起来',
  '这一刻值得反复翻看',
  '你们的记录越来越有温度了',
  '每张照片都是生活的切片',
  '好美的画面，替你们珍藏着',
  '这样的记录方式很有意义',
  '把美好的瞬间留住了呢',
]

const PET_RELATIONSHIP_NEGATIVE_COMMENTS = [
  '有些话说不出口也没关系的',
  '你们之间的事，慢慢来就好',
  '偶尔有些不顺，但你们还在一起',
  '情绪波动是正常的，我在呢',
  '给彼此一点空间也是一种爱',
  '不开心的时候，别忘了你不是一个人',
]

const PET_SOLO_COMMENTS = [
  '你今天看起来心情不错',
  '能感受到你的情绪，我一直在',
  '你正在变得越来越了解自己',
  '今天的你，辛苦了',
  '记录本身就是对自己最好的关心',
  '你的每一个感受都很重要',
  '慢慢来，不着急',
  '你比自己以为的更勇敢',
  '今天也在好好生活呢',
  '能陪着你记录这些，我很开心',
  '你的日常其实很有光',
  '独处的时间也值得珍惜',
  '你正在成为更好的自己',
  '一个人的时光也很美好',
  '给自己一个拥抱吧',
  '你的感受被看见了',
]

const PET_SOLO_PHOTO_COMMENTS = [
  '镜头下的世界真的很美',
  '你拍照的视角很独特',
  '这个瞬间被你捕捉到了',
  '照片里有你的温度',
  '用影像记录生活，很棒的习惯',
  '这个画面好治愈',
]

const PET_SOLO_NEGATIVE_COMMENTS = [
  '不开心的时候我也陪着你',
  '情绪低落很正常，慢慢来',
  '你不需要一直坚强',
  '把难过写下来也是一种释放',
  '我在这里，不会走的',
  '明天会更好的，相信我',
]

/**
 * Generate a pet-persona comment for a feeling entry.
 * Uses content hash for deterministic selection (same entry always gets same comment).
 */
export function generatePetComment(
  content: string,
  mood: string,
  hasPhotos: boolean,
  companionName: string,
  companionAvatar: string,
  isDual: boolean,
): string {
  // Simple hash from content + createdAt for deterministic selection
  let hash = 0
  const str = content + mood
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash)

  function pickByHash(arr: string[]): string {
    return arr[idx % arr.length]
  }

  const isNegative = NEGATIVE_MOODS.has(mood)

  let comment: string
  if (isDual) {
    if (isNegative) {
      comment = pickByHash(PET_RELATIONSHIP_NEGATIVE_COMMENTS)
    } else if (hasPhotos) {
      comment = pickByHash(PET_RELATIONSHIP_PHOTO_COMMENTS)
    } else {
      comment = pickByHash(PET_RELATIONSHIP_COMMENTS)
    }
  } else {
    if (isNegative) {
      comment = pickByHash(PET_SOLO_NEGATIVE_COMMENTS)
    } else if (hasPhotos) {
      comment = pickByHash(PET_SOLO_PHOTO_COMMENTS)
    } else {
      comment = pickByHash(PET_SOLO_COMMENTS)
    }
  }

  return `${companionAvatar} ${companionName}："${comment}"`
}
