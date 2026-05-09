import * as React from 'react'

import { MonthCalendarGrid } from '@/features/agenda/components/MonthCalendarGrid'
import type { EnrichedAppointment } from '@/features/agenda/types'
import { toISODateString } from '@/features/agenda/utils/calendar'
import { cn } from '@/lib/cn'

export interface CalendarMonthViewProps {
  monthAnchor: Date
  appointments: EnrichedAppointment[]
  onSelectDay?: (d: Date) => void
  /** Quando verdadeiro e `weekdayReady`, só permite escolher dias cujo weekday está em `availableWeekdays`. */
  weekdaysFilterActive?: boolean
  /** Deve ficar true após a primeira resposta da query de disponibilidade (sucesso ou vazio). */
  weekdayReady?: boolean
  /** Dias da semana JS (0 = domingo … 6 = sábado) com agenda ativa nos médicos selecionados. */
  availableWeekdays?: Set<number>
}

export function CalendarMonthView({
  monthAnchor,
  appointments,
  onSelectDay,
  weekdaysFilterActive = false,
  weekdayReady = false,
  availableWeekdays,
}: CalendarMonthViewProps) {
  const countsByDay = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const a of appointments) {
      const k = toISODateString(new Date(a.scheduled_at))
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const badgeByIso = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>()
    countsByDay.forEach((n, iso) => {
      if (n <= 0) return
      map.set(
        iso,
        <span className="mt-auto rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
          {n}
        </span>
      )
    })
    return map
  }, [countsByDay])

  const labelMonth = monthAnchor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const filterApplied = weekdaysFilterActive && weekdayReady && availableWeekdays !== undefined

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4',
        weekdaysFilterActive && weekdayReady && !availableWeekdays?.size && 'opacity-95'
      )}
    >
      <p className="mb-3 text-center font-display text-sm font-medium capitalize text-[var(--color-foreground)]">
        {labelMonth}
      </p>
      {weekdaysFilterActive && weekdayReady && availableWeekdays && !availableWeekdays.size ? (
        <p className="rounded-md bg-amber-50/90 px-2 py-2 text-center text-xs text-amber-950">
          Nenhum dia de disponibilidade cadastrado para a seleção atual. Os dias ficam bloqueados até você
          cadastrar horários nos perfis ou ajustar a seleção na barra lateral.
        </p>
      ) : (
        <>
          <MonthCalendarGrid
            monthAnchor={monthAnchor}
            isDaySelectable={(d) => {
              if (!filterApplied) return true
              const set = availableWeekdays!
              if (!set.size) return false
              return set.has(d.getDay())
            }}
            badgeByIso={badgeByIso}
            onDayPress={(d) => onSelectDay?.(d)}
          />
          {weekdaysFilterActive && !weekdayReady && (
            <p className="mt-2 text-center text-[10px] text-[var(--color-muted-foreground)]">
              Carregando dias com agenda disponível…
            </p>
          )}
        </>
      )}
    </div>
  )
}
