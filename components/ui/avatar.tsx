import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl'
}

/**
 * Avatar component for displaying user profile images or initials.
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for image
 * @param {string} fallback - Initials to display when no image
 * @param {string} size - Size of the avatar: sm (32px), md (40px), lg (48px), xl (64px)
 */
export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const initials = fallback || (alt ? alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '')

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden font-medium",
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: 'var(--mocha-taupe)',
        color: 'var(--charcoal-brown)'
      }}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center">
        {initials}
      </span>
    </div>
  )
}

interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'busy' | 'away'
}

const statusColors = {
  online: 'var(--forest-green)',
  offline: 'var(--charcoal-brown-alpha)',
  busy: 'var(--brick-red)',
  away: 'var(--clay-orange)'
}

/**
 * AvatarWithStatus component for displaying user avatar with online status indicator.
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for image
 * @param {string} fallback - Initials to display when no image
 * @param {string} size - Size of the avatar
 * @param {string} status - User status: online, offline, busy, away
 */
export function AvatarWithStatus({ status, size = 'md', className, ...props }: AvatarWithStatusProps) {
  const sizeInPixels = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  }[size]

  const statusSize = {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14
  }[size]

  return (
    <div className="relative inline-block">
      <Avatar size={size} className={className} {...props} />
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{
            width: `${statusSize}px`,
            height: `${statusSize}px`,
            backgroundColor: statusColors[status],
            borderColor: 'var(--ivory-cream)'
          }}
        />
      )}
    </div>
  )
}
