import * as React from 'react'

import { cn } from '@/lib/cn'

const PALETTE = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
] as const

function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-16 w-16 text-xl',
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, size = 'md', ...props }, ref) => {
    const initials = getInitials(name)
    const palette = PALETTE[hashString(name ?? '?') % PALETTE.length]
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'inline-grid shrink-0 place-items-center rounded-full font-display font-medium',
          SIZE_CLASSES[size],
          palette.bg,
          palette.text,
          className
        )}
        {...props}
      >
        {initials}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'
