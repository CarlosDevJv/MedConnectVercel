import { ApiError, apiClient } from '@/lib/apiClient'

import type {
  Appointment,
  AppointmentStatus,
  AvailableSlotItem,
  CreateAppointmentPayload,
  CreateDoctorAvailabilityPayload,
  CreateDoctorExceptionPayload,
  DoctorAvailability,
  DoctorException,
  GetAvailableSlotsDayBody,
  GetAvailableSlotsRangeBody,
  GetAvailableSlotsResponse,
  ListAppointmentsParams,
  UpdateDoctorAvailabilityPayload,
} from '@/features/agenda/types'

const APPOINTMENT_SELECT = 'id,doctor_id,patient_id,scheduled_at,status,duration_minutes'

function buildListAppointmentsPath(params: ListAppointmentsParams): string {
  const usp = new URLSearchParams()
  usp.set('select', APPOINTMENT_SELECT)
  usp.set('order', 'scheduled_at.asc')

  if (params.scheduledFrom && params.scheduledTo) {
    usp.set('and', `(scheduled_at.gte.${params.scheduledFrom},scheduled_at.lte.${params.scheduledTo})`)
  }

  if (params.doctorIds?.length === 1) {
    usp.set('doctor_id', `eq.${params.doctorIds[0]}`)
  } else if (params.doctorIds && params.doctorIds.length > 1) {
    usp.set('doctor_id', `in.(${params.doctorIds.join(',')})`)
  }

  if (params.patient_id) {
    usp.set('patient_id', `eq.${params.patient_id}`)
  }
  if (params.status) {
    usp.set('status', `eq.${params.status}`)
  }

  return `/rest/v1/appointments?${usp.toString()}`
}

export async function listAppointments(params: ListAppointmentsParams = {}): Promise<Appointment[]> {
  if (params.doctorIds?.length === 0) {
    return []
  }
  const path = buildListAppointmentsPath(params)
  return apiClient.get<Appointment[]>(path)
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const result = await apiClient.request<Appointment[]>({
    method: 'POST',
    path: '/rest/v1/appointments',
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  const row = result.data?.[0]
  if (!row) {
    throw new ApiError({ message: 'Agendamento criado sem corpo de resposta', status: 201 })
  }
  return row
}

/** Atualização parcial via PostgREST (útil p.ex. cancelar com status cancelled) */
export async function updateAppointment(
  id: string,
  payload: Partial<{ status: AppointmentStatus; duration_minutes: number; scheduled_at: string }>
): Promise<Appointment> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<Appointment[]>({
    method: 'PATCH',
    path: `/rest/v1/appointments?${usp.toString()}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  if (!result.data?.length) {
    throw new ApiError({ message: 'Agendamento não encontrado para atualizar', status: 404 })
  }
  return result.data[0]
}

/**
 * POST /functions/v1/get-available-slots
 * Aceita corpo por dia (Apidog: Calcular) ou intervalo (Apidog: Buscar).
 */
export async function postGetAvailableSlots(
  body: GetAvailableSlotsDayBody | GetAvailableSlotsRangeBody
): Promise<AvailableSlotItem[]> {
  const res = await apiClient.post<GetAvailableSlotsResponse, typeof body>(
    '/functions/v1/get-available-slots',
    body
  )
  return res.slots ?? []
}

export async function listDoctorAvailability(params: {
  doctor_id?: string
  weekday?: number
  active?: boolean
  appointment_type?: string
  select?: string
}): Promise<DoctorAvailability[]> {
  const usp = new URLSearchParams()
  usp.set('select', params.select ?? '*')
  usp.set('order', 'weekday.asc,start_time.asc')
  if (params.doctor_id) usp.set('doctor_id', `eq.${params.doctor_id}`)
  if (typeof params.weekday === 'number') usp.set('weekday', `eq.${params.weekday}`)
  if (typeof params.active === 'boolean') usp.set('active', `eq.${params.active}`)
  if (params.appointment_type) usp.set('appointment_type', `eq.${params.appointment_type}`)
  return apiClient.get<DoctorAvailability[]>(`/rest/v1/doctor_availability?${usp.toString()}`)
}

export async function createDoctorAvailability(
  payload: CreateDoctorAvailabilityPayload
): Promise<DoctorAvailability> {
  const result = await apiClient.request<DoctorAvailability[]>({
    method: 'POST',
    path: '/rest/v1/doctor_availability',
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  const row = result.data?.[0]
  if (!row) {
    throw new ApiError({ message: 'Disponibilidade criada sem corpo', status: 201 })
  }
  return row
}

export async function updateDoctorAvailability(
  id: string,
  payload: UpdateDoctorAvailabilityPayload
): Promise<DoctorAvailability> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  const result = await apiClient.request<DoctorAvailability[]>({
    method: 'PATCH',
    path: `/rest/v1/doctor_availability?${usp.toString()}`,
    body: payload,
    options: { headers: { Prefer: 'return=representation' } },
  })
  if (!result.data?.length) {
    throw new ApiError({ message: 'Disponibilidade não encontrada', status: 404 })
  }
  return result.data[0]
}

export async function deleteDoctorAvailability(id: string): Promise<void> {
  const usp = new URLSearchParams({ id: `eq.${id}` })
  await apiClient.del(`/rest/v1/doctor_availability?${usp.toString()}`)
}

export async function listDoctorExceptions(params: {
  doctor_id?: string
  date?: string
  kind?: string
  dateFrom?: string
  dateTo?: string
}): Promise<DoctorException[]> {
  const usp = new URLSearchParams()
  usp.set('select', '*')
  usp.set('order', 'date.asc')
  if (params.doctor_id) usp.set('doctor_id', `eq.${params.doctor_id}`)
  if (params.date) usp.set('date', `eq.${params.date}`)
  if (params.kind) usp.set('kind', `eq.${params.kind}`)
  if (params.dateFrom && params.dateTo) {
    usp.set('and', `(date.gte.${params.dateFrom},date.lte.${params.dateTo})`)
  }
  return apiClient.get<DoctorException[]>(`/rest/v1/doctor_exceptions?${usp.toString()}`)
}

export async function createDoctorException(
  payload: CreateDoctorExceptionPayload
): Promise<void> {
  await apiClient.post('/rest/v1/doctor_exceptions', payload)
}

export async function batchPatientNames(
  patientIds: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(patientIds.filter(Boolean))]
  if (!unique.length) return {}
  const usp = new URLSearchParams()
  usp.set('select', 'id,full_name')
  usp.set('id', `in.(${unique.join(',')})`)
  const rows = await apiClient.get<{ id: string; full_name: string }[]>(
    `/rest/v1/patients?${usp.toString()}`
  )
  return Object.fromEntries(rows.map((r) => [r.id, r.full_name]))
}
