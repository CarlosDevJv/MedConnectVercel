import { cn } from '@/lib/cn'

interface FieldErrorProps {
  id?: string
  message?: string
  className?: string
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      className={cn('mt-1.5 text-xs text-[var(--color-destructive)]', className)}
    >
      {message}
    </p>
  )
}
