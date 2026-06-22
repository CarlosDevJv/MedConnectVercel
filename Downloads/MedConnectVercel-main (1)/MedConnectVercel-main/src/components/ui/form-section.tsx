import * as React from 'react'

import { cn } from '@/lib/cn'

interface FormSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
  /** Lock state by ID for anchor scrolling on validation errors. */
  id?: string
}

export function FormSection({ title, description, icon, className, children, id }: FormSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6',
        className
      )}
    >
      <header className="mb-5 flex items-start gap-3">
        {icon && (
          <span
            aria-hidden="true"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-tight text-[var(--color-foreground)]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
          )}
        </div>
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}
