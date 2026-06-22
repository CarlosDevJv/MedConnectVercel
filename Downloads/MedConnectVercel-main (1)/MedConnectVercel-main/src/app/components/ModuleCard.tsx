import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type ModuleStatus = 'active' | 'coming-soon'

interface ModuleCardProps {
  icon: LucideIcon
  title: string
  description: string
  status: ModuleStatus
  to?: string
  className?: string
}

const statusConfig = {
  active: {
    pill: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    label: 'Disponível',
  },
  'coming-soon': {
    pill: 'border-[var(--color-border)] text-[var(--color-muted-foreground)] bg-transparent',
    label: 'Em breve',
  },
}

export function ModuleCard({ icon: Icon, title, description, status, to, className }: ModuleCardProps) {
  const config = statusConfig[status]
  const isActive = status === 'active' && !!to

  const cardClass = cn(
    'group relative flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-200',
    isActive
      ? 'cursor-pointer hover:-translate-y-[2px] hover:border-[var(--color-accent)]/45 hover:shadow-[0_10px_36px_rgba(22,18,40,0.1)]'
      : 'opacity-80',
    className
  )

  const inner = (
    <>
      {/* Icon + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <span
          className={cn(
            'mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            config.pill
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-[var(--color-foreground)]">
          {title}
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
      </div>

      {/* CTA */}
      {isActive && (
        <div className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
          Abrir módulo
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
    </>
  )

  if (isActive) {
    return (
      <Link to={to!} className={cardClass}>
        {inner}
      </Link>
    )
  }

  return <div className={cardClass}>{inner}</div>
}
