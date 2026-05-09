import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/ui/field-error'
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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AppointmentAvailabilityDatePicker } from '@/features/agenda/components/AppointmentAvailabilityDatePicker'
import {
  useCreateAppointmentMutation,
  useCreateBlockExceptionMutation,
  useResolvedAppointmentFormSlots,
} from '@/features/agenda/hooks'
import type { AppointmentType, ScheduleIntent } from '@/features/agenda/types'
import { SCHEDULE_INTENT_LABELS } from '@/features/agenda/types'
import { combineDateAndTime } from '@/features/agenda/utils/calendar'
import { DOCTOR_AVAILABILITY_API_SLOT_DEFAULT } from '@/features/agenda/utils/doctorAvailabilityOpenApi'
import type { Doctor } from '@/features/doctors/types'
import { listPatients } from '@/features/patients/api'
import { ApiError } from '@/lib/apiClient'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { formatPostgresLocalTimePtBr } from '@/lib/formatTimePtBr'
import { useQuery } from '@tanstack/react-query'

function intentToAppointmentType(intent: ScheduleIntent): AppointmentType {
  if (intent === 'sessoes') return 'telemedicina'
  return 'presencial'
}

function describeSlotsQueryError(err: unknown): string | null {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return null
}

interface FormValues {
  doctor_id: string
  patient_id: string
  date: string
  time: string
  notes: string
}

export interface NewAppointmentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  intent: ScheduleIntent
  userId: string
  doctors: Doctor[]
  linkedDoctorId?: string
  defaultDate: string
  onCompleted?: () => void
}

