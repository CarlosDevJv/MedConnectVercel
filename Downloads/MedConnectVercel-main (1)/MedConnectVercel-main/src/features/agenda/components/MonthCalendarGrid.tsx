import * as React from 'react'

import { addDays, startOfMonth, startOfWeekMonday, toISODateString } from '@/features/agenda/utils/calendar'
import { cn } from '@/lib/cn'

export interface MonthCalendarGridProps {
  monthAnchor: Date
  /** yyyy-mm-dd do dia destacado como selecionado */
  selectedIso?: string
  /** Badge opcional sob o número (ex.: contagem de agendamentos) */
  badgeByIso?: Map<string, React.ReactNode>
  /** Se retornar false, o dia aparece bloqueado e não dispara click */
  isDaySelectable: (day: Date) => boolean
  onDayPress?: (day: Date) => void
}

export function MonthCalendarGrid({
  monthAnchor,
  selectedIso,
  badgeByIso,
  isDaySelectable,
  onDayPress,
}: MonthCalendarGridProps) {
  const monthStart = startOfMonth(monthAnchor)
  const gridStart = startOfWeekMonday(monthStart)
  const cells = React.useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart])

  return (
    <>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const iso = toISODateString(d)
          const inMonth = d.getMonth() === monthAnchor.getMonth()
          const selectable = isDaySelectable(d)
          const isSelected = selectedIso !== undefined && selectedIso !== '' && iso === selectedIso

          const badge = badgeByIso?.get(iso)

          return (
            <button
              key={iso}
              type="button"
              disabled={!selectable}
              onClick={() => {
                if (!selectable) return
                onDayPress?.(d)
              }}
              aria-label={`Dia ${d.getDate()}`}
              className={cn(
                'flex min-h-[52px] flex-col items-center rounded-lg border p-1 text-sm transition-colors',
                !inMonth &&
                  !isSelected &&
                  'border-transparent bg-transparent text-[var(--color-muted-foreground)] opacity-50',
                inMonth &&
                  selectable &&
                  'border-[var(--color-border)] bg-[var(--color-muted)]/25 hover:bg-[var(--color-accent-soft)]/40',
                inMonth &&
                  !selectable &&
                  'cursor-not-allowed border-[var(--color-border)]/40 bg-[var(--color-muted)]/10 opacity-35',
                !inMonth && selectable && 'hover:bg-[var(--color-muted)]/20',
                isSelected &&
                  selectable &&
                  'border-[var(--color-accent-solid)] bg-[var(--color-accent-soft)] ring-2 ring-[var(--color-accent)]/30'
              )}
            >
              <span className={cn(!selectable && inMonth && 'line-through')}>{d.getDate()}</span>
              {badge != null && badge !== false && (
                <span className="mt-auto text-[10px] font-semibold">{badge}</span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
