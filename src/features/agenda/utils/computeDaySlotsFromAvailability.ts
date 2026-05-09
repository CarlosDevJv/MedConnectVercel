import type { Appointment, AppointmentType, AvailableSlotItem, DoctorAvailability } from '@/features/agenda/types'
import { combineDateAndTime, parseISODateLocal } from '@/features/agenda/utils/calendar'
import {
  DOCTOR_AVAILABILITY_API_SLOT_DEFAULT,
  DOCTOR_AVAILABILITY_API_SLOT_MAX,
  DOCTOR_AVAILABILITY_API_SLOT_MIN,
} from '@/features/agenda/utils/doctorAvailabilityOpenApi'
import { pgWeekdayToUi } from '@/features/agenda/utils/doctorAvailabilityWeekday'
import { normalizeSlotTimeValue } from '@/features/agenda/utils/normalizeAvailableSlots'

function postgresTimeOrIsoToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hh = Number(m[1])
  const mi = Number(m[2])
  if (Number.isNaN(hh) || Number.isNaN(mi) || hh > 23 || mi > 59) return null
  return hh * 60 + mi
}

function minutesToNormalizedHHmm(totalMins: number): string {
  const hh = Math.floor(totalMins / 60)
  const mm = totalMins % 60
  return normalizeSlotTimeValue(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
}

function weekdayJsFromDateISO(dateISO: string): number {
  return parseISODateLocal(dateISO).getDay()
}

function matchesAppointmentFilter(
  rowType: AppointmentType | null | undefined,
  requested: AppointmentType
): boolean {
  if (!rowType) return true
  return rowType === requested
}

function clampSlotMinutes(raw: number | null | undefined): number {
  return Math.min(
    DOCTOR_AVAILABILITY_API_SLOT_MAX,
    Math.max(DOCTOR_AVAILABILITY_API_SLOT_MIN, raw ?? DOCTOR_AVAILABILITY_API_SLOT_DEFAULT)
  )
}

function appointmentBlocksSlotCandidate(options: {
  dateISO: string
  candidateTimeHHmm: string
  newDurationMin: number
  appt: Pick<Appointment, 'scheduled_at' | 'duration_minutes' | 'status'>
}): boolean {
  if (options.appt.status === 'cancelled') return false
  try {
    const slotStartMs = new Date(
      combineDateAndTime(options.dateISO, normalizeSlotTimeValue(options.candidateTimeHHmm))
    ).getTime()
    const slotDur = Math.max(5, Math.min(options.newDurationMin || 30, 8 * 60))
    const slotEndMs = slotStartMs + slotDur * 60_000

    const apptStartMs = new Date(options.appt.scheduled_at).getTime()
    if (Number.isNaN(slotStartMs) || Number.isNaN(apptStartMs)) return false

    const apptDurMin = Math.max(5, options.appt.duration_minutes ?? DOCTOR_AVAILABILITY_API_SLOT_DEFAULT)
    const apptEndMs = apptStartMs + apptDurMin * 60_000

    return slotStartMs < apptEndMs && slotEndMs > apptStartMs
  } catch {
    return false
  }
}

/** Duração da consulta = `slot_minutes` da janela (`doctor_availability`) que inclui esse início de slot. */
export function resolveAppointmentDurationMinutes(
  dateISO: string,
  timeHHmm: string,
  appointmentType: AppointmentType,
  rows: DoctorAvailability[]
): number {
  const norm = normalizeSlotTimeValue(timeHHmm)
  const tMin = postgresTimeOrIsoToMinutes(norm)
  if (tMin === null) return DOCTOR_AVAILABILITY_API_SLOT_DEFAULT

  const dow = weekdayJsFromDateISO(dateISO)

  for (const row of rows) {
    const active = row.active !== false && row.active !== null
    if (!active) continue
    const rowDow = pgWeekdayToUi(row.weekday)
    if (rowDow !== dow || rowDow === null) continue
    if (!matchesAppointmentFilter(row.appointment_type, appointmentType)) continue

    const step = clampSlotMinutes(row.slot_minutes)
    const startM = postgresTimeOrIsoToMinutes(row.start_time ?? '')
    const endM = postgresTimeOrIsoToMinutes(row.end_time ?? '')
    if (startM === null || endM === null || startM >= endM) continue
    if (tMin < startM || tMin + step > endM) continue
    const offset = tMin - startM
    if (offset < 0 || offset % step !== 0) continue
    return step
  }

  return DOCTOR_AVAILABILITY_API_SLOT_DEFAULT
}

export function enrichSlotsWithDoctorAvailabilityDuration(
  slots: AvailableSlotItem[],
  dateISO: string | undefined,
  appointmentType: AppointmentType,
  rows: DoctorAvailability[]
): AvailableSlotItem[] {
  if (!dateISO?.trim()) return slots
  return slots.map((s) => ({
    ...s,
    duration_minutes:
      typeof s.duration_minutes === 'number' &&
      Number.isFinite(s.duration_minutes) &&
      s.duration_minutes >= DOCTOR_AVAILABILITY_API_SLOT_MIN
        ? s.duration_minutes
        : resolveAppointmentDurationMinutes(dateISO, s.time, appointmentType, rows),
  }))
}

/**
 * Monta lista a partir de `doctor_availability`; cada slot usa o `slot_minutes` da janela para grade e ocupação.
 */
export function computeDaySlotsFromDoctorAvailability(params: {
  dateISO: string
  appointmentType: AppointmentType
  rows: DoctorAvailability[]
  existingAppointments: Pick<Appointment, 'scheduled_at' | 'duration_minutes' | 'status'>[]
}): AvailableSlotItem[] {
  const dow = weekdayJsFromDateISO(params.dateISO)
  const slotStarts = new Map<string, number>()

  for (const row of params.rows) {
    const active = row.active !== false && row.active !== null
    if (!active) continue
    const rowDow = pgWeekdayToUi(row.weekday)
    if (rowDow !== dow || rowDow === null) continue
    if (!matchesAppointmentFilter(row.appointment_type, params.appointmentType)) continue

    const step = clampSlotMinutes(row.slot_minutes)
    const startM = postgresTimeOrIsoToMinutes(row.start_time ?? '')
    const endM = postgresTimeOrIsoToMinutes(row.end_time ?? '')
    if (startM === null || endM === null || startM >= endM) continue

    for (let t = startM; t + step <= endM; t += step) {
      const hhmm = minutesToNormalizedHHmm(t)
      if (!slotStarts.has(hhmm)) slotStarts.set(hhmm, step)
    }
  }

  const sortedKeys = [...slotStarts.keys()].sort((a, b) => {
    const ma = postgresTimeOrIsoToMinutes(a) ?? 0
    const mb = postgresTimeOrIsoToMinutes(b) ?? 0
    return ma - mb
  })

  const free: AvailableSlotItem[] = []
  for (const hhmm of sortedKeys) {
    const step = slotStarts.get(hhmm) ?? DOCTOR_AVAILABILITY_API_SLOT_DEFAULT
    const blocked = params.existingAppointments.some((appt) =>
      appointmentBlocksSlotCandidate({
        dateISO: params.dateISO,
        candidateTimeHHmm: hhmm,
        newDurationMin: step,
        appt,
      })
    )
    if (!blocked) free.push({ time: hhmm, available: true, duration_minutes: step })
  }
  return free
}
