import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  batchPatientNames,
  createAppointment,
  createDoctorAvailability,
  createDoctorException,
  deleteDoctorAvailability,
  listAppointments,
  listDoctorAvailability,
  listDoctorExceptions,
  postGetAvailableSlots,
  updateAppointment,
  updateDoctorAvailability,
} from '@/features/agenda/api'
import type {
  AppointmentType,
  AppointmentStatus,
  AvailableSlotItem,
  CreateAppointmentPayload,
  CreateDoctorAvailabilityPayload,
  CreateDoctorExceptionPayload,
  DoctorAvailability,
  DoctorException,
  EnrichedAppointment,
  ListAppointmentsParams,
  UpdateDoctorAvailabilityPayload,
  Appointment,
} from '@/features/agenda/types'
import { parseISODateLocal, rangeToISOStrings } from '@/features/agenda/utils/calendar'
import { collectAvailableWeekdaysUnion } from '@/features/agenda/utils/doctorAvailabilityWeekdays'
import { pgWeekdayToUi } from '@/features/agenda/utils/doctorAvailabilityWeekday'
import {
  computeDaySlotsFromDoctorAvailability,
  enrichSlotsWithDoctorAvailabilityDuration,
  appointmentBlocksSlotCandidate,
} from '@/features/agenda/utils/computeDaySlotsFromAvailability'
import { DOCTOR_AVAILABILITY_API_SLOT_DEFAULT } from '@/features/agenda/utils/doctorAvailabilityOpenApi'
import { filterSelectableSlots } from '@/features/agenda/utils/normalizeAvailableSlots'

export const agendaQueryKeys = {
  appointments: (p: ListAppointmentsParams) => ['agenda', 'appointments', p] as const,
  slotsDay: (doctorId: string, date: string, type: AppointmentType) =>
    ['agenda', 'slots', doctorId, date, type] as const,
  slotsRange: (doctorId: string, start: string, end: string, type: AppointmentType) =>
    ['agenda', 'slots-range', doctorId, start, end, type] as const,
}

export function useAppointmentsQuery(params: ListAppointmentsParams, enabled = true) {
  return useQuery({
    queryKey: agendaQueryKeys.appointments(params),
    queryFn: async () => {
      const items = await listAppointments(params)
      const patientIds = items.map((a) => a.patient_id)
      const names = await batchPatientNames(patientIds)
      const enriched: EnrichedAppointment[] = items.map((a) => ({
        ...a,
        patient_name: names[a.patient_id] ?? 'Paciente',
      }))
      return enriched
    },
    enabled,
  })
}

export function useDoctorExceptionsQuery(params: {
  dateFrom?: string
  dateTo?: string
  doctor_id?: string
}) {
  return useQuery({
    queryKey: ['agenda', 'exceptions', params] as const,
    queryFn: (): Promise<DoctorException[]> => listDoctorExceptions(params),
    enabled: !!params.dateFrom && !!params.dateTo,
  })
}

/**
 * Slots de um único dia. Usa o mesmo payload da variante “intervalo” da Edge Function
 * (`start_date` + `end_date` iguais): muitos backends só aceitam esse formato e rejeitam `{ date }`.
 */
export function useAvailableSlotsDayQuery(
  doctorId: string | undefined,
  date: string | undefined,
  appointmentType: AppointmentType,
  enabled: boolean
) {
  return useQuery({
    queryKey: agendaQueryKeys.slotsDay(doctorId ?? '', date ?? '', appointmentType),
    queryFn: () =>
      postGetAvailableSlots({
        doctor_id: doctorId!,
        start_date: date!,
        end_date: date!,
        appointment_type: appointmentType,
      }),
    enabled: enabled && !!doctorId && !!date,
    retry: false,
  })
}

export function useAvailableSlotsRangeQuery(
  doctorId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  appointmentType: AppointmentType,
  enabled: boolean
) {
  return useQuery({
    queryKey: agendaQueryKeys.slotsRange(
      doctorId ?? '',
      startDate ?? '',
      endDate ?? '',
      appointmentType
    ),
    queryFn: () =>
      postGetAvailableSlots({
        doctor_id: doctorId!,
        start_date: startDate!,
        end_date: endDate!,
        appointment_type: appointmentType,
      }),
    enabled: enabled && !!doctorId && !!startDate && !!endDate,
    retry: false,
  })
}

