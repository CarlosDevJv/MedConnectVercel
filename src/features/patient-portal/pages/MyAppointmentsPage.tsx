import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  type AppointmentType,
  type AppointmentStatus,
} from '@/features/agenda/types'
import { friendlyPortalLoadError } from '@/features/patient-portal/friendlyPortalLoadError'
import {
  usePatientPortalAppointmentsQuery,
  useResolvedPatientId,
  type PatientPortalAppointment,
} from '@/features/patient-portal/hooks'
import { formatDateTimePtBr, formatTimePtBr } from '@/lib/formatTimePtBr'
import { cn } from '@/lib/cn'
import * as React from 'react'
import { Calendar } from 'lucide-react'

function statusBadgeClass(status: AppointmentStatus): string {
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

function resolveType(a: PatientPortalAppointment): AppointmentType {
  return a.appointment_type === 'telemedicina' ? 'telemedicina' : 'presencial'
}

export function MyAppointmentsPage() {
  const patientId = useResolvedPatientId()
  const query = usePatientPortalAppointmentsQuery(patientId)

  const [detail, setDetail] = React.useState<PatientPortalAppointment | null>(null)

  const sorted = React.useMemo(() => {
    const list = [...(query.data ?? [])]
    list.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    return list
  }, [query.data])

  if (!patientId) {
    return (
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Meus agendamentos</h1>
          <p className="mt-3 text-sm text-rose-600">
            Cadastro de paciente não encontrado para esta conta de acesso.
          </p>
        </header>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <header className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Calendar className="h-5 w-5" />
        </span>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Meus agendamentos</h1>
      </header>

      {query.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />
      ) : query.isError ? (
        <p className="text-sm text-rose-600">{friendlyPortalLoadError(query.error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e hora</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-[var(--color-muted-foreground)]">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((a) => {
                const start = new Date(a.scheduled_at)
                const dur = a.duration_minutes ?? 30
                const end = new Date(start.getTime() + dur * 60_000)
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-[var(--color-accent-soft)]/30"
                    onClick={() => setDetail(a)}
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatDateTimePtBr(a.scheduled_at)}{' '}
                      <span className="text-[var(--color-muted-foreground)]">
                        ({formatTimePtBr(start)} – {formatTimePtBr(end)})
                      </span>
                    </TableCell>
                    <TableCell>{a.doctor_name}</TableCell>
                    <TableCell>{APPOINTMENT_TYPE_LABELS[resolveType(a)]}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                          statusBadgeClass(a.status)
                        )}
                      >
                        {APPOINTMENT_STATUS_LABELS[a.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do agendamento</DialogTitle>
          </DialogHeader>
          {detail ? (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">Quando</dt>
                <dd className="mt-0.5 text-[var(--color-foreground)]">{formatDateTimePtBr(detail.scheduled_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">
                  Profissional
                </dt>
                <dd className="mt-0.5 text-[var(--color-foreground)]">{detail.doctor_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">Modalidade</dt>
                <dd className="mt-0.5 text-[var(--color-foreground)]">
                  {APPOINTMENT_TYPE_LABELS[resolveType(detail)]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">Status</dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                      statusBadgeClass(detail.status)
                    )}
                  >
                    {APPOINTMENT_STATUS_LABELS[detail.status]}
                  </span>
                </dd>
              </div>
              {detail.notes ? (
                <div className="md:col-span-2">
                  <dt className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">
                    Observações
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[var(--color-foreground)]">{detail.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
