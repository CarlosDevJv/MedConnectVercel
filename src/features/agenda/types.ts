/** Alinhado ao Apidog: REST appointments + doctor_availability + doctor_exceptions + get-available-slots */

export const APPOINTMENT_STATUSES = [
  'requested',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
}

export const APPOINTMENT_TYPES = ['presencial', 'telemedicina'] as const
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number]

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  presencial: 'Presencial',
  telemedicina: 'Telemedicina',
}

export const DOCTOR_EXCEPTION_KINDS = ['bloqueio', 'disponibilidade_extra'] as const
export type DoctorExceptionKind = (typeof DOCTOR_EXCEPTION_KINDS)[number]

/** GET /rest/v1/appointments — response item (campos documentados + duration_minutes se existir na tabela) */
export interface Appointment {
  id: string
  doctor_id: string
  patient_id: string
  scheduled_at: string
  status: AppointmentStatus
  duration_minutes?: number | null
  /** presencial | telemedicina — requer migração `appointments.appointment_type` */
  appointment_type?: AppointmentType | null
  notes?: string | null
  reminder_enabled?: boolean | null
  last_reminder_sent_at?: string | null
}

export interface CreateAppointmentPayload {
  doctor_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes?: number
  status?: AppointmentStatus
  created_by: string
  appointment_type?: AppointmentType
  notes?: string | null
  reminder_enabled?: boolean
}

export type WaitlistStatus = 'waiting' | 'offered' | 'booked' | 'cancelled'

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  waiting: 'Aguardando',
  offered: 'Vaga ofertada',
  booked: 'Convertido',
  cancelled: 'Cancelado',
}

export interface AppointmentWaitlist {
  id: string
  doctor_id: string
  patient_id: string
  appointment_type: AppointmentType | null
  notes: string | null
  window_start: string
  window_end: string | null
  status: WaitlistStatus
  priority: number
  created_at: string
  created_by: string | null
}

export interface CreateWaitlistPayload {
  doctor_id: string
  patient_id: string
  window_start: string
  window_end?: string | null
  appointment_type?: AppointmentType | null
  notes?: string | null
  priority?: number
  created_by?: string | null
}

export interface UpdateWaitlistPayload {
  status?: WaitlistStatus
  window_start?: string
  window_end?: string | null
  notes?: string | null
  priority?: number
}

export interface EnrichedWaitlistItem extends AppointmentWaitlist {
  patient_name: string
}

export interface ListAppointmentsParams {
  /** Filtro PostgREST doctor_id=in.(a,b) quando múltiplos */
  doctorIds?: string[]
  patient_id?: string
  status?: AppointmentStatus
  /** ISO 8601 inclusive */
  scheduledFrom?: string
  scheduledTo?: string
}

export interface DoctorAvailability {
  id: string
  doctor_id: string
  weekday: number
  start_time: string
  end_time: string
  slot_minutes: number | null
  appointment_type: AppointmentType | null
  active: boolean | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateDoctorAvailabilityPayload {
  doctor_id: string
  weekday: number
  start_time: string
  end_time: string
  slot_minutes?: number
  appointment_type?: AppointmentType
  active?: boolean
}

export type UpdateDoctorAvailabilityPayload = Partial<{
  start_time: string
  end_time: string
  slot_minutes: number
  active: boolean
  appointment_type: AppointmentType
}>

export interface DoctorException {
  id: string
  doctor_id: string
  date: string
  kind: DoctorExceptionKind
  start_time: string | null
  end_time: string | null
  reason: string | null
  created_at?: string | null
  created_by?: string | null
}

export interface CreateDoctorExceptionPayload {
  doctor_id: string
  date: string
  kind: DoctorExceptionKind
  start_time?: string | null
  end_time?: string | null
  reason?: string | null
  created_by: string
}

/** POST /functions/v1/get-available-slots — variante por dia (Apidog: Calcular slots) */
export interface GetAvailableSlotsDayBody {
  doctor_id: string
  date: string
}

/** POST /functions/v1/get-available-slots — variante intervalo (Apidog: Buscar slots) */
export interface GetAvailableSlotsRangeBody {
  doctor_id: string
  start_date: string
  end_date: string
  appointment_type?: AppointmentType
}

export interface AvailableSlotItem {
  date?: string
  time: string
  datetime?: string
  available: boolean
}

export interface GetAvailableSlotsResponse {
  slots: AvailableSlotItem[]
}

export type AgendaViewMode = 'month' | 'week' | 'day' | 'list'

/** Agendar → modalidade de agenda (UI); slots usam appointment_type presencial/telemedicina */
export type ScheduleIntent = 'atendimento' | 'sessoes' | 'urgencia'

export const SCHEDULE_INTENT_LABELS: Record<ScheduleIntent, string> = {
  atendimento: 'Atendimento',
  sessoes: 'Sessões',
  urgencia: 'Urgência',
}

export interface EnrichedAppointment extends Appointment {
  patient_name?: string
  doctor_name?: string
}
