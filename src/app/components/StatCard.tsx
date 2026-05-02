import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatCardProps {
  label: string
  value: string | number | null | undefined
  icon: LucideIcon
  loading?: boolean
  className?: string
}

export function StatCard({ label, value, icon: Icon, loading, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(22,18,40,0.09)]',
        className
      )}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-[var(--color-accent-soft)] opacity-40 transition-opacity group-hover:opacity-70" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
            {label}
          </p>
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-[var(--color-muted)]" />
          ) : (
            <p className="text-[2.25rem] font-semibold leading-none tracking-tight text-[var(--color-foreground)] tabular-nums sm:text-[2.5rem]">
              {value ?? '—'}
            </p>
          )}
        </div>
        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  )
}
