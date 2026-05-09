import { listDoctorAvailability, listAppointments } from '@/features/agenda/api'
import type { Appointment, AppointmentType } from '@/features/agenda/types'
import {
  addDays,
  combineDateAndTime,
  rangeToISOStrings,
  toISODateString,
} from '@/features/agenda/utils/calendar'
import { computeDaySlotsFromDoctorAvailability } from '@/features/agenda/utils/computeDaySlotsFromAvailability'
import { normalizeSlotTimeValue } from '@/features/agenda/utils/normalizeAvailableSlots'

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

/** Campos suficientes para checagem de sobreposição com `computeDaySlotsFromDoctorAvailability`. */
function appointmentsForOverlap(
  rows: Appointment[],
  excludingId?: string
): Pick<Appointment, 'scheduled_at' | 'duration_minutes' | 'status'>[] {
  return rows
    .filter((a) => a.id !== excludingId)
    .map((a) => ({
      scheduled_at: a.scheduled_at,
      duration_minutes: a.duration_minutes,
      status: a.status,
    }))
}

/**
 * Primeiro slot livre no período — **somente** a partir de `doctor_availability`
 * (tipo de consulta + janelas ativas), descontando conflitos da lista de consultas REST.
 * Não usa Edge Function (`get-available-slots`).
 */
export async function findFirstAvailableSlot(params: {
  doctorId: string
  appointmentType: AppointmentType
  /** Só são retornadas combinações data/hora com `scheduled_at` ≥ este instante */
  fromDate: Date
  maxDays?: number
  /** Ex.: própria consulta em reagendamento automático, para liberar o horário atual. */
  excludeAppointmentId?: string
}): Promise<{ scheduled_at: string } | null> {
  const maxDays = params.maxDays ?? 21
  const notBeforeMs = params.fromDate.getTime()

  const availRows = await listDoctorAvailability({
    doctor_id: params.doctorId,
    select: '*',
  })
  if (!availRows.length) return null

  const iterationStartDay = startOfLocalDay(params.fromDate)
  const iterationEndDay = addDays(iterationStartDay, maxDays)
  const { from: rangeFrom, to: rangeTo } = rangeToISOStrings(iterationStartDay, iterationEndDay)

  const apptRows = await listAppointments({
    doctorIds: [params.doctorId],
    scheduledFrom: rangeFrom,
    scheduledTo: rangeTo,
  })
  const overlapping = appointmentsForOverlap(apptRows, params.excludeAppointmentId)

  for (let i = 0; i <= maxDays; i++) {
    const d = addDays(iterationStartDay, i)
    const dateISO = toISODateString(d)

    const slots = computeDaySlotsFromDoctorAvailability({
      dateISO,
      appointmentType: params.appointmentType,
      rows: availRows,
      existingAppointments: overlapping,
    })

    for (const s of slots) {
      if (!s.time?.trim()) continue
      const scheduled_at = combineDateAndTime(dateISO, normalizeSlotTimeValue(s.time))
      if (new Date(scheduled_at).getTime() >= notBeforeMs) {
        return { scheduled_at }
      }
    }
  }

  return null
}
