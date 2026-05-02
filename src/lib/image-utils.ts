/**
 * Image compression utilities for task photo attachments.
 * Shared by TaskCard, ReminderOverlay, and MyPage.
 */

/** Read a File object as a data URL string. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('file read failed'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image data URL via canvas.
 * @param dataUrl  - source image as data URL
 * @param maxSize  - longest edge limit (default 800px for task photos)
 * @param quality  - JPEG quality 0-1 (default 0.8)
 */
export function compressImage(
  dataUrl: string,
  maxSize = 800,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width
      let h = img.height
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h * maxSize) / w)
          w = maxSize
        } else {
          w = Math.round((w * maxSize) / h)
          h = maxSize
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas unsupported'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = dataUrl
  })
}
