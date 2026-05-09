import { CalendarClock, MessageSquareText, RefreshCw } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isSmsServiceDisabled, sendSms } from '@/features/communications/api'
import { toE164Preferred } from '@/features/communications/utils/phone'
import { AppointmentAvailabilityDatePicker } from '@/features/agenda/components/AppointmentAvailabilityDatePicker'
import {
  useResolvedAppointmentFormSlots,
  useUpdateAppointmentMutation,
} from '@/features/agenda/hooks'
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  type Appointment,
  type AppointmentType,
  type EnrichedAppointment,
} from '@/features/agenda/types'
import { findFirstAvailableSlot } from '@/features/agenda/utils/firstAvailableSlot'
import { combineDateAndTime, toISODateString } from '@/features/agenda/utils/calendar'
import { getPatient } from '@/features/patients/api'
import { PREFERRED_CONTACT_LABELS, type PreferredContact } from '@/features/patients/types'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import {
  formatDateTimePtBr,
  formatPostgresLocalTimePtBr,
  formatTimePtBr,
} from '@/lib/formatTimePtBr'

export interface AppointmentDetailDialogProps {
  appointment: EnrichedAppointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  doctorName?: string
  onAppointmentUpdated?: (a: EnrichedAppointment) => void
}

function resolveAppointmentType(a: EnrichedAppointment): AppointmentType {
  return a.appointment_type === 'telemedicina' ? 'telemedicina' : 'presencial'
}

