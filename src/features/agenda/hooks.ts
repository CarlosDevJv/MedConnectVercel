import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  batchPatientNames,
  createAppointment,
  createDoctorAvailability,
  createDoctorException,
  createWaitlistEntry,
  deleteDoctorAvailability,
  deleteWaitlistEntry,
  listAppointmentWaitlist,
  listAppointments,
  listDoctorAvailability,
  listDoctorExceptions,
  postGetAvailableSlots,
  updateAppointment,
  updateDoctorAvailability,
  updateWaitlistEntry,
} from '@/features/agenda/api'
import type {
  AppointmentType,
  AppointmentStatus,
  CreateAppointmentPayload,
  CreateDoctorAvailabilityPayload,
  CreateDoctorExceptionPayload,
  CreateWaitlistPayload,
  DoctorException,
  EnrichedAppointment,
  ListAppointmentsParams,
  UpdateDoctorAvailabilityPayload,
  UpdateWaitlistPayload,
  WaitlistStatus,
  EnrichedWaitlistItem,
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

export function useWaitlistQuery(params: { doctor_id?: string; status?: WaitlistStatus }, enabled = true) {
  return useQuery({
    queryKey: ['agenda', 'waitlist', params] as const,
    queryFn: () => listAppointmentWaitlist(params),
    enabled,
  })
}

export function useWaitlistEnrichedQuery(
  params: { doctor_id?: string; status?: WaitlistStatus },
  enabled = true
) {
  return useQuery({
    queryKey: ['agenda', 'waitlist-enriched', params] as const,
    queryFn: async (): Promise<EnrichedWaitlistItem[]> => {
      const items = await listAppointmentWaitlist(params)
      const names = await batchPatientNames(items.map((i) => i.patient_id))
      return items.map((i) => ({
        ...i,
        patient_name: names[i.patient_id] ?? 'Paciente',
      }))
    },
    enabled,
  })
}

export function useCreateWaitlistMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateWaitlistPayload) => createWaitlistEntry(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'waitlist'] })
      void qc.invalidateQueries({ queryKey: ['agenda', 'waitlist-enriched'] })
    },
  })
}

export function useUpdateWaitlistMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateWaitlistPayload }) =>
      updateWaitlistEntry(args.id, args.payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'waitlist'] })
      void qc.invalidateQueries({ queryKey: ['agenda', 'waitlist-enriched'] })
    },
  })
}

export function useDeleteWaitlistMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWaitlistEntry(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda', 'waitlist'] })
      void qc.invalidateQueries({ queryKey: ['agenda', 'waitlist-enriched'] })
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
