import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  batchPatientNames,
  createAppointment,
  createDoctorException,
  listAppointments,
  listDoctorExceptions,
  postGetAvailableSlots,
  updateAppointment,
} from '@/features/agenda/api'
import type {
  AppointmentType,
  AppointmentStatus,
  CreateAppointmentPayload,
  CreateDoctorExceptionPayload,
  DoctorException,
  EnrichedAppointment,
  ListAppointmentsParams,
} from '@/features/agenda/types'

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
        date: date!,
      }),
    enabled: enabled && !!doctorId && !!date,
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
      payload: Partial<{ status: AppointmentStatus; duration_minutes: number; scheduled_at: string }>
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