export function NewAppointmentSheet({
  open,
  onOpenChange,
  intent,
  userId,
  doctors,
  linkedDoctorId,
  defaultDate,
  onCompleted,
}: NewAppointmentSheetProps) {
  const [tab, setTab] = React.useState<'agendamento' | 'outros'>('agendamento')
  const [patientQuery, setPatientQuery] = React.useState('')
  const debouncedPatient = useDebouncedValue(patientQuery, 320)
  const [blockAgenda, setBlockAgenda] = React.useState(false)
  const [blockReason, setBlockReason] = React.useState('Bloqueio de agenda')

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      doctor_id: linkedDoctorId ?? '',
      patient_id: '',
      date: defaultDate,
      time: '',
      notes: '',
    },
  })

  const doctorId = useWatch({ control, name: 'doctor_id' })
  const dateVal = useWatch({ control, name: 'date' })
  const patientId = useWatch({ control, name: 'patient_id' })
  const timeVal = useWatch({ control, name: 'time' })
  const appointmentType = intentToAppointmentType(intent)

  const {
    slotItems,
    slotsLoading,
    slotsError,
    usedAvailabilityFallback,
    slotsQueryError,
  } = useResolvedAppointmentFormSlots({
    sheetOpen: open,
    calendarEnabled: !blockAgenda,
    doctorId: doctorId || undefined,
    dateISO: dateVal,
    appointmentType,
  })

  React.useEffect(() => {
    if (!timeVal) return
    if (!slotItems.some((s) => s.time === timeVal)) {
      setValue('time', '')
    }
  }, [doctorId, dateVal, timeVal, slotItems, setValue])

  const patientsSearch = useQuery({
    queryKey: ['agenda', 'patient-search', debouncedPatient],
    queryFn: () => listPatients({ search: debouncedPatient, pageSize: 15 }),
    enabled: open && debouncedPatient.trim().length >= 2,
  })

  const createMut = useCreateAppointmentMutation()
  const blockMut = useCreateBlockExceptionMutation()

  async function onSubmit(values: FormValues) {
    if (!values.doctor_id) {
      toast.error('Selecione o profissional.')
      return
    }
    if (blockAgenda) {
      try {
        await blockMut.mutateAsync({
          doctor_id: values.doctor_id,
          date: values.date,
          kind: 'bloqueio',
          start_time: null,
          end_time: null,
          reason: blockReason || null,
          created_by: userId,
        })
        toast.success('Bloqueio criado.')
        onOpenChange(false)
        onCompleted?.()
      } catch (e) {
        console.error(e)
        toast.error('Não foi possível criar o bloqueio.')
      }
      return
    }
    if (!values.patient_id) {
      toast.error('Selecione o paciente.')
      return
    }
    if (!values.time) {
      toast.error('Selecione o horário.')
      return
    }
    const scheduled_at = combineDateAndTime(values.date, values.time)
    const slot = slotItems.find((s) => s.time === values.time)
    const durationMinutes =
      typeof slot?.duration_minutes === 'number' && Number.isFinite(slot.duration_minutes)
        ? slot.duration_minutes
        : DOCTOR_AVAILABILITY_API_SLOT_DEFAULT
    try {
      await createMut.mutateAsync({
        doctor_id: values.doctor_id,
        patient_id: values.patient_id,
        scheduled_at,
        duration_minutes: durationMinutes,
        status: 'requested',
        created_by: userId,
        appointment_type: appointmentType,
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
      })
      toast.success('Agendamento criado.')
      onOpenChange(false)
      onCompleted?.()
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível criar o agendamento.')
    }
  }

  const activeDoctors = doctors.filter((d) => d.active !== false)

  const selectedPatientLabel = patientsSearch.data?.items.find((p) => p.id === patientId)?.full_name

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Novo agendamento</SheetTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {SCHEDULE_INTENT_LABELS[intent]} ·{' '}
            {appointmentType === 'telemedicina' ? 'Telemedicina' : 'Presencial'}
          </p>
        </SheetHeader>

        <div className="flex gap-2 border-b border-[var(--color-border)] px-6">
          <button
            type="button"
            className={`border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              tab === 'agendamento'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            }`}
            onClick={() => setTab('agendamento')}
          >
            Agendamento
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed border-b-2 border-transparent px-2 py-3 text-sm text-[var(--color-muted-foreground)] opacity-50"
          >
            Procedimento
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed border-b-2 border-transparent px-2 py-3 text-sm text-[var(--color-muted-foreground)] opacity-50"
          >
            Financeiro
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-6 py-6">
          {tab === 'agendamento' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="doctor_id">Profissional</Label>
                <Select
                  value={doctorId}
                  onValueChange={(v) => setValue('doctor_id', v)}
                  disabled={!!linkedDoctorId}
                >
                  <SelectTrigger id="doctor_id">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appt-date-hidden">Data</Label>
                {blockAgenda ? (
                  <Input id="appt-date-hidden" type="date" lang="pt-BR" {...register('date', { required: true })} />
                ) : (
                  <>
                    <input id="appt-date-hidden" type="hidden" {...register('date', { required: true })} />
                    <AppointmentAvailabilityDatePicker
                      doctorId={doctorId || undefined}
                      appointmentType={appointmentType}
                      value={dateVal ?? ''}
                      onChange={(iso) => setValue('date', iso, { shouldValidate: true, shouldDirty: true })}
                      disabled={!doctorId}
                    />
                  </>
                )}
              </div>

              {!blockAgenda && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="patient_search">Paciente</Label>
                    <Input
                      id="patient_search"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                      placeholder="Buscar por nome ou CPF"
                    />
                    {patientId && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Selecionado: {selectedPatientLabel ?? patientId}
                      </p>
                    )}
                    {debouncedPatient.trim().length >= 2 && patientsSearch.data && (
                      <ul className="max-h-40 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 text-sm">
                        {patientsSearch.data.items.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="flex w-full px-3 py-2 text-left hover:bg-[var(--color-accent-soft)]/50"
                              onClick={() => {
                                setValue('patient_id', p.id)
                                setPatientQuery(p.full_name)
                              }}
                            >
                              <span>{p.full_name}</span>
                              <span className="ml-2 text-[var(--color-muted-foreground)]">{p.cpf}</span>
                            </button>
                          </li>
                        ))}
                        {patientsSearch.data.items.length === 0 && (
                          <li className="px-3 py-2 text-[var(--color-muted-foreground)]">
                            Nenhum paciente encontrado.
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appt-time">Horário (24 h)</Label>
                    <Select
                      value={timeVal}
                      onValueChange={(v) => setValue('time', v)}
                      disabled={slotsLoading}
                    >
                      <SelectTrigger id="appt-time">
                        <SelectValue
                          placeholder={slotsLoading ? 'Carregando…' : 'Escolha o horário'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {slotItems.map((s) => (
                          <SelectItem key={`${s.datetime ?? s.date ?? ''}-${s.time}`} value={s.time}>
                            {formatPostgresLocalTimePtBr(s.time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {usedAvailabilityFallback && slotItems.length > 0 && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Horários conforme a disponibilidade cadastrada do profissional.
                      </p>
                    )}
                    {slotsError && slotItems.length === 0 && !slotsLoading && (
                      <p className="text-xs text-amber-800">
                        <span className="font-medium">
                          Serviço de slots indisponível ou sem retorno neste momento.
                        </span>{' '}
                        {describeSlotsQueryError(slotsQueryError) ?? (
                          <>Confira disponibilidade do médico no cadastro ou tente mais tarde.</>
                        )}
                      </p>
                    )}
                    {!slotsLoading && !slotsError && slotItems.length === 0 && !!doctorId && !!dateVal && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Nenhum horário livre neste dia para o tipo de agenda e médico escolhidos. Ajuste a
                        data ou cadastre disponibilidade.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appt_notes_new">Observações</Label>
                    <textarea
                      id="appt_notes_new"
                      rows={2}
                      {...register('notes')}
                      className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/70 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                      placeholder="Opcional — visível para a equipe"
                    />
                  </div>
                </>
              )}

              {blockAgenda && (
                <div className="space-y-2">
                  <Label htmlFor="blockReason">Motivo do bloqueio</Label>
                  <Input
                    id="blockReason"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <FieldError message={errors.date?.message} />

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={blockAgenda} onCheckedChange={(v) => setBlockAgenda(v === true)} />
              Bloqueio de agenda
            </label>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-2 border-t-0 p-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMut.isPending || blockMut.isPending}>
              Salvar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