export function useCreateAppointmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'appointments'] })
    },
  })
}

export function useUpdateAppointmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      id: string
      payload: Partial<{
        status: AppointmentStatus
        duration_minutes: number
        scheduled_at: string
        notes: string | null
        appointment_type: AppointmentType | null
        reminder_enabled: boolean
        last_reminder_sent_at: string | null
      }>
    }) => updateAppointment(args.id, args.payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'appointments'] })
    },
  })
}

export function useCreateBlockExceptionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDoctorExceptionPayload) => createDoctorException(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda'] })
    },
  })
}

export function useDoctorAvailabilityListQuery(doctorId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['agenda', 'doctor-availability', doctorId] as const,
    queryFn: () =>
      listDoctorAvailability({
        doctor_id: doctorId,
        select: '*',
      }),
    enabled: enabled && !!doctorId,
  })
}

/** União dos dias da semana (0 dom … 6 sáb) com janelas ativas para os médicos indicados — visão lista/mês agenda. */
export function useDoctorAvailabilityUnionWeekdaysQuery(doctorIds: string[], enabled: boolean) {
  const sortedIds = React.useMemo(() => [...doctorIds].sort(), [doctorIds.join(',')])
  const joinKey = sortedIds.join(',')

  return useQuery({
    queryKey: ['agenda', 'doctor-availability-weekdays', joinKey],
    queryFn: () =>
      listDoctorAvailability({
        doctorIds: sortedIds.length ? sortedIds : undefined,
        select: 'weekday,active',
      }),
    enabled: enabled && sortedIds.length > 0,
    select: (rows: DoctorAvailability[]) => collectAvailableWeekdaysUnion(rows),
  })
}

export function useCreateDoctorAvailabilityMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDoctorAvailabilityPayload) => createDoctorAvailability(payload),
    onSuccess: (_d, payload) => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'doctor-availability', payload.doctor_id] })
    },
  })
}

export function useUpdateDoctorAvailabilityMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; doctorId: string; payload: UpdateDoctorAvailabilityPayload }) =>
      updateDoctorAvailability(args.id, args.payload),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'doctor-availability', args.doctorId] })
    },
  })
}

export function useDeleteDoctorAvailabilityMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; doctorId: string }) => deleteDoctorAvailability(args.id),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'doctor-availability', args.doctorId] })
    },
  })
}

export interface ResolvedAppointmentSlotsResult {
  slotItems: AvailableSlotItem[]
  slotsLoading: boolean
  slotsError: boolean
  /** Horários vindos só de `doctor_availability` (Edge Function sem slots ou vazia). */
  usedAvailabilityFallback: boolean
  slotsQueryError: unknown
}

/**
 * Lista final para selects de horário: tenta `/get-available-slots` e volta para a disponibilidade
 * cadastrada no REST (`doctor_availability`), alinhado ao modelo RiseUP do plano de agenda.
 */
