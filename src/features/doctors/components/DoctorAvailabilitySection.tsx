import { Clock, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  useCreateDoctorAvailabilityMutation,
  useDeleteDoctorAvailabilityMutation,
  useDoctorAvailabilityListQuery,
  useUpdateDoctorAvailabilityMutation,
} from '@/features/agenda/hooks'
import { APPOINTMENT_TYPE_LABELS, type AppointmentType } from '@/features/agenda/types'

const WEEKDAY_ROWS = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
]

export interface DoctorAvailabilitySectionProps {
  doctorId: string
}

export function DoctorAvailabilitySection({ doctorId }: DoctorAvailabilitySectionProps) {
  const listQuery = useDoctorAvailabilityListQuery(doctorId)
  const createMut = useCreateDoctorAvailabilityMutation()
  const updateMut = useUpdateDoctorAvailabilityMutation()
  const deleteMut = useDeleteDoctorAvailabilityMutation()

  const [weekday, setWeekday] = React.useState(1)
  const [startTime, setStartTime] = React.useState('08:00')
  const [endTime, setEndTime] = React.useState('12:00')
  const [slotMinutes, setSlotMinutes] = React.useState(30)
  const [appType, setAppType] = React.useState<AppointmentType>('presencial')
  const [activeNew, setActiveNew] = React.useState(true)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createMut.mutateAsync({
        doctor_id: doctorId,
        weekday,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        slot_minutes: slotMinutes,
        appointment_type: appType,
        active: activeNew,
      })
      toast.success('Faixa de disponibilidade adicionada.')
      void listQuery.refetch()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível salvar. Verifique os horários e permissões.')
    }
  }

  async function toggleActive(id: string, doctorIdForQ: string, next: boolean) {
    try {
      await updateMut.mutateAsync({
        id,
        doctorId: doctorIdForQ,
        payload: { active: next },
      })
      toast.success(next ? 'Registro ativado.' : 'Registro desativado.')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível atualizar.')
    }
  }

  async function remove(id: string, doctorIdForQ: string) {
    try {
      await deleteMut.mutateAsync({ id, doctorId: doctorIdForQ })
      toast.success('Removido.')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível excluir.')
    }
  }

  const rows = listQuery.data ?? []

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <Clock className="h-4 w-4" aria-hidden />
        Disponibilidade na agenda
      </div>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
        Grade semanal usada pela função de slots (Supabase). Ajuste conforme a clínica; exceções e
        bloqueios ficam na própria agenda.
      </p>

      {listQuery.isError && (
        <p className="mb-3 text-sm text-amber-800">
          Não foi possível carregar a disponibilidade (tabela `doctor_availability` ou permissões).
        </p>
      )}

      <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded-lg border border-dashed border-[var(--color-border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <Label>Dia da semana</Label>
          <Select value={String(weekday)} onValueChange={(v) => setWeekday(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAY_ROWS.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Início</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Fim</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Slot (min)</Label>
          <Input
            type="number"
            min={5}
            max={180}
            step={5}
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={appType} onValueChange={(v) => setAppType(v as AppointmentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">{APPOINTMENT_TYPE_LABELS.presencial}</SelectItem>
              <SelectItem value="telemedicina">{APPOINTMENT_TYPE_LABELS.telemedicina}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-1">
          <Checkbox checked={activeNew} onCheckedChange={(v) => setActiveNew(v === true)} />
          Ativo
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <Button type="submit" size="sm" className="gap-1" loading={createMut.isPending}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar faixa
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted-foreground)]">
              <th className="py-2 pr-2 font-medium">Dia</th>
              <th className="py-2 pr-2 font-medium">Intervalo</th>
              <th className="py-2 pr-2 font-medium">Slot</th>
              <th className="py-2 pr-2 font-medium">Tipo</th>
              <th className="py-2 pr-2 font-medium">Ativo</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={6} className="py-6 text-[var(--color-muted-foreground)]">
                  Carregando…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-[var(--color-muted-foreground)]">
                  Nenhuma faixa cadastrada. Adicione ao menos uma para gerar horários livres.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const dayLabel = WEEKDAY_ROWS.find((w) => w.id === r.weekday)?.label ?? `Dia ${r.weekday}`
              const typ = r.appointment_type ?? 'presencial'
              return (
                <tr key={r.id} className="border-b border-[var(--color-border)]/70 last:border-0">
                  <td className="py-2 pr-2">{dayLabel}</td>
                  <td className="py-2 pr-2 font-mono text-xs">
                    {(r.start_time ?? '').slice(0, 5)} – {(r.end_time ?? '').slice(0, 5)}
                  </td>
                  <td className="py-2 pr-2">{r.slot_minutes ?? '—'}</td>
                  <td className="py-2 pr-2">{APPOINTMENT_TYPE_LABELS[typ]}</td>
                  <td className="py-2 pr-2">
                    <Checkbox
                      checked={r.active !== false}
                      onCheckedChange={(v) => void toggleActive(r.id, doctorId, v === true)}
                    />
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-[var(--color-destructive)] hover:bg-red-50"
                      onClick={() => void remove(r.id, doctorId)}
                      aria-label="Excluir faixa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
