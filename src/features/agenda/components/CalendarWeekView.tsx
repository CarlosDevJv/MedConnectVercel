import * as React from 'react'

import type { AppointmentStatus, EnrichedAppointment } from '@/features/agenda/types'
import {
  eachDayInWeek,
  formatDayMonth,
  formatWeekdayShort,
  GRID_SLOT_MINUTES,
  minutesSinceMidnight,
  toISODateString,
} from '@/features/agenda/utils/calendar'
import { formatHourMarkPtBr, formatTimePtBr } from '@/lib/formatTimePtBr'
import { cn } from '@/lib/cn'

const ROW_PX = 22

const DOCTOR_COLORS = [
  '#2563eb', // blue-600
  '#7c3aed', // purple-600
  '#db2777', // pink-600
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#e11d48', // rose-600
]

function getDoctorColor(doctorId: string): string {
  let hash = 0
  for (let i = 0; i < doctorId.length; i++) {
    hash = doctorId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % DOCTOR_COLORS.length
  return DOCTOR_COLORS[index]
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

export interface CalendarWeekViewProps {
  weekStart: Date
  dayStartHour: number
  dayEndHour: number
  appointments: EnrichedAppointment[]
  doctorNameById: Record<string, string>
  calendarRef?: React.RefObject<HTMLElement | null>
  onSelectAppointment?: (a: EnrichedAppointment) => void
  /** Quando há médicos na agenda e dados carregados, colunas sem weekday na disponibilidade ficam menos destacadas. */
  weekdaysFilterActive?: boolean
  weekdayReady?: boolean
  availableWeekdays?: Set<number>
}

export function CalendarWeekView({
  weekStart,
  dayStartHour,
  dayEndHour,
  appointments,
  doctorNameById,
  calendarRef,
  onSelectAppointment,
  weekdaysFilterActive = false,
  weekdayReady = false,
  availableWeekdays,
}: CalendarWeekViewProps) {
  const days = React.useMemo(() => eachDayInWeek(weekStart), [weekStart])
  const startMin = dayStartHour * 60
  const endMin = dayEndHour * 60
  const totalSlots = Math.ceil((endMin - startMin) / GRID_SLOT_MINUTES)
  const gridHeight = totalSlots * ROW_PX

  return (
    <div
      ref={calendarRef as React.RefObject<HTMLDivElement | null>}
      tabIndex={0}
      className="flex min-w-[720px] flex-1 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30"
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

      <div className="flex min-w-0 flex-1">
        {days.map((day) => {
          const iso = toISODateString(day)
          const columnAppts = appointments.filter((a) => {
            const d = new Date(a.scheduled_at)
            return toISODateString(d) === iso
          })

          const filterOn =
            weekdaysFilterActive &&
            weekdayReady &&
            availableWeekdays !== undefined &&
            availableWeekdays.size > 0
          const colMuted = filterOn && !availableWeekdays.has(day.getDay())

          // Interface para os itens de layout (individual ou agrupado)
          interface LayoutItem {
            id: string
            scheduled_at: string
            duration_minutes: number
            appointments: EnrichedAppointment[]
            isGroup: boolean
          }

          // Agrupar por horário exato
          const apptsByTime = React.useMemo(() => {
            const groups: Record<string, EnrichedAppointment[]> = {}
            columnAppts.forEach((a) => {
              const key = a.scheduled_at
              if (!groups[key]) groups[key] = []
              groups[key].push(a)
            })
            return groups
          }, [columnAppts])

          const layoutItems = React.useMemo(() => {
            const items: LayoutItem[] = []
            Object.entries(apptsByTime).forEach(([timeKey, list]) => {
              if (list.length > 3) {
                const maxDuration = Math.max(...list.map((a) => a.duration_minutes ?? 30))
                items.push({
                  id: `group-${timeKey}`,
                  scheduled_at: timeKey,
                  duration_minutes: maxDuration,
                  appointments: list,
                  isGroup: true,
                })
              } else {
                list.forEach((appt) => {
                  items.push({
                    id: appt.id,
                    scheduled_at: appt.scheduled_at,
                    duration_minutes: appt.duration_minutes ?? 30,
                    appointments: [appt],
                    isGroup: false,
                  })
                })
              }
            })
            return items.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          }, [apptsByTime])

          const virtualCols: LayoutItem[][] = []
          const itemToColIndex = new Map<string, number>()

          layoutItems.forEach((item) => {
            const start = new Date(item.scheduled_at).getTime()
            const dur = item.duration_minutes
            const end = start + dur * 60_000

            let colIndex = 0
            while (true) {
              if (!virtualCols[colIndex]) {
                virtualCols[colIndex] = []
              }
              const hasCollision = virtualCols[colIndex].some((other) => {
                const otherStart = new Date(other.scheduled_at).getTime()
                const otherDur = other.duration_minutes
                const otherEnd = otherStart + otherDur * 60_000
                return start < otherEnd && end > otherStart
              })
              if (!hasCollision) {
                virtualCols[colIndex].push(item)
                itemToColIndex.set(item.id, colIndex)
                break
              }
              colIndex++
            }
          })

          const getItemLayout = (item: LayoutItem) => {
            const colIndex = itemToColIndex.get(item.id) ?? 0
            const start = new Date(item.scheduled_at).getTime()
            const dur = item.duration_minutes
            const end = start + dur * 60_000

            const overlappingCols = new Set<number>()
            overlappingCols.add(colIndex)

            virtualCols.forEach((col, idx) => {
              col.forEach((other) => {
                if (other.id === item.id) return
                const otherStart = new Date(other.scheduled_at).getTime()
                const otherDur = other.duration_minutes
                const otherEnd = otherStart + otherDur * 60_000
                if (start < otherEnd && end > otherStart) {
                  overlappingCols.add(idx)
                }
              })
            })

            const totalCols = overlappingCols.size
            const sortedCols = Array.from(overlappingCols).sort((a, b) => a - b)
            const relativeIdx = sortedCols.indexOf(colIndex)

            const widthPct = 100 / totalCols
            const leftPct = widthPct * relativeIdx

            return {
              left: `calc(${leftPct}% + 4px)`,
              width: `calc(${widthPct}% - 8px)`,
            }
          }

          return (
            <div
              key={iso}
              className={cn(
                'relative min-w-[100px] flex-1 border-r border-[var(--color-border)] last:border-r-0',
                colMuted && 'bg-[var(--color-muted)]/10 opacity-[0.88]'
              )}
            >
              <div className="flex h-11 shrink-0 flex-col items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-muted)]/25 px-1">
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

                {layoutItems.map((item) => {
                  const start = new Date(item.scheduled_at)
                  const mins = minutesSinceMidnight(start)
                  const rel = mins - startMin
                  if (rel < 0 || rel >= endMin - startMin) return null
                  const dur = item.duration_minutes
                  const top = (rel / GRID_SLOT_MINUTES) * ROW_PX
                  const h = (dur / GRID_SLOT_MINUTES) * ROW_PX
                  const end = new Date(start.getTime() + dur * 60_000)
                  const timeRange = `${formatTimePtBr(start)} – ${formatTimePtBr(end)}`
                  const layout = getItemLayout(item)

                  if (item.isGroup) {
                    return (
                      <div
                        key={item.id}
                        className="absolute flex flex-col gap-1 rounded-lg border border-purple-300 bg-purple-50/95 text-purple-950 px-1.5 py-1 text-left shadow-sm overflow-y-auto"
                        style={{
                          top,
                          height: Math.max(h, ROW_PX * 2.5),
                          left: layout.left,
                          width: layout.width,
                          borderLeftWidth: '4px',
                          borderLeftColor: '#7c3aed'
                        }}
                      >
                        <div className="flex items-center gap-1 border-b border-purple-200 pb-0.5 mb-0.5 shrink-0">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase truncate">
                            {item.appointments.length} Consultas
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 pr-0.5">
                          {item.appointments.map((a) => {
                            const docColor = getDoctorColor(a.doctor_id)
                            const docName = doctorNameById[a.doctor_id] ?? 'Profissional'
                            const isCancelled = a.status === 'cancelled'
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => onSelectAppointment?.(a)}
                                className={cn(
                                  "flex flex-col text-left rounded px-1 py-0.5 text-[10px] border border-purple-150 hover:bg-purple-100 transition-colors w-full cursor-pointer",
                                  isCancelled && 'opacity-60'
                                )}
                              >
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className={cn('h-1 w-1 shrink-0 rounded-full', statusDotClass(a.status))} />
                                  <span className={cn("font-semibold truncate leading-tight", isCancelled && "line-through")}>
                                    {a.patient_name}
                                  </span>
                                </div>
                                <span className="text-[8px] font-medium opacity-80 truncate" style={{ color: docColor }}>
                                  {docName}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } else {
                    const a = item.appointments[0]
                    const docName = doctorNameById[a.doctor_id] ?? 'Profissional'
                    const docColor = getDoctorColor(a.doctor_id)
                    const isCancelled = a.status === 'cancelled'

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onSelectAppointment?.(a)}
                        className={cn(
                          'absolute flex flex-col gap-0.5 rounded-lg border px-1.5 py-1 text-left shadow-sm transition-transform hover:z-10 hover:scale-[1.02] hover:shadow-md',
                          isCancelled
                            ? 'bg-slate-300 border-slate-400 text-slate-700 opacity-85'
                            : 'bg-amber-100/95 border-amber-300 text-amber-950'
                        )}
                        style={{
                          top,
                          height: Math.max(h, ROW_PX * 1.5),
                          left: layout.left,
                          width: layout.width,
                          borderLeftWidth: '4px',
                          borderLeftColor: docColor
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-h-0">
                          <span
                            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(a.status))}
                          />
                          <span className={cn('truncate text-[11px] font-semibold leading-tight', isCancelled && 'line-through')}>
                            {a.patient_name}
                          </span>
                        </div>
                        <span className="truncate text-[10px] opacity-80">{timeRange}</span>
                        <span className="truncate text-[10px] font-medium opacity-90" style={{ color: docColor }}>
                          {docName}
                        </span>
                      </button>
                    )
                  }
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
