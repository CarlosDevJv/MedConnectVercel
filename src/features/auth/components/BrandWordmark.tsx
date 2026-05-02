import { cn } from '@/lib/cn'

import { MediConnectLogoMark } from '@/features/auth/components/MediConnectLogoMark'

interface BrandWordmarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Só texto; use junto do `MediConnectLogoMark` quando o ícone já está em outro contêiner. */
  variant?: 'full' | 'textOnly'
}

export function BrandWordmark({ className, size = 'md', variant = 'full' }: BrandWordmarkProps) {
  const textSizes = {
    sm: 'text-xl leading-tight',
    md: 'text-2xl leading-tight',
    lg: 'text-3xl leading-tight',
  }
  const markSizes = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  if (variant === 'textOnly') {
    return (
      <span
        className={cn(
          'font-display font-semibold tracking-tight text-[var(--color-accent)]',
          textSizes[size],
          className
        )}
      >
        MediConnect
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-display font-semibold tracking-tight text-[var(--color-accent)]',
        textSizes[size],
        className
      )}
    >
      <MediConnectLogoMark className={cn(markSizes[size])} />
      MediConnect
    </span>
  )
}
