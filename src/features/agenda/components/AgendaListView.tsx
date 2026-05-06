import * as React from 'react'

import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  type EnrichedAppointment,
} from '@/features/agenda/types'
import { cn } from '@/lib/cn'

export interface AgendaListViewProps {
  appointments: EnrichedAppointment[]
  doctorNameById: Record<string, string>
  onSelectAppointment?: (a: EnrichedAppointment) => void
}

function statusBadge(status: AppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800'
    case 'requested':
      return 'bg-amber-100 text-amber-900'
    case 'completed':
      return 'bg-slate-100 text-slate-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-600'
    case 'no_show':
      return 'bg-rose-100 text-rose-900'
    default:
      return 'bg-[var(--color-muted)]'
  }
}

export function AgendaListView({
  appointments,
  doctorNameById,
  onSelectAppointment,
}: AgendaListViewProps) {
  const sorted = React.useMemo(
    () => [...appointments].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [appointments]
  )

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Horário</th>
            <th className="px-4 py-3">Paciente</th>
            <th className="px-4 py-3">Profissional</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-muted-foreground)]">
                Nenhum agendamento no período.
              </td>
            </tr>
          )}
          {sorted.map((a) => {
            const start = new Date(a.scheduled_at)
            const dur = a.duration_minutes ?? 30
            const end = new Date(start.getTime() + dur * 60_000)
            return (
              <tr
                key={a.id}
                className={cn(
                  'cursor-pointer border-b border-[var(--color-border)]/80 transition-colors hover:bg-[var(--color-accent-soft)]/35'
                )}
                onClick={() => onSelectAppointment?.(a)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  {start.toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 font-medium">{a.patient_name}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                  {doctorNameById[a.doctor_id] ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                      statusBadge(a.status)
                    )}
                  >
                    {APPOINTMENT_STATUS_LABELS[a.status]}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
