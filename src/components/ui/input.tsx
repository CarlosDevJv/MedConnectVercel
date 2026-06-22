import * as React from 'react'

import { cn } from '@/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightSlot?: React.ReactNode
  invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', leftIcon, rightSlot, invalid, ...props }, ref) => {
    if (leftIcon || rightSlot) {
      return (
        <div
          className={cn(
            'flex h-11 w-full items-center rounded-[10px] border bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-foreground)]',
            'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/30',
            invalid && 'border-[var(--color-destructive)] focus-within:border-[var(--color-destructive)] focus-within:ring-[var(--color-destructive)]/30',
            className
          )}
        >
          {leftIcon && (
            <span className="mr-2.5 flex shrink-0 text-[var(--color-muted-foreground)]" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className="flex-1 bg-transparent outline-none placeholder:text-[var(--color-muted-foreground)]/70 disabled:cursor-not-allowed disabled:opacity-60"
            aria-invalid={invalid || undefined}
            {...props}
          />
          {rightSlot && <span className="ml-2 flex shrink-0">{rightSlot}</span>}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-11 w-full rounded-[10px] border bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-foreground)]',
          'border-[var(--color-border)] outline-none placeholder:text-[var(--color-muted-foreground)]/70',
          'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          invalid && 'border-[var(--color-destructive)] focus:border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30',
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