export function useResolvedAppointmentFormSlots(opts: {
  sheetOpen: boolean
  calendarEnabled: boolean
  doctorId: string | undefined
  dateISO: string | undefined
  appointmentType: AppointmentType
}): ResolvedAppointmentSlotsResult {
  const dateTrim = opts.dateISO?.trim() ?? ''
  const baseEnabled =
    opts.sheetOpen && opts.calendarEnabled && !!opts.doctorId && dateTrim.length > 0

  const slotsQuery = useAvailableSlotsDayQuery(
    opts.doctorId,
    opts.dateISO,
    opts.appointmentType,
    baseEnabled
  )

  const availabilityQuery = useDoctorAvailabilityListQuery(
    opts.doctorId,
    opts.sheetOpen && opts.calendarEnabled && !!opts.doctorId
  )

  const dayRange = React.useMemo(() => {
    if (!opts.dateISO) return null
    const d = parseISODateLocal(opts.dateISO)
    return rangeToISOStrings(d, d)
  }, [opts.dateISO])

  const dayAppointmentsParams = React.useMemo((): ListAppointmentsParams => {
    if (!opts.doctorId || !dayRange) {
      return { doctorIds: [] }
    }
    return {
      scheduledFrom: dayRange.from,
      scheduledTo: dayRange.to,
      doctorIds: [opts.doctorId],
    }
  }, [dayRange, opts.doctorId])

  const dayAppointmentsEnabled = Boolean(
    opts.sheetOpen && opts.calendarEnabled && !!opts.doctorId && !!dayRange?.from
  )

  const appointmentsDayQuery = useAppointmentsQuery(dayAppointmentsParams, dayAppointmentsEnabled)

  const fallbackSlots = React.useMemo(() => {
    if (!opts.doctorId || !opts.dateISO) return []
    const rows = availabilityQuery.data ?? []
    const apps: Pick<Appointment, 'scheduled_at' | 'duration_minutes' | 'status'>[] =
      appointmentsDayQuery.data ?? []
    return computeDaySlotsFromDoctorAvailability({
      dateISO: opts.dateISO,
      appointmentType: opts.appointmentType,
      rows,
      existingAppointments: apps,
    })
  }, [
    appointmentsDayQuery.data,
    availabilityQuery.data,
    opts.appointmentType,
    opts.dateISO,
    opts.doctorId,
  ])

  return React.useMemo(() => {
    const rows = availabilityQuery.data ?? []
    const fromApi = filterSelectableSlots(slotsQuery.data ?? [])


    let items = fromApi
    let usedFallback = false

    if (fallbackSlots.length > 0) {
      items = fallbackSlots
      usedFallback = true
    }

    const existing = appointmentsDayQuery.data ?? []

    const parseTimeToMinutes = (timeStr: string) => {
      const parts = timeStr.split(':')
      const hours = parseInt(parts[0] ?? '0', 10)
      const minutes = parseInt(parts[1] ?? '0', 10)
      return hours * 60 + minutes
    }

    const dow = opts.dateISO ? parseISODateLocal(opts.dateISO).getDay() : null

    let strictlyAvailableItems = items
    if (opts.dateISO && rows.length > 0) {
      strictlyAvailableItems = items.filter((slot) => {
        const activeAvailsForDay = rows.filter((av) => {
          if (!av.active) return false
          const avWeekday = pgWeekdayToUi(av.weekday)
          return avWeekday === dow
        })
        
        return activeAvailsForDay.some((av) => {
          const startMinutes = parseTimeToMinutes(av.start_time)
          const endMinutes = parseTimeToMinutes(av.end_time)
          const apptMinutes = parseTimeToMinutes(slot.time)
          return apptMinutes >= startMinutes && apptMinutes < endMinutes
        })
      })
    }

    let filteredItems = strictlyAvailableItems
    if (opts.dateISO && existing.length > 0) {
      filteredItems = strictlyAvailableItems.filter((slot) => {
        const step = slot.duration_minutes ?? DOCTOR_AVAILABILITY_API_SLOT_DEFAULT
        const blocked = existing.some((appt) =>
          appointmentBlocksSlotCandidate({
            dateISO: opts.dateISO!,
            candidateTimeHHmm: slot.time,
            newDurationMin: step,
            appt,
          })
        )
        return !blocked
      })
    }

    const slotItems = enrichSlotsWithDoctorAvailabilityDuration(
      filteredItems,
      opts.dateISO,
      opts.appointmentType,
      rows
    )

    return {
      slotItems,
      slotsLoading: slotsQuery.isPending,
      slotsError: slotsQuery.isError,
      usedAvailabilityFallback: usedFallback,
      slotsQueryError: slotsQuery.error,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    availabilityQuery.data,
    fallbackSlots,
    opts.appointmentType,
    opts.dateISO,
    slotsQuery.data,
    slotsQuery.error,
    slotsQuery.isError,
    slotsQuery.isFetched,
    slotsQuery.isPending,
  ])
}
