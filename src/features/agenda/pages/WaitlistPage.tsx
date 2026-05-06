import { ArrowLeft, ListOrdered } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateWaitlistMutation,
  useDeleteWaitlistMutation,
  useUpdateWaitlistMutation,
  useWaitlistEnrichedQuery,
} from '@/features/agenda/hooks'
import {
  APPOINTMENT_TYPE_LABELS,
  WAITLIST_STATUS_LABELS,
  type AppointmentType,
  type WaitlistStatus,
} from '@/features/agenda/types'
import { useListDoctors } from '@/features/doctors/hooks'
import { listPatients } from '@/features/patients/api'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useAuth } from '@/features/auth/useAuth'
import { useQuery } from '@tanstack/react-query'

export function WaitlistPage() {
  const navigate = useNavigate()
  const { userInfo } = useAuth()
  const userId = userInfo?.user.id

  const doctorsQuery = useListDoctors({ active: true, pageSize: 200 })
  const doctors = doctorsQuery.data?.items ?? []

  const [doctorFilter, setDoctorFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<WaitlistStatus | 'all'>('waiting')

  const waitParams = React.useMemo(
    () => ({
      doctor_id: doctorFilter === 'all' ? undefined : doctorFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [doctorFilter, statusFilter]
  )

  const waitQuery = useWaitlistEnrichedQuery(waitParams)

  const [newDoctorId, setNewDoctorId] = React.useState('')
  const [winStart, setWinStart] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [winEnd, setWinEnd] = React.useState('')
  const [newType, setNewType] = React.useState<AppointmentType>('presencial')
  const [notes, setNotes] = React.useState('')
  const [patientQuery, setPatientQuery] = React.useState('')
  const debounced = useDebouncedValue(patientQuery, 320)
  const [patientId, setPatientId] = React.useState('')

  const patientsSearch = useQuery({
    queryKey: ['waitlist', 'patient-search', debounced],
    queryFn: () => listPatients({ search: debounced, pageSize: 15 }),
    enabled: debounced.trim().length >= 2,
  })

  const createMut = useCreateWaitlistMutation()
  const updateMut = useUpdateWaitlistMutation()
  const deleteMut = useDeleteWaitlistMutation()

  async function submitNew(e: React.FormEvent) {
    e.preventDefault()
    if (!newDoctorId || !patientId) {
      toast.error('Selecione médico e paciente.')
      return
    }
    try {
      await createMut.mutateAsync({
        doctor_id: newDoctorId,
        patient_id: patientId,
        window_start: winStart,
        window_end: winEnd.trim() ? winEnd : null,
        appointment_type: newType,
        notes: notes.trim() ? notes.trim() : null,
        created_by: userId ?? null,
      })
      toast.success('Paciente incluído na fila.')
      setNotes('')
      setPatientId('')
      setPatientQuery('')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível incluir na fila (RLS ou tabela `appointment_waitlist`).')
    }
  }

  const list = waitQuery.data ?? []
  const names = patientsSearch.data?.items.find((p) => p.id === patientId)?.full_name

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/app/agenda')}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à agenda
      </button>

      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Agenda
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Fila de espera</h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <ListOrdered className="h-3 w-3" />
            Atalho F na agenda
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Ordene ofertas de vagas por prioridade. Ao agendar na agenda com o mesmo paciente, marque o
          registro como convertido.
        </p>
      </header>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="font-display text-lg">Novo pedido</h2>
        <form onSubmit={submitNew} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Médico</Label>
            <Select value={newDoctorId} onValueChange={setNewDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Paciente</Label>
            <Input
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
              placeholder="Buscar nome ou CPF"
            />
            {patientId && (
              <p className="text-xs text-[var(--color-muted-foreground)]">Selecionado: {names}</p>
            )}
            {debounced.trim().length >= 2 && patientsSearch.data && (
              <ul className="max-h-36 overflow-auto rounded-md border border-[var(--color-border)] text-sm">
                {patientsSearch.data.items.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full px-3 py-2 text-left hover:bg-[var(--color-accent-soft)]/50"
                      onClick={() => {
                        setPatientId(p.id)
                        setPatientQuery(p.full_name)
                      }}
                    >
                      {p.full_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1">
            <Label>Data inicial desejada</Label>
            <Input type="date" value={winStart} onChange={(e) => setWinStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Até (opcional)</Label>
            <Input type="date" value={winEnd} onChange={(e) => setWinEnd(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tipo de consulta</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as AppointmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">{APPOINTMENT_TYPE_LABELS.presencial}</SelectItem>
                <SelectItem value="telemedicina">{APPOINTMENT_TYPE_LABELS.telemedicina}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={createMut.isPending}>
              Incluir na fila
            </Button>
          </div>
        </form>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Filtrar médico</Label>
          <Select value={doctorFilter} onValueChange={setDoctorFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as WaitlistStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(WAITLIST_STATUS_LABELS) as WaitlistStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {WAITLIST_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted-foreground)]">
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Paciente</th>
              <th className="p-3 font-medium">Médico</th>
              <th className="p-3 font-medium">Janela</th>
              <th className="p-3 font-medium">Tipo</th>
              <th className="p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {waitQuery.isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-[var(--color-muted-foreground)]">
                  Carregando…
                </td>
              </tr>
            )}
            {waitQuery.isError && (
              <tr>
                <td colSpan={6} className="p-6 text-amber-800">
                  Não foi possível carregar a fila. Execute a migração SQL e verifique RLS.
                </td>
              </tr>
            )}
            {!waitQuery.isLoading &&
              !waitQuery.isError &&
              list.map((row) => {
                const doc = doctors.find((d) => d.id === row.doctor_id)
                const typ = row.appointment_type ?? 'presencial'
                return (
                  <tr key={row.id} className="border-b border-[var(--color-border)]/70 last:border-0">
                    <td className="p-3">{WAITLIST_STATUS_LABELS[row.status]}</td>
                    <td className="p-3">{row.patient_name}</td>
                    <td className="p-3">{doc?.full_name ?? row.doctor_id}</td>
                    <td className="p-3 text-xs">
                      {row.window_start}
                      {row.window_end ? ` → ${row.window_end}` : ''}
                    </td>
                    <td className="p-3">{APPOINTMENT_TYPE_LABELS[typ]}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {row.status === 'waiting' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void updateMut.mutateAsync({
                                id: row.id,
                                payload: { status: 'offered' },
                              })
                            }
                          >
                            Ofertar
                          </Button>
                        )}
                        {(row.status === 'waiting' || row.status === 'offered') && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              void updateMut.mutateAsync({
                                id: row.id,
                                payload: { status: 'booked' },
                              })
                            }
                          >
                            Convertido
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void updateMut.mutateAsync({
                              id: row.id,
                              payload: { status: 'cancelled' },
                            })
                          }
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-[var(--color-destructive)]"
                          onClick={() => void deleteMut.mutateAsync(row.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
