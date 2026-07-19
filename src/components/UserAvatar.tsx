import { useState } from 'react'

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
]

const SIZE_MAP = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
} as const

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export interface UserAvatarProps {
  photoUrl: string | null | undefined
  fullName: string
  size?: keyof typeof SIZE_MAP
  className?: string
}

export default function UserAvatar({
  photoUrl,
  fullName,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const colorIndex = hashName(fullName) % AVATAR_COLORS.length
  const initials = getInitials(fullName)
  const sizeClass = SIZE_MAP[size]

  const showImage = photoUrl && !imgError

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${sizeClass} ${className}`}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={fullName}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-semibold text-white ${AVATAR_COLORS[colorIndex]}`}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
