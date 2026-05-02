import * as React from 'react'

import type { EnrichedAppointment } from '@/features/agenda/types'
import {
  addDays,
  startOfMonth,
  startOfWeekMonday,
  toISODateString,
} from '@/features/agenda/utils/calendar'
import { cn } from '@/lib/cn'

export interface CalendarMonthViewProps {
  monthAnchor: Date
  appointments: EnrichedAppointment[]
  onSelectDay?: (d: Date) => void
}

export function CalendarMonthView({ monthAnchor, appointments, onSelectDay }: CalendarMonthViewProps) {
  const monthStart = startOfMonth(monthAnchor)
  const gridStart = startOfWeekMonday(monthStart)

  const countsByDay = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const a of appointments) {
      const k = toISODateString(new Date(a.scheduled_at))
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const cells = React.useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart])

  const labelMonth = monthAnchor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-3 text-center font-display text-sm font-medium capitalize text-[var(--color-foreground)]">
        {labelMonth}
      </p>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const iso = toISODateString(d)
          const inMonth = d.getMonth() === monthAnchor.getMonth()
          const n = countsByDay.get(iso) ?? 0
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay?.(d)}
              className={cn(
                'flex min-h-[52px] flex-col items-center rounded-lg border p-1 text-sm transition-colors',
                inMonth
                  ? 'border-[var(--color-border)] bg-[var(--color-muted)]/25 hover:bg-[var(--color-accent-soft)]/40'
                  : 'border-transparent bg-transparent text-[var(--color-muted-foreground)] opacity-50'
              )}
            >
              <span>{d.getDate()}</span>
              {n > 0 && (
                <span className="mt-auto rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                  {n}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
