import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface QuickActionProps {
  icon: LucideIcon
  label: string
  description?: string
  to: string
  className?: string
}

export function QuickAction({ icon: Icon, label, description, to, className }: QuickActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-all duration-150 hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-soft)]/40',
        className
      )}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--color-muted)] text-[var(--color-muted-foreground)] transition-colors group-hover:bg-[var(--color-accent-soft)] group-hover:text-[var(--color-accent)]">
        <Icon className="h-[15px] w-[15px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-foreground)]">{label}</p>
        {description && (
          <p className="truncate text-[12px] text-[var(--color-muted-foreground)]">{description}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
    </Link>
  )
}
