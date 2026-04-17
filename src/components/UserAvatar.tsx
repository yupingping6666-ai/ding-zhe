/**
 * Renders a user avatar — supports both emoji text and image (data URL / http URL).
 *
 * For emoji avatars the text is rendered directly (parent controls size via text-* classes).
 * For image avatars an <img> is rendered with the specified `imgClass` size.
 */

export function isImageAvatar(avatar: string): boolean {
  return avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('blob:') || avatar.startsWith('/')
}

interface UserAvatarProps {
  avatar: string
  /** Tailwind size class applied to <img> when avatar is a photo, e.g. "w-full h-full" */
  imgClass?: string
}

export function UserAvatar({ avatar, imgClass = 'w-full h-full' }: UserAvatarProps) {
  if (isImageAvatar(avatar)) {
    return (
      <img
        src={avatar}
        alt=""
        className={`rounded-full object-cover ${imgClass}`}
        draggable={false}
      />
    )
  }
  return <>{avatar}</>
}