function shouldOfferSmsReminder(preferred?: PreferredContact | null): boolean {
  if (!preferred) return true
  return preferred === 'sms' || preferred === 'phone' || preferred === 'whatsapp'
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  doctorName,
  onAppointmentUpdated,
}: AppointmentDetailDialogProps) {
  const updateMut = useUpdateAppointmentMutation()

  const [notesDraft, setNotesDraft] = React.useState('')
  const [typeDraft, setTypeDraft] = React.useState<AppointmentType>('presencial')
  const [reminderEnabled, setReminderEnabled] = React.useState(true)

  const [rescheduleDate, setRescheduleDate] = React.useState('')
  const [rescheduleTime, setRescheduleTime] = React.useState('')
  const [patientContact, setPatientContact] = React.useState<PreferredContact | null>(null)
  const [patientPhone, setPatientPhone] = React.useState('')

  const [autoBusy, setAutoBusy] = React.useState(false)
  const [smsBusy, setSmsBusy] = React.useState(false)

  React.useEffect(() => {
    if (!appointment || !open) return
    setNotesDraft(appointment.notes ?? '')
    setTypeDraft(resolveAppointmentType(appointment))
    setReminderEnabled(appointment.reminder_enabled !== false)
    const d = new Date(appointment.scheduled_at)
    setRescheduleDate(toISODateString(d))
    setRescheduleTime('')
  }, [appointment, open])

  React.useEffect(() => {
    if (!appointment || !open) return
    let cancelled = false
    void (async () => {
      try {
        const p = await getPatient(appointment.patient_id)
        if (cancelled) return
        setPatientContact((p.preferred_contact as PreferredContact | null) ?? null)
        setPatientPhone(p.phone_mobile ?? '')
      } catch {
        if (!cancelled) {
          setPatientContact(null)
          setPatientPhone('')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointment?.patient_id, open])

  const canAct = !!(
    appointment &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed'
  )
  const { slotItems, slotsLoading, slotsError } = useResolvedAppointmentFormSlots({
    sheetOpen: open,
    calendarEnabled: canAct,
    doctorId: appointment?.doctor_id,
    dateISO: rescheduleDate,
    appointmentType: typeDraft,
  })

  React.useEffect(() => {
    if (!rescheduleTime) return
    if (!slotItems.some((s) => s.time === rescheduleTime)) {
      setRescheduleTime('')
    }
  }, [slotItems, rescheduleTime])

  function patchLocal(row: Appointment) {
    if (!appointment) return
    onAppointmentUpdated?.({
      ...row,
      patient_name: appointment.patient_name,
      doctor_name: appointment.doctor_name,
    })
  }

  async function persistFields(partial: {
    notes?: string | null
    appointment_type?: AppointmentType | null
    reminder_enabled?: boolean
  }) {
    if (!appointment) return
    try {
      const row = await updateMut.mutateAsync({ id: appointment.id, payload: partial })
      toast.success('Alterações salvas.')
      patchLocal(row)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível salvar.')
    }
  }

  async function handleStatus(status: 'confirmed' | 'completed' | 'cancelled' | 'no_show') {
    if (!appointment) return
    try {
      const row = await updateMut.mutateAsync({ id: appointment.id, payload: { status } })
      toast.success('Status atualizado.')
      patchLocal(row)
      if (status === 'cancelled') onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível atualizar o status.')
    }
  }

  async function applyReschedule() {
    if (!appointment || !rescheduleTime) {
      toast.error('Selecione data e horário válidos.')
      return
    }
    const scheduled_at = combineDateAndTime(rescheduleDate, rescheduleTime)
    try {
      const row = await updateMut.mutateAsync({ id: appointment.id, payload: { scheduled_at } })
      toast.success('Consulta reagendada.')
      patchLocal(row)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível reagendar.')
    }
  }

  async function applyAutoReschedule() {
    if (!appointment) return
    setAutoBusy(true)
    try {
      const slot = await findFirstAvailableSlot({
        doctorId: appointment.doctor_id,
        appointmentType: typeDraft,
        fromDate: new Date(),
        maxDays: 21,
        excludeAppointmentId: appointment.id,
      })
      if (!slot?.scheduled_at) {
        toast.error('Nenhum horário livre encontrado no período.')
        return
      }
      const row = await updateMut.mutateAsync({
        id: appointment.id,
        payload: { scheduled_at: slot.scheduled_at },
      })
      toast.success('Reagendado automaticamente para o próximo horário disponível.')
      patchLocal(row)
    } catch (e) {
      console.error(e)
      toast.error('Falha no reagendamento automático.')
    } finally {
      setAutoBusy(false)
    }
  }

  async function sendReminderNow() {
    if (!appointment) return
    const digits = stripNonDigits(patientPhone)
    if (digits.length < 10) {
      toast.error('Cadastre um telefone celular válido no paciente para SMS.')
      return
    }
    if (!shouldOfferSmsReminder(patientContact)) {
      toast.message('Preferência do paciente não é SMS; envio permitido manualmente.', {
        description: 'Confirme com o paciente antes de usar outro canal.',
      })
    }
    const when = formatDateTimePtBr(appointment.scheduled_at)
    const who = appointment.patient_name ?? 'Paciente'
    const doc = doctorName ?? 'seu profissional'
    const body = `Olá ${who}, lembrete: consulta em ${when} com ${doc}. MediConnect.`
    setSmsBusy(true)
    try {
      await sendSms({
        phone_number: toE164Preferred(patientPhone),
        patient_id: appointment.patient_id,
        message: body.slice(0, 1000),
      })
      const row = await updateMut.mutateAsync({
        id: appointment.id,
        payload: { last_reminder_sent_at: new Date().toISOString() },
      })
      toast.success('SMS de lembrete enviado.')
      patchLocal(row)
    } catch (e) {
      if (isSmsServiceDisabled(e)) {
        toast.error('SMS indisponível no servidor (503).')
        return
      }
      console.error(e)
      toast.error('Falha ao enviar SMS.')
    } finally {
      setSmsBusy(false)
    }
  }

  async function handleCancel() {
    if (!appointment) return
    try {
      await updateMut.mutateAsync({ id: appointment.id, payload: { status: 'cancelled' } })
      toast.success('Agendamento cancelado.')
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível cancelar.')
    }
  }

  if (!appointment) return null

  const start = new Date(appointment.scheduled_at)
  const dur = appointment.duration_minutes ?? 30
  const end = new Date(start.getTime() + dur * 60_000)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[520px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Detalhes do agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            <span className="text-[var(--color-muted-foreground)]">Paciente:</span>{' '}
            <span className="font-medium">{appointment.patient_name}</span>
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Profissional:</span>{' '}
            <span className="font-medium">{doctorName ?? '—'}</span>
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Quando:</span>{' '}
            {formatDateTimePtBr(start)} – {formatTimePtBr(end)}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Status:</span>{' '}
            {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </p>

          <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-3">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Contato do paciente</p>
            <p className="text-xs">
              Preferência:{' '}
              {patientContact
                ? PREFERRED_CONTACT_LABELS[patientContact]
                : 'Não informada'}
            </p>
            <p className="font-mono text-xs">{patientPhone || '—'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appt_type">Tipo de consulta</Label>
            <Select
              value={typeDraft}
              onValueChange={(v) => {
                const t = v as AppointmentType
                setTypeDraft(t)
                void persistFields({ appointment_type: t })
              }}
              disabled={!canAct || updateMut.isPending}
            >
              <SelectTrigger id="appt_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">{APPOINTMENT_TYPE_LABELS.presencial}</SelectItem>
                <SelectItem value="telemedicina">{APPOINTMENT_TYPE_LABELS.telemedicina}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appt_notes">Observações da consulta</Label>
            <textarea
              id="appt_notes"
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                const trimmed = notesDraft.trim()
                const prev = (appointment.notes ?? '').trim()
                if (trimmed === prev) return
                void persistFields({ notes: trimmed ? trimmed : null })
              }}
              disabled={!canAct || updateMut.isPending}
              className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
              placeholder="Anotações visíveis na equipe de agenda…"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              checked={reminderEnabled}
              onCheckedChange={(v) => {
                const next = v === true
                setReminderEnabled(next)
                void persistFields({ reminder_enabled: next })
              }}
              disabled={!canAct || updateMut.isPending}
            />
            <span>Lembretes automáticos por SMS (24h antes, quando o serviço estiver ativo)</span>
          </label>

          {appointment.last_reminder_sent_at && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Último SMS registrado em{' '}
              {formatDateTimePtBr(appointment.last_reminder_sent_at)}
            </p>
          )}

          {canAct && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                loading={smsBusy}
                onClick={() => void sendReminderNow()}
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                Enviar lembrete por SMS agora
              </Button>
            </div>
          )}

          {canAct && (
            <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <CalendarClock className="h-3.5 w-3.5" />
                Reagendar
              </p>
              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <Label htmlFor="reschedule-date-picker">Nova data</Label>
                  <AppointmentAvailabilityDatePicker
                    doctorId={appointment?.doctor_id}
                    appointmentType={typeDraft}
                    value={rescheduleDate}
                    onChange={setRescheduleDate}
                    disabled={!canAct}
                    additionallyAllowedDatesIso={
                      appointment ? [toISODateString(new Date(appointment.scheduled_at))] : undefined
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reschedule-time">Horário (24 h)</Label>
                  <Select
                    value={rescheduleTime}
                    onValueChange={setRescheduleTime}
                    disabled={slotsLoading}
                  >
                    <SelectTrigger id="reschedule-time">
                      <SelectValue placeholder={slotsLoading ? 'Carregando…' : 'Escolha o horário'} />
                    </SelectTrigger>
                    <SelectContent>
                      {slotItems.map((s) => (
                        <SelectItem key={`${s.datetime ?? s.date ?? ''}-${s.time}`} value={s.time}>
                          {formatPostgresLocalTimePtBr(s.time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!slotsLoading && slotItems.length === 0 && rescheduleDate && (
                    <p
                      className={
                        slotsError ? 'text-xs text-amber-800' : 'text-xs text-[var(--color-muted-foreground)]'
                      }
                    >
                      {slotsError
                        ? 'Serviço de slots indisponível e sem horários pela disponibilidade cadastrada nesta data.'
                        : 'Nenhum horário livre nesta data para o tipo selecionado.'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="sm"
                  loading={updateMut.isPending}
                  onClick={() => void applyReschedule()}
                >
                  Aplicar novo horário
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  loading={autoBusy}
                  onClick={() => void applyAutoReschedule()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Próximo horário livre (automático)
                </Button>
              </div>
              <p className="text-[11px] text-[var(--color-muted-foreground)]">
                O reagendamento automático usa só a disponibilidade cadastrada do médico nos próximos 21 dias para o tipo{' '}
                {APPOINTMENT_TYPE_LABELS[typeDraft]}, respeitando horários já ocupados.
              </p>
            </div>
          )}

          {canAct && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
              {appointment.status === 'requested' && (
                <Button type="button" size="sm" onClick={() => void handleStatus('confirmed')}>
                  Confirmar
                </Button>
              )}
              {(appointment.status === 'requested' || appointment.status === 'confirmed') && (
                <>
                  <Button type="button" size="sm" variant="secondary" onClick={() => void handleStatus('completed')}>
                    Realizado
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-800 hover:bg-rose-50"
                    onClick={() => void handleStatus('no_show')}
                  >
                    Não compareceu
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              loading={updateMut.isPending}
              onClick={() => void handleCancel()}
            >
              Cancelar agendamento
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
