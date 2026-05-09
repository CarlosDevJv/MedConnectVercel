import * as React from 'react'

import type { AppointmentStatus, EnrichedAppointment } from '@/features/agenda/types'
import {
  formatDayMonth,
  formatWeekdayShort,
  GRID_SLOT_MINUTES,
  minutesSinceMidnight,
  toISODateString,
} from '@/features/agenda/utils/calendar'
import { formatHourMarkPtBr, formatTimePtBr } from '@/lib/formatTimePtBr'
import { cn } from '@/lib/cn'

const ROW_PX = 22

function statusClasses(status: AppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'border-emerald-300/80 bg-emerald-100/85 text-emerald-950'
    case 'requested':
      return 'border-amber-300/80 bg-amber-50/95 text-amber-950'
    case 'completed':
      return 'border-slate-200 bg-slate-100/90 text-slate-800'
    case 'cancelled':
      return 'border-gray-200 bg-gray-100/80 text-gray-500 line-through opacity-75'
    case 'no_show':
      return 'border-rose-300/80 bg-rose-100/90 text-rose-950'
    default:
      return 'border-[var(--color-border)] bg-[var(--color-muted)]'
  }
}

function statusDotClass(status: AppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-500'
    case 'requested':
      return 'bg-amber-500'
    case 'completed':
      return 'bg-slate-400'
    case 'cancelled':
      return 'bg-gray-400'
    case 'no_show':
      return 'bg-rose-500'
    default:
      return 'bg-[var(--color-accent)]'
  }
}

export interface CalendarDayViewProps {
  day: Date
  dayStartHour: number
  dayEndHour: number
  appointments: EnrichedAppointment[]
  doctorNameById: Record<string, string>
  calendarRef?: React.RefObject<HTMLElement | null>
  onSelectAppointment?: (a: EnrichedAppointment) => void
}

export function CalendarDayView({
  day,
  dayStartHour,
  dayEndHour,
  appointments,
  doctorNameById,
  calendarRef,
  onSelectAppointment,
}: CalendarDayViewProps) {
  const iso = toISODateString(day)
  const startMin = dayStartHour * 60
  const endMin = dayEndHour * 60
  const totalSlots = Math.ceil((endMin - startMin) / GRID_SLOT_MINUTES)
  const gridHeight = totalSlots * ROW_PX
  const columnAppts = appointments.filter((a) => toISODateString(new Date(a.scheduled_at)) === iso)

  return (
    <div
      ref={calendarRef as React.RefObject<HTMLDivElement | null>}
      tabIndex={0}
      className="flex min-h-[420px] flex-1 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30"
    >
      <div
        className="flex shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-muted)]/40"
        style={{ width: 52 }}
      >
        <div className="h-11 shrink-0 border-b border-[var(--color-border)]" />
        {Array.from({ length: totalSlots }, (_, i) => {
          const m = startMin + i * GRID_SLOT_MINUTES
          const h = Math.floor(m / 60)
          const mm = m % 60
          const label = mm === 0 ? formatHourMarkPtBr(h, 0) : ''
          return (
            <div
              key={i}
              style={{ height: ROW_PX }}
              className="border-b border-[var(--color-border)]/60 pr-1 text-right text-[10px] leading-[22px] text-[var(--color-muted-foreground)]"
            >
              {label}
            </div>
          )
        })}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex h-11 shrink-0 flex-col items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-muted)]/25 px-2">
          <span className="text-[11px] font-medium capitalize text-[var(--color-muted-foreground)]">
            {formatWeekdayShort(day)}
          </span>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            {formatDayMonth(day)}
          </span>
        </div>
        <div className="relative" style={{ height: gridHeight }}>
          {Array.from({ length: totalSlots }, (_, i) => (
            <div
              key={i}
              className="border-b border-[var(--color-border)]/40"
              style={{ height: ROW_PX }}
            />
          ))}
          {columnAppts.map((a) => {
            const start = new Date(a.scheduled_at)
            const mins = minutesSinceMidnight(start)
            const rel = mins - startMin
            if (rel < 0 || rel >= endMin - startMin) return null
            const dur = a.duration_minutes ?? 30
            const top = (rel / GRID_SLOT_MINUTES) * ROW_PX
            const h = (dur / GRID_SLOT_MINUTES) * ROW_PX
            const docName = doctorNameById[a.doctor_id] ?? 'Profissional'
            const end = new Date(start.getTime() + dur * 60_000)
            const timeRange = `${formatTimePtBr(start)} – ${formatTimePtBr(end)}`

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelectAppointment?.(a)}
                className={cn(
                  'absolute left-2 right-2 flex flex-col gap-0.5 rounded-lg border px-2 py-1.5 text-left shadow-sm transition-transform hover:z-10 hover:scale-[1.01] hover:shadow-md',
                  statusClasses(a.status)
                )}
                style={{ top, height: Math.max(h, ROW_PX * 1.5) }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(a.status))}
                  />
                  <span className="truncate text-[12px] font-semibold">{a.patient_name}</span>
                </div>
                <span className="truncate text-[11px] opacity-80">{timeRange}</span>
                <span className="truncate text-[11px] opacity-70">{docName}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
